import { db } from '../config/firebase';

const LEADERBOARD_COLLECTION = 'leaderboards';

export interface LeaderboardQuery {
  scope: 'global' | 'friends';
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  category: 'points' | 'hours' | 'streak' | 'xp' | 'focus';
  limit?: number;
  userId?: string;
}

function docIdFromQuery(query: LeaderboardQuery) {
  return `${query.scope}-${query.period}-${query.category}`;
}

export async function getLeaderboard(query: LeaderboardQuery) {
  const docId = docIdFromQuery(query);
  const snapshot = await db
    .collection(LEADERBOARD_COLLECTION)
    .doc(docId)
    .get();

  if (!snapshot.exists) {
    return {
      entries: [],
      count: 0,
    };
  }

  const data = snapshot.data() as any;
  const entries = (data.entries || []).slice(
    0,
    query.limit ? Math.min(query.limit, data.entries.length) : data.entries.length
  );

  let userRank: number | null = null;
  if (query.userId) {
    const match = data.entries.findIndex(
      (entry: any) => entry.userId === query.userId
    );
    userRank = match >= 0 ? match + 1 : null;
  }

  return {
    entries,
    count: entries.length,
    generatedAt: data.updatedAt,
    userRank,
  };
}

