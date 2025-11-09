import { db } from '../config/firebase';
import { nowTimestamp, toTimestamp } from '../utils/firestore';

const COLLECTION = 'activityLogs';

export interface ActivityClassification {
  category?: string;
  productive?: boolean;
  confidence?: number;
  probabilities?: Record<string, number>;
}

export interface ActivityLogInput {
  userId: string;
  url: string;
  title: string;
  domain: string;
  startedAt: string | Date;
  endedAt: string | Date;
  interactionSeconds: number;
  classification?: ActivityClassification | null;
  source?: 'extension' | 'manual';
  platform?: string;
  metadata?: Record<string, unknown>;
  eventId?: string;
}

export async function saveActivityLog(input: ActivityLogInput) {
  const startDate = new Date(input.startedAt);
  const endDate = new Date(input.endedAt);
  const durationSeconds = Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / 1000)
  );

  const doc = {
    userId: input.userId,
    url: input.url,
    title: input.title,
    domain: input.domain,
    startedAt: toTimestamp(startDate),
    endedAt: toTimestamp(endDate),
    interactionSeconds: input.interactionSeconds,
    durationSeconds,
    classification: input.classification || null,
    source: input.source || 'extension',
    platform: input.platform || 'chrome-extension',
    metadata: input.metadata || {},
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  };

  if (input.eventId) {
    await db.collection(COLLECTION).doc(input.eventId).set(doc, { merge: true });
    return input.eventId;
  }

  const ref = await db.collection(COLLECTION).add(doc);
  return ref.id;
}

export async function saveActivityBatch(
  userId: string,
  logs: Array<Omit<ActivityLogInput, 'userId'>>
) {
  if (logs.length === 0) return [];

  const batch = db.batch();
  const ids: string[] = [];

  logs.forEach((log) => {
    const startDate = new Date(log.startedAt);
    const endDate = new Date(log.endedAt);
    const durationSeconds = Math.max(
      0,
      Math.round((endDate.getTime() - startDate.getTime()) / 1000)
    );

    const doc = {
      userId,
      url: log.url,
      title: log.title,
      domain: log.domain,
      startedAt: toTimestamp(startDate),
      endedAt: toTimestamp(endDate),
      interactionSeconds: log.interactionSeconds,
      durationSeconds,
      classification: log.classification || null,
      source: log.source || 'extension',
      platform: log.platform || 'chrome-extension',
      metadata: log.metadata || {},
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
    };

    const ref = log.eventId
      ? db.collection(COLLECTION).doc(log.eventId)
      : db.collection(COLLECTION).doc();

    batch.set(ref, doc, { merge: true });
    ids.push(ref.id);
  });

  await batch.commit();

  return ids;
}

