import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';

import { OtpVerification } from './entities/otp-verification.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../common/services/email.service';
import {
  OtpCreationFailedException,
  OtpSessionNotFoundException,
  OtpSessionExpiredException,
  OtpSessionUsedException,
  OtpMaxAttemptsExceededException,
  OtpInvalidCodeException,
  OtpEmailAlreadyVerifiedException,
  OtpSessionAlreadyUsedException,
  PasswordResetSessionInvalidException,
} from './exceptions/auth.exceptions';

@Injectable()
export class OtpVerificationService {
  protected readonly logger = new Logger(OtpVerificationService.name);

  constructor(
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Crea OTP para verificación de email y lo envía
   */
  async createEmailVerificationOtp(user: User): Promise<OtpVerification> {
    try {
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
    } catch (error) {
      this.logger.error('Failed to create email verification OTP', error);
      throw new OtpCreationFailedException();
    }
  }

  /**
   * Verifica el email del usuario con el código OTP
   */
  async verifyEmailWithOtp(sessionId: string, otpCode: string) {
    // 1. Buscar sesión OTP
    const otpSession = await this.otpRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });

    if (!otpSession) {
      throw new OtpSessionNotFoundException();
    }

    // 2. Verificar si ya fue usado
    if (otpSession.isUsed) {
      throw new OtpSessionUsedException();
    }

    // 3. Verificar expiración
    if (new Date() > otpSession.expiresAt) {
      throw new OtpSessionExpiredException();
    }

    // 4. Verificar límite de intentos
    const maxAttempts = this.configService.get<number>('otp.maxAttempts', 3);
    if (otpSession.attempts >= maxAttempts) {
      throw new OtpMaxAttemptsExceededException();
    }

    // 5. Validar código
    const otpHash = createHash('sha256').update(otpCode).digest('hex');

    if (otpHash !== otpSession.otpHash) {
      // Incrementar contador de intentos
      await this.otpRepository.update(otpSession.id, {
        attempts: otpSession.attempts + 1,
      });

      throw new OtpInvalidCodeException();
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
  }

  /**
   * Reenvía código de verificación de email
   */
  async resendEmailVerification(
    sessionId: string,
  ): Promise<{ message: string; sessionId: string }> {
    // 1. Buscar sesión original
    const originalSession = await this.otpRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });

    if (!originalSession) {
      throw new OtpSessionNotFoundException();
    }

    // 2. Verificar que el usuario no esté ya verificado
    const isVerified = await this.isUserEmailVerified(originalSession.userId);
    if (isVerified) {
      throw new OtpEmailAlreadyVerifiedException();
    }

    // 3. Verificar que no esté ya verificada/usada la sesión
    if (originalSession.isVerified || originalSession.isUsed) {
      throw new OtpSessionAlreadyUsedException();
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
   * Crea OTP para reset de password
   */
  async createPasswordResetOtp(user: User): Promise<OtpVerification> {
    try {
      // 1. Generar código OTP numérico de 6 dígitos
      const otpCodeLength = this.configService.get<number>('otp.codeLength', 6);
      const otpCode = this.generateNumericOtp(otpCodeLength);

      // 2. Hash del código (SHA256)
      const otpHash = createHash('sha256').update(otpCode).digest('hex');

      // 3. Calcular expiración (misma config que email verification)
      const expirationMinutes = this.configService.get<number>(
        'otp.expirationMinutes',
        5,
      );
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

      // 4. Crear registro en BD con purpose='password_reset'
      const otpVerification = this.otpRepository.create({
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0,
        isVerified: false,
        isUsed: false,
        purpose: 'password_reset',
      });

      const savedOtp = await this.otpRepository.save(otpVerification);

      // 5. Enviar email con código de reset de password
      const displayName = user.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user.email;

      await this.emailService.sendPasswordResetEmail(
        user.email,
        otpCode,
        displayName,
      );

      return savedOtp;
    } catch (error) {
      this.logger.error('Failed to create password reset OTP', error);
      throw new OtpCreationFailedException();
    }
  }

  /**
   * Verifica OTP de reset de password y devuelve userId
   */
  async verifyPasswordResetOtp(
    sessionId: string,
    otpCode: string,
  ): Promise<string> {
    // 1. Buscar sesión con purpose='password_reset'
    const otpSession = await this.otpRepository.findOne({
      where: {
        id: sessionId,
        purpose: 'password_reset',
      },
    });

    if (!otpSession) {
      throw new PasswordResetSessionInvalidException();
    }

    // 2. Verificar si ya fue usado
    if (otpSession.isUsed) {
      throw new PasswordResetSessionInvalidException();
    }

    // 3. Verificar expiración
    if (new Date() > otpSession.expiresAt) {
      throw new PasswordResetSessionInvalidException();
    }

    // 4. Verificar límite de intentos
    const maxAttempts = this.configService.get<number>('otp.maxAttempts', 3);
    if (otpSession.attempts >= maxAttempts) {
      throw new PasswordResetSessionInvalidException();
    }

    // 5. Validar código
    const otpHash = createHash('sha256').update(otpCode).digest('hex');

    if (otpHash !== otpSession.otpHash) {
      // Incrementar contador de intentos
      await this.otpRepository.update(otpSession.id, {
        attempts: otpSession.attempts + 1,
      });

      throw new PasswordResetSessionInvalidException();
    }

    return otpSession.userId;
  }
}
