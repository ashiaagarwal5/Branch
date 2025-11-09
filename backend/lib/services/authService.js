"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EXTENSION_SCOPES = exports.DEFAULT_WEB_SCOPES = void 0;
exports.upsertProfileFromIdToken = upsertProfileFromIdToken;
exports.issueWebTokens = issueWebTokens;
exports.issueExtensionTokens = issueExtensionTokens;
exports.rotateRefreshToken = rotateRefreshToken;
exports.logoutWithRefreshToken = logoutWithRefreshToken;
exports.getSerializedUser = getSerializedUser;
exports.generateExtensionSetupCode = generateExtensionSetupCode;
exports.linkExtension = linkExtension;
const date_fns_1 = require("date-fns");
const firebase_1 = require("../config/firebase");
const env_1 = require("../config/env");
const tokenService_1 = require("./tokenService");
const firestore_1 = require("../utils/firestore");
const crypto_1 = require("../utils/crypto");
const USERS_COLLECTION = 'users';
const USER_SETTINGS_COLLECTION = 'userSettings';
const EXTENSION_CODES_COLLECTION = 'extensionSetupCodes';
exports.DEFAULT_WEB_SCOPES = [
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
exports.DEFAULT_EXTENSION_SCOPES = [
    'logs.write',
    'logs.read',
    'classify.invoke',
    'sessions.read',
];
async function ensureUserDocument(userId, email, options = {}) {
    const userRef = firebase_1.db.collection(USERS_COLLECTION).doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        const createdAt = (0, firestore_1.nowTimestamp)();
        await userRef.set({
            email: email || null,
            displayName: options.displayName ||
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
        }, { merge: false });
    }
    else {
        await userRef.set({
            updatedAt: (0, firestore_1.nowTimestamp)(),
            ...(options.displayName
                ? { displayName: options.displayName }
                : null),
        }, { merge: true });
    }
    // Ensure user settings doc exists
    const settingsRef = firebase_1.db.collection(USER_SETTINGS_COLLECTION).doc(userId);
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
            createdAt: (0, firestore_1.nowTimestamp)(),
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
    }
    return (await userRef.get()).data();
}
async function upsertProfileFromIdToken(idToken, options = {}) {
    const decoded = await firebase_1.auth.verifyIdToken(idToken);
    const userRecord = await firebase_1.auth.getUser(decoded.uid);
    await ensureUserDocument(userRecord.uid, userRecord.email, {
        displayName: options.displayName ?? userRecord.displayName ?? undefined,
    });
    return userRecord.uid;
}
async function issueWebTokens(userId, scopes = exports.DEFAULT_WEB_SCOPES) {
    return (0, tokenService_1.issueTokenPair)({
        userId,
        scopes,
        audience: 'web',
    });
}
async function issueExtensionTokens(userId, deviceId, scopes = exports.DEFAULT_EXTENSION_SCOPES, metadata = {}) {
    return (0, tokenService_1.issueTokenPair)({
        userId,
        scopes,
        audience: 'extension',
        deviceId,
        accessTokenTtlSeconds: env_1.env.extensionAccessTokenTtlSeconds,
        metadata,
    });
}
async function rotateRefreshToken(refreshToken, audience) {
    const result = await (0, tokenService_1.validateRefreshToken)(refreshToken, audience);
    if (!result) {
        throw Object.assign(new Error('Invalid refresh token'), {
            status: 401,
            code: 'invalid_refresh_token',
        });
    }
    const { record, tokenHash } = result;
    await firebase_1.db
        .collection('authTokens')
        .doc(tokenHash)
        .update({
        revoked: true,
        revokedAt: (0, firestore_1.nowTimestamp)(),
    });
    const tokens = await (0, tokenService_1.issueTokenPair)({
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
async function logoutWithRefreshToken(refreshToken) {
    await (0, tokenService_1.revokeRefreshToken)(refreshToken);
}
async function getSerializedUser(userId) {
    const [userRecord, userDoc] = await Promise.all([
        firebase_1.auth.getUser(userId),
        firebase_1.db.collection(USERS_COLLECTION).doc(userId).get(),
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
async function generateExtensionSetupCode(userId) {
    const code = (0, crypto_1.generateSecureToken)(6).slice(0, 8).toUpperCase();
    const expiresAt = (0, date_fns_1.addMinutes)(new Date(), 10);
    await firebase_1.db.collection(EXTENSION_CODES_COLLECTION).doc(code).set({
        code,
        userId,
        expiresAt: (0, firestore_1.toTimestamp)(expiresAt),
        createdAt: (0, firestore_1.nowTimestamp)(),
        used: false,
    });
    return {
        code,
        expiresAt,
    };
}
async function linkExtension({ code, deviceId, deviceName, }) {
    const codeRef = firebase_1.db.collection(EXTENSION_CODES_COLLECTION).doc(code);
    const codeSnap = await codeRef.get();
    if (!codeSnap.exists) {
        throw Object.assign(new Error('Invalid setup code'), {
            status: 400,
            code: 'invalid_setup_code',
        });
    }
    const data = codeSnap.data();
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
        usedAt: (0, firestore_1.nowTimestamp)(),
        lastDeviceId: deviceId,
    });
    const tokenPair = await issueExtensionTokens(data.userId, deviceId, undefined, {
        deviceName,
    });
    const user = await getSerializedUser(data.userId);
    return { tokens: tokenPair, user };
}
//# sourceMappingURL=authService.js.map