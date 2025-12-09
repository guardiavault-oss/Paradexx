import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    email?: string;
    walletAddress?: string;
    nonce?: string;
    totpSetupSecret?: string;
    // User object for additional data
    user?: {
      id?: string;
      name?: string;
      email?: string;
      walletAddress?: string;
    };
    // OAuth properties
    oauthState?: string;
    oauthProvider?: string;
    oauthRedirectUri?: string;
    oauthReturnUrl?: string;
    // WebAuthn registration properties
    webauthnChallenge?: string;
    webauthnDeviceName?: string;
    // WebAuthn authentication properties
    webauthnAuthChallenge?: string;
    // WebAuthn login properties
    webauthnLoginChallenge?: string;
    webauthnLoginUserId?: string;
  }
}
