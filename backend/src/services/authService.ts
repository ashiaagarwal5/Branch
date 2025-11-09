import { addMinutes } from 'date-fns';
import { auth, db } from '../config/firebase';
import { env } from '../config/env';
import {
  issueTokenPair,
  revokeRefreshToken,
  validateRefreshToken,
} from './tokenService';
import type { TokenAudience, TokenPair } from '../types/auth';
import { nowTimestamp, toTimestamp } from '../utils/firestore';
import { generateSecureToken } from '../utils/crypto';

const USERS_COLLECTION = 'users';
const USER_SETTINGS_COLLECTION = 'userSettings';
const EXTENSION_CODES_COLLECTION = 'extensionSetupCodes';

export const DEFAULT_WEB_SCOPES = [
  'user.read',
  'user.write',
  'sessions.read',
  'sessions.write',
  'logs.read',
  'tasks.read',
  'tasks.write',
  'bets.read',
  'bets.write',
  'social.read',
  'social.write',
  'leaderboard.read',
  'selfreport.write',
  'privacy.write',
];

export const DEFAULT_EXTENSION_SCOPES = [
  'logs.write',
  'logs.read',
  'classify.invoke',
  'sessions.read',
];

interface EnsureUserOptions {
  displayName?: string;
}

async function ensureUserDocument(
  userId: string,
  email?: string | null,
  options: EnsureUserOptions = {}
) {
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    const createdAt = nowTimestamp();
    await userRef.set(
      {
        email: email || null,
        displayName:
          options.displayName ||
          email?.split('@')[0] ||
          `User-${userId.slice(0, 6)}`,
        photoURL: null,
        xp: 0,
        level: 0,
        streak: 0,
        longestStreak: 0,
        totalStudyTime: 0,
        points: 0,
        balance: 0,
        privacy: {
          shareSessions: false,
          shareBadges: false,
          shareLeaderboard: true,
        },
        notificationPrefs: {
          email: true,
          push: true,
          bets: true,
          social: true,
        },
        createdAt,
        updatedAt: createdAt,
      },
      { merge: false }
    );
  } else {
    await userRef.set(
      {
        updatedAt: nowTimestamp(),
        ...(options.displayName
          ? { displayName: options.displayName }
          : null),
      },
      { merge: true }
    );
  }

  // Ensure user settings doc exists
  const settingsRef = db.collection(USER_SETTINGS_COLLECTION).doc(userId);
  const settingsSnap = await settingsRef.get();
  if (!settingsSnap.exists) {
    await settingsRef.set({
      userId,
      excludedDomains: [],
      blockedCategories: [],
      incognitoDisabled: true,
      localOnlyMode: false,
      sharePreferences: {
        autoShareSessions: false,
        autoShareBadges: false,
        autoShareLeaderboard: false,
      },
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
    });
  }

  return (await userRef.get()).data();
}

export async function upsertProfileFromIdToken(
  idToken: string,
  options: { displayName?: string } = {}
) {
  const decoded = await auth.verifyIdToken(idToken);
  const userRecord = await auth.getUser(decoded.uid);

  await ensureUserDocument(userRecord.uid, userRecord.email, {
    displayName: options.displayName ?? userRecord.displayName ?? undefined,
  });

  return userRecord.uid;
}

export async function issueWebTokens(
  userId: string,
  scopes: string[] = DEFAULT_WEB_SCOPES
): Promise<TokenPair> {
  return issueTokenPair({
    userId,
    scopes,
    audience: 'web',
  });
}

export async function issueExtensionTokens(
  userId: string,
  deviceId: string,
  scopes: string[] = DEFAULT_EXTENSION_SCOPES,
  metadata: Record<string, unknown> = {}
): Promise<TokenPair> {
  return issueTokenPair({
    userId,
    scopes,
    audience: 'extension',
    deviceId,
    accessTokenTtlSeconds: env.extensionAccessTokenTtlSeconds,
    metadata,
  });
}

export async function rotateRefreshToken(
  refreshToken: string,
  audience?: TokenAudience
) {
  const result = await validateRefreshToken(refreshToken, audience);
  if (!result) {
    throw Object.assign(new Error('Invalid refresh token'), {
      status: 401,
      code: 'invalid_refresh_token',
    });
  }

  const { record, tokenHash } = result;

  await db
    .collection('authTokens')
    .doc(tokenHash)
    .update({
      revoked: true,
      revokedAt: nowTimestamp(),
    });

  const tokens = await issueTokenPair({
    userId: record.userId,
    scopes: record.scopes,
    audience: record.audience,
    deviceId: record.deviceId,
  });

  return {
    tokens,
    userId: record.userId,
  };
}

export async function logoutWithRefreshToken(refreshToken: string) {
  await revokeRefreshToken(refreshToken);
}

export interface SerializedUser {
  id: string;
  email: string | null | undefined;
  displayName?: string;
  photoURL?: string | null;
  xp?: number;
  level?: number;
  streak?: number;
  points?: number;
  balance?: number;
  totalStudyTime?: number;
  privacy?: Record<string, unknown>;
}

export async function getSerializedUser(userId: string): Promise<SerializedUser> {
  const [userRecord, userDoc] = await Promise.all([
    auth.getUser(userId),
    db.collection(USERS_COLLECTION).doc(userId).get(),
  ]);

  const userData = userDoc.data() || {};

  return {
    id: userId,
    email: userRecord.email,
    displayName: userData.displayName || userRecord.displayName,
    photoURL: userRecord.photoURL,
    xp: userData.xp ?? 0,
    level: userData.level ?? 0,
    streak: userData.streak ?? 0,
    points: userData.points ?? 0,
    balance: userData.balance ?? 0,
    totalStudyTime: userData.totalStudyTime ?? 0,
    privacy: userData.privacy ?? {},
  };
}

export async function generateExtensionSetupCode(userId: string) {
  const code = generateSecureToken(6).slice(0, 8).toUpperCase();
  const expiresAt = addMinutes(new Date(), 10);

  await db.collection(EXTENSION_CODES_COLLECTION).doc(code).set({
    code,
    userId,
    expiresAt: toTimestamp(expiresAt),
    createdAt: nowTimestamp(),
    used: false,
  });

  return {
    code,
    expiresAt,
  };
}

export interface LinkExtensionInput {
  code: string;
  deviceId: string;
  deviceName?: string;
}

export async function linkExtension({
  code,
  deviceId,
  deviceName,
}: LinkExtensionInput) {
  const codeRef = db.collection(EXTENSION_CODES_COLLECTION).doc(code);
  const codeSnap = await codeRef.get();

  if (!codeSnap.exists) {
    throw Object.assign(new Error('Invalid setup code'), {
      status: 400,
      code: 'invalid_setup_code',
    });
  }

  const data = codeSnap.data() as {
    userId: string;
    expiresAt: FirebaseFirestore.Timestamp;
    used?: boolean;
  };

  if (data.used) {
    throw Object.assign(new Error('Setup code already used'), {
      status: 400,
      code: 'setup_code_used',
    });
  }

  if (data.expiresAt.toMillis() < Date.now()) {
    throw Object.assign(new Error('Setup code expired'), {
      status: 400,
      code: 'setup_code_expired',
    });
  }

  await codeRef.update({
    used: true,
    usedAt: nowTimestamp(),
    lastDeviceId: deviceId,
  });

  const tokenPair = await issueExtensionTokens(data.userId, deviceId, undefined, {
    deviceName,
  });

  const user = await getSerializedUser(data.userId);

  return { tokens: tokenPair, user };
}

