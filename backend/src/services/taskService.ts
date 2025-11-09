import { db } from '../config/firebase';
import { nowTimestamp, toTimestamp } from '../utils/firestore';

const TASKS_COLLECTION = 'tasks';
const SUBTASKS_COLLECTION = 'subtasks';
const CALENDAR_BLOCKS_COLLECTION = 'calendarBlocks';
const POINTS_LEDGER_COLLECTION = 'pointsLedger';
const TASK_SPLIT_REQUESTS = 'taskSplitRequests';
const USERS_COLLECTION = 'users';

export interface TaskCreateInput {
  title: string;
  description?: string;
  severity?: 'tiny' | 'homework' | 'project' | 'midterm';
  estimatedMinutes?: number;
  dueDate?: string | Date | null;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface TaskUpdateInput {
  title?: string;
  description?: string | null;
  severity?: 'tiny' | 'homework' | 'project' | 'midterm';
  estimatedMinutes?: number | null;
  dueDate?: string | Date | null;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags?: string[] | null;
}

export interface TaskListOptions {
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  limit?: number;
}

export async function createTask(userId: string, input: TaskCreateInput) {
  const ref = db.collection(TASKS_COLLECTION).doc();
  const now = nowTimestamp();

  await ref.set({
    userId,
    title: input.title,
    description: input.description || null,
    severity: input.severity || 'homework',
    estimatedMinutes: input.estimatedMinutes ?? null,
    dueDate: input.dueDate ? toTimestamp(input.dueDate) : null,
    priority: input.priority || 'medium',
    status: 'pending',
    tags: input.tags || [],
    completionFraction: 0,
    subtasksGenerated: false,
    createdAt: now,
    updatedAt: now,
  });

  return { id: ref.id };
}

export async function listTasks(userId: string, options: TaskListOptions = {}) {
  let query: FirebaseFirestore.Query = db
    .collection(TASKS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc');

  if (options.status) {
    query = query.where('status', '==', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: TaskUpdateInput
) {
  const ref = db.collection(TASKS_COLLECTION).doc(taskId);
  const snapshot = await ref.get();

  if (!snapshot.exists || snapshot.data()?.userId !== userId) {
    throw Object.assign(new Error('Task not found'), {
      status: 404,
      code: 'task_not_found',
    });
  }

  const updatePayload: Record<string, unknown> = {
    updatedAt: nowTimestamp(),
  };

  if (input.title !== undefined) updatePayload.title = input.title;
  if (input.description !== undefined)
    updatePayload.description = input.description;
  if (input.severity !== undefined) updatePayload.severity = input.severity;
  if (input.estimatedMinutes !== undefined)
    updatePayload.estimatedMinutes = input.estimatedMinutes;
  if (input.dueDate !== undefined)
    updatePayload.dueDate = input.dueDate ? toTimestamp(input.dueDate) : null;
  if (input.priority !== undefined) updatePayload.priority = input.priority;
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.tags !== undefined) updatePayload.tags = input.tags;

  await ref.update(updatePayload);
  return (await ref.get()).data();
}

function deriveCompletionReward(estimatedMinutes?: number | null) {
  if (!estimatedMinutes || estimatedMinutes <= 0) {
    return 1;
  }
  return Math.max(1, Math.round(estimatedMinutes / 30));
}

export async function completeTask(
  userId: string,
  taskId: string,
  data: { completionFraction?: number; actualMinutes?: number; notes?: string }
) {
  const taskRef = db.collection(TASKS_COLLECTION).doc(taskId);
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const ledgerRef = db.collection(POINTS_LEDGER_COLLECTION).doc();

  await db.runTransaction(async (transaction) => {
    const [taskDoc, userDoc] = await Promise.all([
      transaction.get(taskRef),
      transaction.get(userRef),
    ]);

    if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
      throw Object.assign(new Error('Task not found'), {
        status: 404,
        code: 'task_not_found',
      });
    }

    const taskData = taskDoc.data() as any;
    const currentPoints = userDoc.data()?.points ?? 0;

    const completionFraction = data.completionFraction ?? 1;
    const reward = deriveCompletionReward(taskData.estimatedMinutes);
    const pointsDelta = Math.round(reward * completionFraction);

    transaction.update(taskRef, {
      status: completionFraction >= 1 ? 'completed' : 'in_progress',
      completionFraction,
      actualMinutes: data.actualMinutes ?? null,
      notes: data.notes ?? taskData.notes ?? null,
      completedAt: nowTimestamp(),
      updatedAt: nowTimestamp(),
    });

    transaction.update(userRef, {
      points: currentPoints + pointsDelta,
      updatedAt: nowTimestamp(),
    });

    transaction.set(ledgerRef, {
      userId,
      taskId,
      delta: pointsDelta,
      reason: 'task_completion',
      balanceAfter: currentPoints + pointsDelta,
      createdAt: nowTimestamp(),
    });
  });

  return (await taskRef.get()).data();
}

export async function enqueueTaskSplit(
  userId: string,
  taskId: string,
  instructions?: string
) {
  const ref = db.collection(TASK_SPLIT_REQUESTS).doc();
  await ref.set({
    userId,
    taskId,
    instructions: instructions || null,
    status: 'queued',
    createdAt: nowTimestamp(),
    updatedAt: nowTimestamp(),
  });

  await db.collection(TASKS_COLLECTION).doc(taskId).set(
    {
      subtasksGenerated: false,
      splitRequestId: ref.id,
      updatedAt: nowTimestamp(),
    },
    { merge: true }
  );

  return { requestId: ref.id };
}

export async function listSubtasks(userId: string, taskId: string) {
  const snapshot = await db
    .collection(SUBTASKS_COLLECTION)
    .where('userId', '==', userId)
    .where('parentTaskId', '==', taskId)
    .orderBy('order', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function acknowledgeCalendarPlan(
  userId: string,
  blockIds: string[]
) {
  if (blockIds.length === 0) return [];

  const batch = db.batch();
  const updated: string[] = [];

  for (const blockId of blockIds) {
    const ref = db.collection(CALENDAR_BLOCKS_COLLECTION).doc(blockId);
    batch.update(ref, {
      userId,
      status: 'accepted',
      updatedAt: nowTimestamp(),
    });
    updated.push(blockId);
  }

  await batch.commit();
  return updated;
}

