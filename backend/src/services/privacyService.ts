import { db } from '../config/firebase';
import { nowTimestamp } from '../utils/firestore';
import { flagUserForDeletion } from './userModelService';

const USER_SETTINGS_COLLECTION = 'userSettings';
const PRIVACY_EXPORTS_COLLECTION = 'dataExports';

export async function getPrivacySettings(userId: string) {
  const doc = await db.collection(USER_SETTINGS_COLLECTION).doc(userId).get();
  return doc.data() || null;
}

export async function updatePrivacySettings(
  userId: string,
  settings: Record<string, unknown>
) {
  const ref = db.collection(USER_SETTINGS_COLLECTION).doc(userId);
  await ref.set(
    {
      userId,
      privacy: settings,
      updatedAt: nowTimestamp(),
    },
    { merge: true }
  );

  return (await ref.get()).data();
}

export async function requestDataExport(
  userId: string,
  channels: Array<'email' | 'download'> = ['download']
) {
  const ref = db.collection(PRIVACY_EXPORTS_COLLECTION).doc();
  await ref.set({
    userId,
    status: 'queued',
    channels,
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  });

  return { requestId: ref.id };
}

export async function requestAccountDeletion(userId: string) {
  await flagUserForDeletion(userId);
}

