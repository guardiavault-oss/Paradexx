// OAuth Service - Google, Apple, GitHub, Twitter authentication

import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface OAuthProvider {
  name: 'google' | 'apple' | 'github' | 'twitter';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

// Google OAuth
export class GoogleOAuthService {
  private client: OAuth2Client;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.client = new OAuth2Client(clientId, clientSecret, redirectUri);
  }

  // Generate authorization URL
  getAuthorizationUrl(state: string): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      state,
      prompt: 'consent',
    });
  }

  // Exchange code for tokens
  async getTokens(code: string): Promise<OAuthTokens> {
    const { tokens } = await this.client.getToken(code);
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
    };
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    this.client.setCredentials({ access_token: accessToken });
    
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.picture,
      emailVerified: data.verified_email,
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    this.client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000),
    };
  }
}

// Apple OAuth (Sign in with Apple)
export class AppleOAuthService {
  private clientId: string;
  private teamId: string;
  private keyId: string;
  private privateKey: string;
  private redirectUri: string;

  constructor(config: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
    redirectUri: string;
  }) {
    this.clientId = config.clientId;
    this.teamId = config.teamId;
    this.keyId = config.keyId;
    this.privateKey = config.privateKey;
    this.redirectUri = config.redirectUri;
  }

  // Generate authorization URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      response_mode: 'form_post',
      scope: 'name email',
      state,
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  // Generate client secret (JWT)
  private generateClientSecret(): string {
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      iss: this.teamId,
      iat: now,
      exp: now + 86400 * 180, // 180 days
      aud: 'https://appleid.apple.com',
      sub: this.clientId,
    };

    return jwt.sign(payload, this.privateKey, {
      algorithm: 'ES256',
      keyid: this.keyId,
    });
  }

  // Exchange code for tokens
  async getTokens(code: string): Promise<OAuthTokens> {
    const clientSecret = this.generateClientSecret();

    const response = await axios.post(
      'https://appleid.apple.com/auth/token',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in, id_token } = response.data;

    // Decode ID token to get user info
    const decoded: any = jwt.decode(id_token);

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  // Get user info from ID token
  async getUserInfo(idToken: string): Promise<OAuthUserInfo> {
    const decoded: any = jwt.decode(idToken);

    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.email.split('@')[0], // Apple doesn't always provide name
      emailVerified: decoded.email_verified === 'true',
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const clientSecret = this.generateClientSecret();

    const response = await axios.post(
      'https://appleid.apple.com/auth/token',
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }
}

// GitHub OAuth
export class GitHubOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  // Generate authorization URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'user:email',
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  // Exchange code for tokens
  async getTokens(code: string): Promise<OAuthTokens> {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour default
    };
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const [userResponse, emailsResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const primaryEmail = emailsResponse.data.find((e: any) => e.primary);

    return {
      id: userResponse.data.id.toString(),
      email: primaryEmail?.email || userResponse.data.email,
      name: userResponse.data.name || userResponse.data.login,
      avatar: userResponse.data.avatar_url,
      emailVerified: primaryEmail?.verified || false,
    };
  }
}

// Twitter OAuth 2.0
export class TwitterOAuthService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  // Generate authorization URL
  getAuthorizationUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'tweet.read users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  // Exchange code for tokens
  async getTokens(code: string, codeVerifier: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await axios.get('https://api.twitter.com/2/users/me', {
      params: { 'user.fields': 'profile_image_url' },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const user = response.data.data;

    return {
      id: user.id,
      email: '', // Twitter OAuth 2.0 doesn't provide email by default
      name: user.name,
      avatar: user.profile_image_url,
      emailVerified: false,
    };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }
}

// PKCE helper (for Twitter OAuth 2.0)
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
}

// State generator (CSRF protection)
export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}
