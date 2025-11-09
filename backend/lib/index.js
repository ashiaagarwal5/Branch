"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFriend = exports.addFriend = exports.generateWeeklySummaries = exports.updateLeaderboardsDaily = exports.onSessionCreate = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const app_1 = require("./app");
const firebase_1 = require("./config/firebase");
const ai_1 = require("./handlers/ai");
const gamification_1 = require("./handlers/gamification");
const leaderboards_1 = require("./handlers/leaderboards");
const weeklySummary_1 = require("./handlers/weeklySummary");
exports.api = functions.https.onRequest(app_1.app);
exports.onSessionCreate = functions.firestore
    .document('sessions/{sessionId}')
    .onCreate(async (snap) => {
    const session = snap.data();
    const userId = session.userId;
    if (!userId) {
        console.warn('Session created without userId', snap.id);
        return;
    }
    const userRef = firebase_1.db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};
    await (0, gamification_1.checkAndAwardBadges)(userId);
    await firebase_1.db.collection('activities').add({
        userId,
        userName: userData.displayName || 'User',
        userPhoto: userData.photoURL || null,
        type: 'session_complete',
        sessionId: snap.id,
        topic: session.topic,
        duration: session.duration,
        xpEarned: session.xpEarned,
        score: session.score,
        timestamp: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
        reactions: {},
    });
    (0, ai_1.handleGenerateAISummary)(snap.id, userId, session).catch(console.error);
});
exports.updateLeaderboardsDaily = functions.pubsub
    .schedule('every day 00:00')
    .timeZone('America/New_York')
    .onRun(async () => {
    await (0, leaderboards_1.updateLeaderboards)();
});
exports.generateWeeklySummaries = functions.pubsub
    .schedule('every sunday 23:59')
    .timeZone('America/New_York')
    .onRun(async () => {
    await (0, weeklySummary_1.generateWeeklySummary)();
});
exports.addFriend = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { friendId } = data;
    await firebase_1.db
        .collection('users')
        .doc(userId)
        .update({
        friends: firebase_1.admin.firestore.FieldValue.arrayUnion(friendId),
    });
    return { success: true };
});
exports.removeFriend = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = context.auth.uid;
    const { friendId } = data;
    await firebase_1.db
        .collection('users')
        .doc(userId)
        .update({
        friends: firebase_1.admin.firestore.FieldValue.arrayRemove(friendId),
    });
    return { success: true };
});
//# sourceMappingURL=index.js.map