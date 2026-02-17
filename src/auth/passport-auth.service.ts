import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { AuthCredential } from './entities/auth-credential.entity';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserMetadata } from './entities/user-metadata.entity';
import { OtpVerificationService } from './otp-verification.service';

@Injectable()
export class PassportAuthService {
  protected readonly logger = new Logger(PassportAuthService.name);
  private readonly bcryptRounds: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthCredential)
    private readonly credentialRepository: Repository<AuthCredential>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(UserMetadata)
    private readonly metadataRepository: Repository<UserMetadata>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly otpVerificationService: OtpVerificationService,
  ) {
    this.bcryptRounds = this.configService.get<number>(
      'auth.bcrypt.rounds',
      10,
    );
  }

  /**
   * Valida credenciales de usuario (usado por LocalStrategy)
   * SOLO permite login si el email está verificado
   */
  async validateUser(email: string, password: string): Promise<any> {
    const credential = await this.credentialRepository.findOne({
      where: { email },
      relations: ['user'],
    });

    if (!credential) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      credential.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    // VALIDAR QUE EL EMAIL ESTÉ VERIFICADO (usando tabla OtpVerification)
    const isEmailVerified =
      await this.otpVerificationService.isUserEmailVerified(credential.user.id);

    if (!isEmailVerified) {
      throw new NotFoundException('Email not verified');
    }

    return credential.user;
  }

  /**
   * Registra un nuevo usuario y envía OTP de verificación por email
   */
  async register(dto: RegisterDto) {
    // Crear un QueryRunner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();

    // Conectar y comenzar transacción
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar que email no exista
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new NotFoundException(`Email already exists`);
      }

      // Verificar también en credenciales (por si acaso)
      const existingCredential = await queryRunner.manager.findOne(
        AuthCredential,
        {
          where: { email: dto.email },
        },
      );

      if (existingCredential) {
        throw new NotFoundException(`Email already exists`);
      }

      // 2. Crear usuario en tabla users
      const user = queryRunner.manager.create(User, {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        isActive: true,
        role: 'user',
        authProvider: 'local',
        authMethod: 'password',
      });
      const savedUser = await queryRunner.manager.save(user);

      // 3. Hash password y crear credenciales
      const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);
      const credential = queryRunner.manager.create(AuthCredential, {
        userId: savedUser.id,
        email: dto.email,
        passwordHash,
        verificationToken: randomBytes(32).toString('hex'),
      });
      await queryRunner.manager.save(credential);

      // Commit de la transacción si todo salió bien

      // 4. ENVIAR OTP DE VERIFICACIÓN (fuera de la transacción)
      // let otpSessionId: string;
      const otpVerification =
        await this.otpVerificationService.createEmailVerificationOtp(savedUser);

      await queryRunner.commitTransaction();

      return {
        sessionId: otpVerification.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Login de usuario (solo si email está verificado)
   * Genera access token y refresh token
   */
  async login(user: User, ip?: string, userAgent?: string) {
    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    const accessToken = this.jwtService.sign(accessTokenPayload);

    // 2. Generar refresh token
    const refreshTokenValue = randomBytes(32).toString('hex');
    const refreshTokenHash = createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    const expiresAt = new Date();
    const refreshExpDays = this.configService.get<number>(
      'auth.jwt.refreshTokenExpirationDays',
      7,
    );
    expiresAt.setDate(expiresAt.getDate() + refreshExpDays);

    // 3. Guardar refresh token en BD
    const refreshToken = this.refreshTokenRepository.create({
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt,
      ipAddress: ip,
      userAgent,
    });
    await this.refreshTokenRepository.save(refreshToken);

    // 4. Actualizar last_login
    await this.credentialRepository.update(
      { userId: user.id },
      { lastLogin: new Date() },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      expires_in: 900,
      token_type: 'Bearer',
    };
  }

  /**
   * Renovar access token usando refresh token
   */
  async refreshAccessToken(refreshTokenValue: string) {
    // 1. Hash del token recibido
    const tokenHash = createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    // 2. Buscar token en BD
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new NotFoundException('Invalid refresh token');
    }

    // 3. DETECCIÓN DE REUTILIZACIÓN (token rotation attack)
    if (refreshToken.isRevoked) {
      // Token fue revocado, posible ataque
      // Revocar toda la familia de tokens
      await this.revokeTokenFamily(
        refreshToken.tokenFamily,
        'Token reuse detected',
      );
      throw new NotFoundException('Token reuse detected');
    }

    // 4. Verificar expiración
    if (new Date() > refreshToken.expiresAt) {
      throw new NotFoundException('Refresh token expired');
    }

    // 5. Generar nuevo access token
    const accessToken = this.jwtService.sign({
      sub: refreshToken.user.id,
      email: refreshToken.user.email,
      role: refreshToken.user.role || 'user',
    });

    // 6. Rotación de refresh token
    const newRefreshTokenValue = randomBytes(32).toString('hex');
    const newRefreshTokenHash = createHash('sha256')
      .update(newRefreshTokenValue)
      .digest('hex');

    const expiresAt = new Date();
    const refreshExpDays = this.configService.get<number>(
      'auth.jwt.refreshTokenExpirationDays',
      7,
    );
    expiresAt.setDate(expiresAt.getDate() + refreshExpDays);

    // 7. Crear nuevo refresh token (misma familia)
    const newRefreshToken = this.refreshTokenRepository.create({
      tokenHash: newRefreshTokenHash,
      userId: refreshToken.userId,
      expiresAt,
      tokenFamily: refreshToken.tokenFamily,
      ipAddress: refreshToken.ipAddress,
      userAgent: refreshToken.userAgent,
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    // 8. Revocar token antiguo
    await this.refreshTokenRepository.update(refreshToken.id, {
      isRevoked: true,
      revocationReason: 'replaced',
      revokedAt: new Date(),
      replacedByToken: newRefreshTokenHash,
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshTokenValue,
      expires_in: 900,
      token_type: 'Bearer',
    };
  }

  /**
   * Invalidar refresh token (logout)
   */
  async logout(refreshTokenValue: string) {
    const tokenHash = createHash('sha256')
      .update(refreshTokenValue)
      .digest('hex');

    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!refreshToken) {
      throw new NotFoundException('Invalid refresh token');
    }

    await this.refreshTokenRepository.update(refreshToken.id, {
      isRevoked: true,
      revocationReason: 'logout',
      revokedAt: new Date(),
    });

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Revocar todos los tokens de un usuario
   */
  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revocationReason: 'revoke_all',
        revokedAt: new Date(),
      },
    );

    return {
      message: 'All tokens revoked successfully',
    };
  }

  /**
   * Revocar toda una familia de tokens (detección de ataque)
   */
  private async revokeTokenFamily(
    tokenFamily: string,
    reason = 'suspicious',
  ): Promise<void> {
    await this.refreshTokenRepository.update(
      { tokenFamily, isRevoked: false },
      {
        isRevoked: true,
        revocationReason: reason,
        revokedAt: new Date(),
      },
    );
  }
}
