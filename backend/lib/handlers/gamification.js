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
exports.checkAndAwardBadges = checkAndAwardBadges;
const admin = __importStar(require("firebase-admin"));
const shared_1 = require("@branch/shared");
async function checkAndAwardBadges(userId) {
    try {
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        const userData = userDoc.data();
        if (!userData)
            return;
        // Get user's existing badges
        const userBadgesSnapshot = await admin.firestore()
            .collection('userBadges')
            .where('userId', '==', userId)
            .get();
        const existingBadgeIds = new Set(userBadgesSnapshot.docs.map(doc => doc.data().badgeId));
        // Get user stats for badge checking
        const statsDoc = await admin.firestore().doc(`userStats/${userId}`).get();
        const stats = statsDoc.data();
        const checkData = {
            ...userData,
            ...stats,
            totalSessions: stats?.totalSessions || 0,
            streak: userData.streak || 0,
            totalStudyTime: userData.totalStudyTime || 0,
        };
        // Check each badge
        for (const badge of shared_1.BADGES) {
            if (existingBadgeIds.has(badge.id))
                continue;
            if (badge.checkFunction(checkData)) {
                // Award badge
                await admin.firestore().collection('userBadges').add({
                    userId,
                    badgeId: badge.id,
                    earnedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                // Create activity
                await admin.firestore().collection('activities').add({
                    userId,
                    userName: userData.displayName,
                    userPhoto: userData.photoURL || null,
                    type: 'badge_earned',
                    badgeId: badge.id,
                    badgeName: badge.name,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    reactions: {},
                });
            }
        }
        // Check for level up
        const newLevel = (0, shared_1.calculateLevel)(userData.xp);
        if (newLevel > userData.level) {
            await admin.firestore().doc(`users/${userId}`).update({
                level: newLevel,
            });
            // Create level up activity
            await admin.firestore().collection('activities').add({
                userId,
                userName: userData.displayName,
                userPhoto: userData.photoURL || null,
                type: 'level_up',
                newLevel,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                reactions: {},
            });
        }
    }
    catch (error) {
        console.error('Error checking badges:', error);
    }
}
//# sourceMappingURL=gamification.js.map