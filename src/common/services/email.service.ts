import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>('aws.ses.region') || 'us-east-1';
    const accessKeyId =
      this.configService.get<string>('aws.ses.accessKeyId') || '';
    const secretAccessKey =
      this.configService.get<string>('aws.ses.secretAccessKey') || '';

    this.fromEmail =
      this.configService.get<string>('aws.ses.fromEmail') ||
      'noreply@example.com';
    this.fromName =
      this.configService.get<string>('aws.ses.fromName') || 'Chapa Tu Venta';

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'AWS credentials not configured. Email service will not work.',
      );
    }

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`EmailService initialized with region: ${region}`);
  }

  /**
   * Envía un email genérico usando AWS SES
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
  ): Promise<void> {
    try {
      const command = new SendEmailCommand({
        Source: `${this.fromName} <${this.fromEmail}>`,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: textBody
              ? {
                  Data: textBody,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
      });

      const response = await this.sesClient.send(command);
      this.logger.log(
        `Email sent successfully to ${to}. MessageId: ${response.MessageId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Envía un email con código OTP
   */
  async sendOtpEmail(
    email: string,
    otpCode: string,
    recipientName?: string,
  ): Promise<void> {
    const subject = `Tu código de verificación - ${this.fromName}`;
    const displayName = recipientName || email;

    const htmlBody = this.getOtpEmailTemplate(otpCode, displayName);
    const textBody = this.getOtpEmailTextVersion(otpCode, displayName);

    await this.sendEmail(email, subject, htmlBody, textBody);
  }

  /**
   * Template HTML para email OTP
   */
  private getOtpEmailTemplate(otpCode: string, recipientName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de Verificación</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        ${this.fromName}
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">
                        Hola ${recipientName},
                      </h2>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                        Hemos detectado un nuevo inicio de sesión desde un dispositivo no reconocido. 
                        Para completar tu inicio de sesión, ingresa el siguiente código de verificación:
                      </p>
                      
                      <!-- OTP Code Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center" style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
                            <div style="font-size: 40px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${otpCode}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        <strong>⏱️ Este código expira en 5 minutos.</strong>
                      </p>
                      
                      <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        Si no iniciaste sesión, ignora este mensaje o contacta a soporte si tienes alguna preocupación.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        © ${new Date().getFullYear()} ${this.fromName}. Todos los derechos reservados.
                      </p>
                      <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                        🔒 Por seguridad, nunca compartas este código con nadie.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Versión texto plano del email OTP (fallback)
   */
  private getOtpEmailTextVersion(
    otpCode: string,
    recipientName: string,
  ): string {
    return `
Hola ${recipientName},

Hemos detectado un nuevo inicio de sesión desde un dispositivo no reconocido.

Tu código de verificación es: ${otpCode}

Este código expira en 5 minutos.

Si no iniciaste sesión, ignora este mensaje o contacta a soporte.

---
${this.fromName}
Por seguridad, nunca compartas este código con nadie.
    `.trim();
  }

  /**
   * Envía un email con código OTP para reset de password
   */
  async sendPasswordResetEmail(
    email: string,
    otpCode: string,
    recipientName?: string,
  ): Promise<void> {
    const subject = `Restablece tu contraseña - ${this.fromName}`;
    const displayName = recipientName || email;

    const htmlBody = this.getPasswordResetEmailTemplate(otpCode, displayName);
    const textBody = this.getPasswordResetEmailTextVersion(
      otpCode,
      displayName,
    );

    await this.sendEmail(email, subject, htmlBody, textBody);
  }

  /**
   * Template HTML para email de reset de password
   */
  private getPasswordResetEmailTemplate(
    otpCode: string,
    recipientName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restablece tu Contraseña</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                        ${this.fromName}
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">
                        Hola ${recipientName},
                      </h2>
                      <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.5;">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. 
                        Para continuar, ingresa el siguiente código de verificación:
                      </p>
                      
                      <!-- OTP Code Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center" style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
                            <div style="font-size: 40px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${otpCode}
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        <strong>⏱️ Este código expira en 5 minutos.</strong>
                      </p>
                      
                      <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                          <strong>⚠️ Advertencia de seguridad:</strong><br>
                          Si NO solicitaste restablecer tu contraseña, ignora este mensaje o contacta a soporte INMEDIATAMENTE. 
                          Alguien podría estar intentando acceder a tu cuenta.
                        </p>
                      </div>
                      
                      <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        © ${new Date().getFullYear()} ${this.fromName}. Todos los derechos reservados.
                      </p>
                      <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                        🔒 Por seguridad, nunca compartas este código con nadie.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Versión texto plano del email de reset de password (fallback)
   */
  private getPasswordResetEmailTextVersion(
    otpCode: string,
    recipientName: string,
  ): string {
    return `
Hola ${recipientName},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

Tu código de verificación es: ${otpCode}

Este código expira en 5 minutos.

⚠️ ADVERTENCIA DE SEGURIDAD:
Si NO solicitaste restablecer tu contraseña, ignora este mensaje o contacta a soporte INMEDIATAMENTE.
Alguien podría estar intentando acceder a tu cuenta.

---
${this.fromName}
Por seguridad, nunca compartas este código con nadie.
    `.trim();
  }
}
