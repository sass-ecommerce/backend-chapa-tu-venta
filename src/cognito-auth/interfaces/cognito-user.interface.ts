/**
 * Authenticated user extracted from Cognito Access Token claims.
 * Replaces AuthenticatedUser for all new endpoints.
 */
export interface CognitoUser {
  sub: string; // Cognito User ID (UUID)
  username: string; // username in Cognito (usually email)
  groups: string[]; // cognito:groups → roles
  clientId: string; // client_id (App Client ID)
}
