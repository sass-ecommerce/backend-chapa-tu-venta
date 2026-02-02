/**
 * Interface para el publicMetadata del usuario en Clerk
 * Basado en la estructura: { storeSlug: string, plan: 'free' | 'premium', onboardingCompleted: boolean }
 */
export interface UserPublicMetadata {
  [key: string]: any; // Permitir campos adicionales
}

/**
 * Interface para los claims del JWT de Clerk
 * Estructura basada en la documentación oficial de Clerk
 */
export interface ClerkJwtPayload {
  // Claims estándar JWT
  sub: string; // User ID de Clerk (ej: "user_2abc123xyz")
  iss: string; // Issuer
  aud: string; // Audience
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  nbf: number; // Not before timestamp
  azp: string; // Authorized party (origin del frontend)

  // Claims personalizados de Clerk
  sid: string; // Session ID

  // Información del usuario (si está en el token)
  email?: string;
  email_verified?: boolean;
  first_name?: string;
  last_name?: string;
  image_url?: string;

  // Información de organización (si aplica)
  org_id?: string;
  org_slug?: string;
  org_role?: string;
}

/**
 * Interface para el usuario autenticado que se adjunta al request
 */
export interface AuthenticatedUser {
  userId: string; // User ID de Clerk
  sessionId: string; // Session ID
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  privateMetadata?: UserPublicMetadata; // privateMetadata del usuario
  publicMetadata?: UserPublicMetadata; // publicMetadata del usuario
  unsafeMetadata?: UserPublicMetadata; // unsafeMetadata del usuario
  orgId?: string;
  orgSlug?: string;
  orgRole?: string;
}
