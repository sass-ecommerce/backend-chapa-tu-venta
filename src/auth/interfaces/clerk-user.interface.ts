/**
 * Interface para el publicMetadata del usuario en Clerk
 * Basado en la estructura: { user: { slug: string }, store: { slug: string } }
 */
export interface UserPublicMetadata {
  user?: {
    slug: string;
  };
  store?: {
    slug: string;
  };
  [key: string]: any; // Permitir campos adicionales
}

/**
 * Interface para la verificación de identidades
 */
interface ClerkVerification {
  status: string;
  strategy: string;
  externalVerificationRedirectURL: string | null;
  attempts: number | null;
  expireAt: number | null;
  nonce: string | null;
  message: string | null;
}

/**
 * Interface para enlaces de identificación
 */
interface ClerkIdentificationLink {
  id: string;
  type: string;
}

/**
 * Interface para direcciones de email
 */
interface ClerkEmailAddress {
  id: string;
  emailAddress: string;
  verification: ClerkVerification;
  linkedTo: ClerkIdentificationLink[];
}

/**
 * Interface para cuentas externas (OAuth)
 */
interface ClerkExternalAccount {
  id: string;
  provider: string;
  identificationId: string;
  externalId: string;
  approvedScopes: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  username: string;
  phoneNumber?: string;
  publicMetadata: Record<string, any>;
  label: string | null;
  verification: ClerkVerification;
}

/**
 * Interface para el objeto _raw de Clerk User
 */
interface ClerkUserRaw {
  id: string;
  object: string;
  username: string | null;
  first_name: string;
  last_name: string;
  locale: string | null;
  image_url: string;
  has_image: boolean;
  primary_email_address_id: string;
  primary_phone_number_id: string | null;
  primary_web3_wallet_id: string | null;
  password_enabled: boolean;
  two_factor_enabled: boolean;
  totp_enabled: boolean;
  backup_code_enabled: boolean;
  email_addresses: any[];
  phone_numbers: any[];
  web3_wallets: any[];
  passkeys: any[];
  external_accounts: any[];
  saml_accounts: any[];
  enterprise_accounts: any[];
  password_last_updated_at: number | null;
  public_metadata: UserPublicMetadata;
  private_metadata: Record<string, any>;
  unsafe_metadata: Record<string, any>;
  external_id: string | null;
  last_sign_in_at: number;
  banned: boolean;
  locked: boolean;
  lockout_expires_in_seconds: number | null;
  verification_attempts_remaining: number;
  created_at: number;
  updated_at: number;
  delete_self_enabled: boolean;
  bypass_client_trust: boolean;
  create_organization_enabled: boolean;
  last_active_at: number;
  mfa_enabled_at: number | null;
  mfa_disabled_at: number | null;
  legal_accepted_at: number | null;
  requires_password_reset: boolean;
  profile_image_url: string;
}

/**
 * Interface completa para el objeto User retornado por Clerk API
 * Basado en la respuesta de clerkClient.users.getUser()
 */
export interface ClerkFullUser {
  id: string;
  passwordEnabled: boolean;
  totpEnabled: boolean;
  backupCodeEnabled: boolean;
  twoFactorEnabled: boolean;
  banned: boolean;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
  imageUrl: string;
  hasImage: boolean;
  primaryEmailAddressId: string;
  primaryPhoneNumberId: string | null;
  primaryWeb3WalletId: string | null;
  lastSignInAt: number;
  externalId: string | null;
  username: string | null;
  firstName: string;
  lastName: string;
  publicMetadata: UserPublicMetadata;
  privateMetadata: Record<string, any>;
  unsafeMetadata: Record<string, any>;
  emailAddresses: ClerkEmailAddress[];
  phoneNumbers: any[];
  web3Wallets: any[];
  externalAccounts: ClerkExternalAccount[];
  samlAccounts: any[];
  lastActiveAt: number;
  createOrganizationEnabled: boolean;
  createOrganizationsLimit: number | null;
  deleteSelfEnabled: boolean;
  legalAcceptedAt: number | null;
  locale: string | null;
  _raw: ClerkUserRaw;
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
