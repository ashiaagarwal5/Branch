export type TokenAudience = 'web' | 'extension' | 'service';

export interface AuthContext {
  userId: string;
  scopes: string[];
  tokenId: string;
  audience: TokenAudience;
  issuedAt: number;
  expiresAt: number;
  deviceId?: string;
}

export interface AccessTokenPayload {
  sub: string; // user id
  jti: string; // token id
  aud: TokenAudience;
  scopes: string[];
  type: 'access';
  iat: number;
  exp: number;
  deviceId?: string;
}

export interface RefreshTokenRecord {
  userId: string;
  tokenHash: string;
  audience: TokenAudience;
  scopes: string[];
  deviceId?: string;
  expiresAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  revoked?: boolean;
  revokedAt?: FirebaseFirestore.Timestamp;
  metadata?: Record<string, unknown>;
}

export interface TokenPair {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  audience: TokenAudience;
  deviceId?: string;
  scopes: string[];
}
