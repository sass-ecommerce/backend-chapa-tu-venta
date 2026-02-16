import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserMetadata } from '../entities/user-metadata.entity';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../interfaces/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserMetadata)
    private readonly metadataRepository: Repository<UserMetadata>,
  ) {
    const secret = configService.get<string>('auth.jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Buscar usuario en base de datos para datos completos
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Buscar metadata del usuario
    const metadata = await this.metadataRepository.findOne({
      where: { userId: user.id },
    });

    // Construir objeto de usuario autenticado
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      role: user.role,
      isActive: user.isActive,
      publicMetadata: metadata?.publicMetadata || {},
      privateMetadata: metadata?.privateMetadata || {},
      unsafeMetadata: metadata?.unsafeMetadata || {},
    };
  }
}
