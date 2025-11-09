import { differenceInSeconds } from 'date-fns';
import { calculateXP, calculateLevel } from '@dan/shared';
import { admin, db } from '../config/firebase';
import { nowTimestamp, toTimestamp } from '../utils/firestore';

const SESSIONS_COLLECTION = 'sessions';
const TASKS_COLLECTION = 'tasks';
const POINTS_LEDGER_COLLECTION = 'pointsLedger';
const USER_STATS_COLLECTION = 'userStats';
const USERS_COLLECTION = 'users';

const SEVERITY_WEIGHTS: Record<string, number> = {
  tiny: 1,
  homework: 2,
  project: 4,
  midterm: 5,
};

interface ComputeSessionInput {
  userId: string;
  sessionStart: string | Date;
  sessionEnd: string | Date;
  trigger?: 'manual' | 'auto' | 'cron';
  metadata?: Record<string, unknown>;
}

export interface ComputedSessionResult {
  sessionId: string;
  score: number;
  productiveSeconds: number;
  totalSeconds: number;
  taskScore: number;
  focusIndex: number;
  xpEarned: number;
  pointsAwarded: number;
}

export async function computeSessionForRange(
  input: ComputeSessionInput
): Promise<ComputedSessionResult> {
  const start = new Date(input.sessionStart);
  const end = new Date(input.sessionEnd);

  if (end <= start) {
    throw Object.assign(new Error('sessionEnd must be after sessionStart'), {
      status: 400,
      code: 'invalid_time_range',
    });
  }

  const startTs = toTimestamp(start);
  const endTs = toTimestamp(end);

  const logsSnapshot = await db
    .collection('activityLogs')
    .where('userId', '==', input.userId)
    .where('endedAt', '>=', startTs)
    .where('startedAt', '<=', endTs)
    .get();

  if (logsSnapshot.empty) {
    throw Object.assign(new Error('No activity logs found for range'), {
      status: 404,
      code: 'no_activity_logs',
    });
  }

  const activityDocs = logsSnapshot.docs.map((doc) => doc.data() as any);

  let totalSeconds = 0;
  let productiveSeconds = 0;
  let activeSeconds = 0;
  let idleSeconds = 0;
  let tabSwitches = 0;
  const domains = new Set<string>();
  const categoryDuration: Record<string, number> = {};

  activityDocs.forEach((activity) => {
    const startDate = activity.startedAt.toDate();
    const endDate = activity.endedAt.toDate();
    const duration = Math.max(0, differenceInSeconds(endDate, startDate));

    totalSeconds += duration;
    activeSeconds += activity.interactionSeconds ?? duration;
    idleSeconds += Math.max(0, duration - (activity.interactionSeconds || 0));
    tabSwitches += activity.metadata?.tabSwitches || 0;
    if (activity.domain) {
      domains.add(activity.domain);
    }

    const category = activity.classification?.category ?? 'unknown';
    categoryDuration[category] = (categoryDuration[category] || 0) + duration;

    if (activity.classification?.productive) {
      productiveSeconds += activity.interactionSeconds ?? duration;
    }
  });

  const focusIndex =
    totalSeconds > 0 ? productiveSeconds / totalSeconds : 0;

  const tasksSnapshot = await db
    .collection(TASKS_COLLECTION)
    .where('userId', '==', input.userId)
    .where('completedAt', '>=', startTs)
    .where('completedAt', '<=', endTs)
    .get();

  const taskScore = tasksSnapshot.docs.reduce((acc, doc) => {
    const data = doc.data() as any;
    const weight =
      data.weight ||
      SEVERITY_WEIGHTS[data.severity as string] ||
      1;
    const completion = data.completionFraction ?? (data.status === 'completed' ? 1 : 0);
    return acc + weight * completion;
  }, 0);

  const productiveMinutes = productiveSeconds / 60;
  const rawScore =
    0.6 * productiveMinutes +
    0.02 * (taskScore * 60) +
    0.02 * (focusIndex * 1000);

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const durationMinutes = totalSeconds / 60;
  const xpEarned = calculateXP(durationMinutes, focusIndex);
  const pointsAwarded =
    Math.round(score / 10) + Math.floor(productiveSeconds / 600);

  const sessionId = await persistSession({
    userId: input.userId,
    start,
    end,
    totalSeconds,
    productiveSeconds,
    activeSeconds,
    idleSeconds,
    focusIndex,
    taskScore,
    score,
    xpEarned,
    pointsAwarded,
    tabSwitches,
    domains: Array.from(domains),
    categories: categoryDuration,
    trigger: input.trigger,
    metadata: input.metadata,
  });

  return {
    sessionId,
    score,
    productiveSeconds,
    totalSeconds,
    taskScore,
    focusIndex,
    xpEarned,
    pointsAwarded,
  };
}

interface PersistSessionInput {
  userId: string;
  start: Date;
  end: Date;
  totalSeconds: number;
  productiveSeconds: number;
  activeSeconds: number;
  idleSeconds: number;
  focusIndex: number;
  taskScore: number;
  score: number;
  xpEarned: number;
  pointsAwarded: number;
  tabSwitches: number;
  domains: string[];
  categories: Record<string, number>;
  trigger?: string;
  metadata?: Record<string, unknown>;
}

async function persistSession(input: PersistSessionInput) {
  const sessionRef = db.collection(SESSIONS_COLLECTION).doc();
  const userRef = db.collection(USERS_COLLECTION).doc(input.userId);
  const statsRef = db.collection(USER_STATS_COLLECTION).doc(input.userId);
  const ledgerRef = db.collection(POINTS_LEDGER_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data() || {};

    const newXP = (userData.xp || 0) + input.xpEarned;
    const newLevel = calculateLevel(newXP);
    const newPoints = (userData.points || 0) + input.pointsAwarded;
    const newTotalStudy =
      (userData.totalStudyTime || 0) + input.totalSeconds / 60;

    transaction.set(
      sessionRef,
      {
        userId: input.userId,
        startTime: toTimestamp(input.start),
        endTime: toTimestamp(input.end),
        duration: input.totalSeconds,
        productiveSeconds: input.productiveSeconds,
        activeTime: input.activeSeconds,
        idleTime: input.idleSeconds,
        focusIndex: input.focusIndex,
        taskScore: input.taskScore,
        score: input.score,
        xpEarned: input.xpEarned,
        pointsAwarded: input.pointsAwarded,
        tabSwitches: input.tabSwitches,
        domains: input.domains,
        categoryDuration: input.categories,
        trigger: input.trigger || 'manual',
        metadata: input.metadata || {},
        createdAt: nowTimestamp(),
        updatedAt: nowTimestamp(),
      },
      { merge: false }
    );

    transaction.set(
      ledgerRef,
      {
        userId: input.userId,
        sessionId: sessionRef.id,
        delta: input.pointsAwarded,
        reason: 'session_score',
        balanceAfter: newPoints,
        createdAt: nowTimestamp(),
      },
      { merge: false }
    );

    transaction.set(
      statsRef,
      {
        userId: input.userId,
        totalSessions: admin.firestore.FieldValue.increment(1),
        totalHours: admin.firestore.FieldValue.increment(
          input.totalSeconds / 3600
        ),
        averageFocusScore: input.focusIndex,
        averageProductivityScore: input.score,
        updatedAt: nowTimestamp(),
      },
      { merge: true }
    );

    transaction.update(userRef, {
      xp: newXP,
      level: newLevel,
      points: newPoints,
      totalStudyTime: newTotalStudy,
      updatedAt: nowTimestamp(),
    });
  });

  return sessionRef.id;
}

