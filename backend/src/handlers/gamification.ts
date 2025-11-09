import * as admin from 'firebase-admin';
import { BADGES, calculateLevel } from '@branch/shared';

export async function checkAndAwardBadges(userId: string) {
  try {
    const userDoc = await admin.firestore().doc(`users/${userId}`).get();
    const userData = userDoc.data();
    
    if (!userData) return;

    // Get user's existing badges
    const userBadgesSnapshot = await admin.firestore()
      .collection('userBadges')
      .where('userId', '==', userId)
      .get();
    
    const existingBadgeIds = new Set(
      userBadgesSnapshot.docs.map(doc => doc.data().badgeId)
    );

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
    for (const badge of BADGES) {
      if (existingBadgeIds.has(badge.id)) continue;

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
    const newLevel = calculateLevel(userData.xp);
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
  } catch (error) {
    console.error('Error checking badges:', error);
  }
}

