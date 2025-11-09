import { db } from '../config/firebase';
import { nowTimestamp } from '../utils/firestore';

const FEED_COLLECTION = 'feed';
const KUDOS_COLLECTION = 'kudos';

export interface CreateFeedInput {
  type: 'session' | 'badge' | 'bet' | 'custom';
  message?: string;
  payload?: Record<string, unknown>;
  scope?: 'private' | 'friends' | 'public';
  imageUrl?: string | null;
}

export async function createFeedPost(userId: string, input: CreateFeedInput) {
  const ref = db.collection(FEED_COLLECTION).doc();

  await ref.set({
    userId,
    type: input.type,
    message: input.message || null,
    payload: input.payload || {},
    scope: input.scope || 'friends',
    imageUrl: input.imageUrl || null,
    reactions: {},
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  });

  return { id: ref.id };
}

export async function listFeed(
  userId: string,
  options: { scope?: 'friends' | 'public'; limit?: number } = {}
) {
  let query = db
    .collection(FEED_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(options.limit || 25);

  if (options.scope === 'public') {
    query = query.where('scope', '==', 'public');
  }

  const snapshot = await query.get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((post: any) => {
      if (post.scope === 'public') return true;
      if (post.scope === 'friends') {
        return post.userId === userId || (post.allowedUsers || []).includes(userId);
      }
      return post.userId === userId;
    });
}

export async function addKudos(
  userId: string,
  feedId: string,
  emoji: string,
  message?: string
) {
  const kudosRef = db.collection(KUDOS_COLLECTION).doc();
  await kudosRef.set({
    feedId,
    userId,
    emoji,
    message: message || null,
    createdAt: nowTimestamp(),
  });

  const feedRef = db.collection(FEED_COLLECTION).doc(feedId);
  await feedRef.set(
    {
      updatedAt: nowTimestamp(),
    },
    { merge: true }
  );

  return { id: kudosRef.id };
}

