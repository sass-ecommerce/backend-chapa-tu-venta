import { User } from 'src/users/entities/user.entity';
import { Request } from 'express';

/**
 * Interface for authenticated user data
 * Used by JWT strategy and available in request.user
 */
export interface AuthenticatedUser {
  userId: string; // ID numérico del usuario
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: string;
  isActive: boolean;
  publicMetadata?: Record<string, any>;
  privateMetadata?: Record<string, any>;
  unsafeMetadata?: Record<string, any>;
}

/**
 * Interface for JWT payload (what gets encoded in the token)
 */
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration
}

/**
 * Interfaz para Request con usuario autenticado (usado por Passport)
 */
export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * Interfaz para el payload del JWT decodificado
 */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiration
}
