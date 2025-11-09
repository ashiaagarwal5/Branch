import * as functions from 'firebase-functions';
import { app } from './app';
import { admin, db } from './config/firebase';
import { handleGenerateAISummary } from './handlers/ai';
import { checkAndAwardBadges } from './handlers/gamification';
import { updateLeaderboards } from './handlers/leaderboards';
import { generateWeeklySummary } from './handlers/weeklySummary';

export const api = functions.https.onRequest(app);

export const onSessionCreate = functions.firestore
  .document('sessions/{sessionId}')
  .onCreate(async (snap) => {
    const session = snap.data();
    const userId = session.userId;

    if (!userId) {
      console.warn('Session created without userId', snap.id);
      return;
    }

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    await checkAndAwardBadges(userId);

    await db.collection('activities').add({
      userId,
      userName: userData.displayName || 'User',
      userPhoto: userData.photoURL || null,
      type: 'session_complete',
      sessionId: snap.id,
      topic: session.topic,
      duration: session.duration,
      xpEarned: session.xpEarned,
      score: session.score,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      reactions: {},
    });

    handleGenerateAISummary(snap.id, userId, session).catch(console.error);
  });

export const updateLeaderboardsDaily = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('America/New_York')
  .onRun(async () => {
    await updateLeaderboards();
  });

export const generateWeeklySummaries = functions.pubsub
  .schedule('every sunday 23:59')
  .timeZone('America/New_York')
  .onRun(async () => {
    await generateWeeklySummary();
  });

export const addFriend = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { friendId } = data;

  await db
    .collection('users')
    .doc(userId)
    .update({
      friends: admin.firestore.FieldValue.arrayUnion(friendId),
    });

  return { success: true };
});

export const removeFriend = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const { friendId } = data;

  await db
    .collection('users')
    .doc(userId)
    .update({
      friends: admin.firestore.FieldValue.arrayRemove(friendId),
    });

  return { success: true };
});

