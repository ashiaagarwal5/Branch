import { db } from '../config/firebase';
import { nowTimestamp } from '../utils/firestore';

const USERS_COLLECTION = 'users';
const USER_SETTINGS_COLLECTION = 'userSettings';
const USER_MODEL_COLLECTION = 'userModels';
const USER_ADAPTIVE_STATE_COLLECTION = 'userAdaptiveState';

export interface AdaptiveStateUpdate {
  focusPreferences?: Record<string, unknown>;
  modelFeatures?: Record<string, number>;
  tags?: string[];
  lastSelfReportScore?: number;
  notes?: string;
}

export async function getUserCompositeProfile(userId: string) {
  const [userDoc, settingsDoc, statsDoc, modelDoc, adaptiveDoc] = await Promise.all([
    db.collection(USERS_COLLECTION).doc(userId).get(),
    db.collection(USER_SETTINGS_COLLECTION).doc(userId).get(),
    db.collection('userStats').doc(userId).get(),
    db.collection(USER_MODEL_COLLECTION).doc(userId).get(),
    db.collection(USER_ADAPTIVE_STATE_COLLECTION).doc(userId).get(),
  ]);

  return {
    user: userDoc.data() || null,
    settings: settingsDoc.data() || null,
    stats: statsDoc.data() || null,
    model: modelDoc.data() || null,
    adaptiveState: adaptiveDoc.data() || null,
  };
}

export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
) {
  const ref = db.collection(USER_SETTINGS_COLLECTION).doc(userId);

  await ref.set(
    {
      userId,
      preferences,
      updatedAt: nowTimestamp(),
    },
    { merge: true }
  );

  return (await ref.get()).data();
}

export async function upsertAdaptiveState(
  userId: string,
  update: AdaptiveStateUpdate
) {
  const ref = db.collection(USER_ADAPTIVE_STATE_COLLECTION).doc(userId);

  await ref.set(
    {
      userId,
      ...update,
      updatedAt: nowTimestamp(),
    },
    { merge: true }
  );

  return (await ref.get()).data();
}

export async function recordUserModelSnapshot(
  userId: string,
  payload: Record<string, unknown>
) {
  const ref = db.collection(USER_MODEL_COLLECTION).doc(userId);
  await ref.set(
    {
      userId,
      ...payload,
      updatedAt: nowTimestamp(),
    },
    { merge: true }
  );
  return (await ref.get()).data();
}

export async function flagUserForDeletion(userId: string) {
  await db
    .collection(USERS_COLLECTION)
    .doc(userId)
    .set(
      {
        deletionRequestedAt: nowTimestamp(),
        deletionStatus: 'pending',
      },
      { merge: true }
    );
}

