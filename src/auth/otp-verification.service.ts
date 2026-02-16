import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { OtpVerification } from './entities/otp-verification.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class OtpVerificationService {
  constructor(
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Crea OTP para verificación de email y lo envía
   */
  async createEmailVerificationOtp(user: User): Promise<OtpVerification> {
    // 1. Generar código OTP numérico de 6 dígitos
    const otpCodeLength = this.configService.get<number>('otp.codeLength', 6);
    const otpCode = this.generateNumericOtp(otpCodeLength);

    // 2. Hash del código (SHA256)
    const otpHash = createHash('sha256').update(otpCode).digest('hex');

    // 3. Calcular expiración
    const expirationMinutes = this.configService.get<number>(
      'otp.expirationMinutes',
      5,
    );
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    // 4. Crear registro en BD
    const otpVerification = this.otpRepository.create({
      userId: user.id,
      otpHash,
      expiresAt,
      attempts: 0,
      isVerified: false,
      isUsed: false,
    });

    const savedOtp = await this.otpRepository.save(otpVerification);

    // 5. Enviar email con código de verificación
    const displayName = user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user.email;

    await this.emailService.sendOtpEmail(user.email, otpCode, displayName);

    return savedOtp;
  }

  /**
   * Verifica el email del usuario con el código OTP
   */
  async verifyEmailWithOtp(sessionId: string, otpCode: string) {
    try {
      // 1. Buscar sesión OTP
      const otpSession = await this.otpRepository.findOne({
        where: { id: sessionId },
        relations: ['user'],
      });

      if (!otpSession) {
        throw new NotFoundException('Verification session not found');
      }

      // 2. Verificar si ya fue usado
      if (otpSession.isUsed) {
        throw new BadRequestException('Verification code already used');
      }

      // 3. Verificar expiración
      if (new Date() > otpSession.expiresAt) {
        throw new BadRequestException('Verification code expired');
      }

      // 4. Verificar límite de intentos
      const maxAttempts = this.configService.get<number>('otp.maxAttempts', 3);
      if (otpSession.attempts >= maxAttempts) {
        throw new BadRequestException(
          'Maximum verification attempts exceeded. Request a new code.',
        );
      }

      // 5. Validar código
      const otpHash = createHash('sha256').update(otpCode).digest('hex');

      if (otpHash !== otpSession.otpHash) {
        // Incrementar contador de intentos
        await this.otpRepository.update(otpSession.id, {
          attempts: otpSession.attempts + 1,
        });

        const remainingAttempts = maxAttempts - (otpSession.attempts + 1);
        throw new BadRequestException(
          `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        );
      }

      // 6. Marcar OTP como verificado y usado
      await this.otpRepository.update(otpSession.id, {
        isVerified: true,
        isUsed: true,
        verifiedAt: new Date(),
      });

      return {
        message: 'Email verified successfully. You can now login.',
        userId: otpSession.userId,
        email: otpSession.user.email,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handleDBExceptions(error);
    }
  }

  /**
   * Reenvía código de verificación de email
   */
  async resendEmailVerification(
    sessionId: string,
  ): Promise<{ message: string; sessionId: string }> {
    try {
      // 1. Buscar sesión original
      const originalSession = await this.otpRepository.findOne({
        where: { id: sessionId },
        relations: ['user'],
      });

      if (!originalSession) {
        throw new NotFoundException('Verification session not found');
      }

      // 2. Verificar que el usuario no esté ya verificado
      const isVerified = await this.isUserEmailVerified(originalSession.userId);
      if (isVerified) {
        throw new BadRequestException('Email already verified');
      }

      // 3. Verificar que no esté ya verificada/usada la sesión
      if (originalSession.isVerified || originalSession.isUsed) {
        throw new BadRequestException('Verification code already used');
      }

      // 4. Invalidar sesión anterior (marcar como usada)
      await this.otpRepository.update(originalSession.id, {
        isUsed: true,
      });

      // 5. Crear nueva sesión OTP
      const newSession = await this.createEmailVerificationOtp(
        originalSession.user,
      );

      return {
        message: 'New verification code sent to your email',
        sessionId: newSession.id,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.handleDBExceptions(error);
    }
  }

  /**
   * Verifica si un usuario tiene su email verificado
   * (Verifica si existe al menos un OTP verificado para el usuario)
   */
  async isUserEmailVerified(userId: string): Promise<boolean> {
    const verifiedOtp = await this.otpRepository.findOne({
      where: {
        userId,
        isVerified: true,
        isUsed: true,
      },
    });

    return !!verifiedOtp;
  }

  /**
   * Genera un código OTP numérico aleatorio
   */
  private generateNumericOtp(length: number): string {
    const max = Math.pow(10, length);
    const min = Math.pow(10, length - 1);
    const otp = Math.floor(Math.random() * (max - min) + min);
    return otp.toString();
  }

  /**
   * Manejo centralizado de excepciones de BD
   */
  private handleDBExceptions(error: any): never {
    if (error?.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    console.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
