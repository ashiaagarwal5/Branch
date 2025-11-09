import { addDays } from 'date-fns';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { env } from '../config/env';
import { admin, db } from '../config/firebase';
import {
  AccessTokenPayload,
  TokenPair,
  TokenAudience,
  RefreshTokenRecord,
} from '../types/auth';
import { generateSecureToken, hashToken } from '../utils/crypto';

const AUTH_TOKENS_COLLECTION = 'authTokens';

interface IssueTokenOptions {
  userId: string;
  scopes: string[];
  audience: TokenAudience;
  deviceId?: string;
  accessTokenTtlSeconds?: number;
  metadata?: Record<string, unknown>;
}

export async function issueTokenPair({
  userId,
  scopes,
  audience,
  deviceId,
  accessTokenTtlSeconds,
  metadata = {},
}: IssueTokenOptions): Promise<TokenPair> {
  const tokenId = uuid();
  const ttlSeconds =
    accessTokenTtlSeconds ??
    (audience === 'extension'
      ? env.extensionAccessTokenTtlSeconds
      : env.accessTokenTtlSeconds);

  const accessPayload: AccessTokenPayload = {
    sub: userId,
    jti: tokenId,
    aud: audience,
    scopes,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  if (deviceId) {
    accessPayload.deviceId = deviceId;
  }

  const accessToken = jwt.sign(accessPayload, env.jwtSecret, {
    expiresIn: ttlSeconds,
  });

  const refreshToken = generateSecureToken(64);
  const tokenHash = hashToken(refreshToken);
  const refreshExpiresAt = addDays(new Date(), env.refreshTokenTtlDays);

  const record: RefreshTokenRecord = {
    userId,
    tokenHash,
    audience,
    scopes,
    deviceId,
    expiresAt: admin.firestore.Timestamp.fromDate(refreshExpiresAt),
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    metadata,
  };

  await db
    .collection(AUTH_TOKENS_COLLECTION)
    .doc(tokenHash)
    .set(record, { merge: false });

  return {
    accessToken,
    accessTokenExpiresIn: ttlSeconds,
    refreshToken,
    refreshTokenExpiresAt: refreshExpiresAt,
    audience,
    deviceId,
    scopes,
  };
}

export async function validateRefreshToken(
  refreshToken: string,
  audience?: TokenAudience
) {
  const tokenHash = hashToken(refreshToken);
  const snapshot = await db
    .collection(AUTH_TOKENS_COLLECTION)
    .doc(tokenHash)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const record = snapshot.data() as RefreshTokenRecord;

  if (record.revoked) {
    return null;
  }

  if (audience && record.audience !== audience) {
    return null;
  }

  const now = admin.firestore.Timestamp.now();
  if (record.expiresAt.toMillis() < now.toMillis()) {
    return null;
  }

  return { record, tokenHash };
}

export async function revokeRefreshToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await db
    .collection(AUTH_TOKENS_COLLECTION)
    .doc(tokenHash)
    .set(
      {
        revoked: true,
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

export async function revokeAllTokensForUser(
  userId: string,
  audience?: TokenAudience
) {
  const snapshot = await db
    .collection(AUTH_TOKENS_COLLECTION)
    .where('userId', '==', userId)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as RefreshTokenRecord;
    if (audience && data.audience !== audience) {
      return;
    }
    batch.update(doc.ref, {
      revoked: true,
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

