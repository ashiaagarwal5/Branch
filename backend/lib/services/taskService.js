"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.listTasks = listTasks;
exports.updateTask = updateTask;
exports.completeTask = completeTask;
exports.enqueueTaskSplit = enqueueTaskSplit;
exports.listSubtasks = listSubtasks;
exports.acknowledgeCalendarPlan = acknowledgeCalendarPlan;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("../utils/firestore");
const TASKS_COLLECTION = 'tasks';
const SUBTASKS_COLLECTION = 'subtasks';
const CALENDAR_BLOCKS_COLLECTION = 'calendarBlocks';
const POINTS_LEDGER_COLLECTION = 'pointsLedger';
const TASK_SPLIT_REQUESTS = 'taskSplitRequests';
const USERS_COLLECTION = 'users';
async function createTask(userId, input) {
    const ref = firebase_1.db.collection(TASKS_COLLECTION).doc();
    const now = (0, firestore_1.nowTimestamp)();
    await ref.set({
        userId,
        title: input.title,
        description: input.description || null,
        severity: input.severity || 'homework',
        estimatedMinutes: input.estimatedMinutes ?? null,
        dueDate: input.dueDate ? (0, firestore_1.toTimestamp)(input.dueDate) : null,
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
async function listTasks(userId, options = {}) {
    let query = firebase_1.db
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
async function updateTask(userId, taskId, input) {
    const ref = firebase_1.db.collection(TASKS_COLLECTION).doc(taskId);
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.data()?.userId !== userId) {
        throw Object.assign(new Error('Task not found'), {
            status: 404,
            code: 'task_not_found',
        });
    }
    const updatePayload = {
        updatedAt: (0, firestore_1.nowTimestamp)(),
    };
    if (input.title !== undefined)
        updatePayload.title = input.title;
    if (input.description !== undefined)
        updatePayload.description = input.description;
    if (input.severity !== undefined)
        updatePayload.severity = input.severity;
    if (input.estimatedMinutes !== undefined)
        updatePayload.estimatedMinutes = input.estimatedMinutes;
    if (input.dueDate !== undefined)
        updatePayload.dueDate = input.dueDate ? (0, firestore_1.toTimestamp)(input.dueDate) : null;
    if (input.priority !== undefined)
        updatePayload.priority = input.priority;
    if (input.status !== undefined)
        updatePayload.status = input.status;
    if (input.tags !== undefined)
        updatePayload.tags = input.tags;
    await ref.update(updatePayload);
    return (await ref.get()).data();
}
function deriveCompletionReward(estimatedMinutes) {
    if (!estimatedMinutes || estimatedMinutes <= 0) {
        return 1;
    }
    return Math.max(1, Math.round(estimatedMinutes / 30));
}
async function completeTask(userId, taskId, data) {
    const taskRef = firebase_1.db.collection(TASKS_COLLECTION).doc(taskId);
    const userRef = firebase_1.db.collection(USERS_COLLECTION).doc(userId);
    const ledgerRef = firebase_1.db.collection(POINTS_LEDGER_COLLECTION).doc();
    await firebase_1.db.runTransaction(async (transaction) => {
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
        const taskData = taskDoc.data();
        const currentPoints = userDoc.data()?.points ?? 0;
        const completionFraction = data.completionFraction ?? 1;
        const reward = deriveCompletionReward(taskData.estimatedMinutes);
        const pointsDelta = Math.round(reward * completionFraction);
        transaction.update(taskRef, {
            status: completionFraction >= 1 ? 'completed' : 'in_progress',
            completionFraction,
            actualMinutes: data.actualMinutes ?? null,
            notes: data.notes ?? taskData.notes ?? null,
            completedAt: (0, firestore_1.nowTimestamp)(),
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.update(userRef, {
            points: currentPoints + pointsDelta,
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
        transaction.set(ledgerRef, {
            userId,
            taskId,
            delta: pointsDelta,
            reason: 'task_completion',
            balanceAfter: currentPoints + pointsDelta,
            createdAt: (0, firestore_1.nowTimestamp)(),
        });
    });
    return (await taskRef.get()).data();
}
async function enqueueTaskSplit(userId, taskId, instructions) {
    const ref = firebase_1.db.collection(TASK_SPLIT_REQUESTS).doc();
    await ref.set({
        userId,
        taskId,
        instructions: instructions || null,
        status: 'queued',
        createdAt: (0, firestore_1.nowTimestamp)(),
        updatedAt: (0, firestore_1.nowTimestamp)(),
    });
    await firebase_1.db.collection(TASKS_COLLECTION).doc(taskId).set({
        subtasksGenerated: false,
        splitRequestId: ref.id,
        updatedAt: (0, firestore_1.nowTimestamp)(),
    }, { merge: true });
    return { requestId: ref.id };
}
async function listSubtasks(userId, taskId) {
    const snapshot = await firebase_1.db
        .collection(SUBTASKS_COLLECTION)
        .where('userId', '==', userId)
        .where('parentTaskId', '==', taskId)
        .orderBy('order', 'asc')
        .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function acknowledgeCalendarPlan(userId, blockIds) {
    if (blockIds.length === 0)
        return [];
    const batch = firebase_1.db.batch();
    const updated = [];
    for (const blockId of blockIds) {
        const ref = firebase_1.db.collection(CALENDAR_BLOCKS_COLLECTION).doc(blockId);
        batch.update(ref, {
            userId,
            status: 'accepted',
            updatedAt: (0, firestore_1.nowTimestamp)(),
        });
        updated.push(blockId);
    }
    await batch.commit();
    return updated;
}
//# sourceMappingURL=taskService.js.map