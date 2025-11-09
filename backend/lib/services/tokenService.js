"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueTokenPair = issueTokenPair;
exports.validateRefreshToken = validateRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.revokeAllTokensForUser = revokeAllTokensForUser;
const date_fns_1 = require("date-fns");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const firebase_1 = require("../config/firebase");
const crypto_1 = require("../utils/crypto");
const AUTH_TOKENS_COLLECTION = 'authTokens';
async function issueTokenPair({ userId, scopes, audience, deviceId, accessTokenTtlSeconds, metadata = {}, }) {
    const tokenId = (0, uuid_1.v4)();
    const ttlSeconds = accessTokenTtlSeconds ??
        (audience === 'extension'
            ? env_1.env.extensionAccessTokenTtlSeconds
            : env_1.env.accessTokenTtlSeconds);
    const accessPayload = {
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
    const accessToken = jsonwebtoken_1.default.sign(accessPayload, env_1.env.jwtSecret, {
        expiresIn: ttlSeconds,
    });
    const refreshToken = (0, crypto_1.generateSecureToken)(64);
    const tokenHash = (0, crypto_1.hashToken)(refreshToken);
    const refreshExpiresAt = (0, date_fns_1.addDays)(new Date(), env_1.env.refreshTokenTtlDays);
    const record = {
        userId,
        tokenHash,
        audience,
        scopes,
        deviceId,
        expiresAt: firebase_1.admin.firestore.Timestamp.fromDate(refreshExpiresAt),
        createdAt: firebase_1.admin.firestore.Timestamp.fromDate(new Date()),
        metadata,
    };
    await firebase_1.db
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
async function validateRefreshToken(refreshToken, audience) {
    const tokenHash = (0, crypto_1.hashToken)(refreshToken);
    const snapshot = await firebase_1.db
        .collection(AUTH_TOKENS_COLLECTION)
        .doc(tokenHash)
        .get();
    if (!snapshot.exists) {
        return null;
    }
    const record = snapshot.data();
    if (record.revoked) {
        return null;
    }
    if (audience && record.audience !== audience) {
        return null;
    }
    const now = firebase_1.admin.firestore.Timestamp.now();
    if (record.expiresAt.toMillis() < now.toMillis()) {
        return null;
    }
    return { record, tokenHash };
}
async function revokeRefreshToken(refreshToken) {
    const tokenHash = (0, crypto_1.hashToken)(refreshToken);
    await firebase_1.db
        .collection(AUTH_TOKENS_COLLECTION)
        .doc(tokenHash)
        .set({
        revoked: true,
        revokedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
async function revokeAllTokensForUser(userId, audience) {
    const snapshot = await firebase_1.db
        .collection(AUTH_TOKENS_COLLECTION)
        .where('userId', '==', userId)
        .get();
    const batch = firebase_1.db.batch();
    snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (audience && data.audience !== audience) {
            return;
        }
        batch.update(doc.ref, {
            revoked: true,
            revokedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
}
//# sourceMappingURL=tokenService.js.map