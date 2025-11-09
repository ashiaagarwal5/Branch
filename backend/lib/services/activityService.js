"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveActivityLog = saveActivityLog;
exports.saveActivityBatch = saveActivityBatch;
const firebase_1 = require("../config/firebase");
const firestore_1 = require("../utils/firestore");
const COLLECTION = 'activityLogs';
async function saveActivityLog(input) {
    const startDate = new Date(input.startedAt);
    const endDate = new Date(input.endedAt);
    const durationSeconds = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000));
    const doc = {
        userId: input.userId,
        url: input.url,
        title: input.title,
        domain: input.domain,
        startedAt: (0, firestore_1.toTimestamp)(startDate),
        endedAt: (0, firestore_1.toTimestamp)(endDate),
        interactionSeconds: input.interactionSeconds,
        durationSeconds,
        classification: input.classification || null,
        source: input.source || 'extension',
        platform: input.platform || 'chrome-extension',
        metadata: input.metadata || {},
        createdAt: (0, firestore_1.nowTimestamp)(),
        updatedAt: (0, firestore_1.nowTimestamp)(),
    };
    if (input.eventId) {
        await firebase_1.db.collection(COLLECTION).doc(input.eventId).set(doc, { merge: true });
        return input.eventId;
    }
    const ref = await firebase_1.db.collection(COLLECTION).add(doc);
    return ref.id;
}
async function saveActivityBatch(userId, logs) {
    if (logs.length === 0)
        return [];
    const batch = firebase_1.db.batch();
    const ids = [];
    logs.forEach((log) => {
        const startDate = new Date(log.startedAt);
        const endDate = new Date(log.endedAt);
        const durationSeconds = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000));
        const doc = {
            userId,
            url: log.url,
            title: log.title,
            domain: log.domain,
            startedAt: (0, firestore_1.toTimestamp)(startDate),
            endedAt: (0, firestore_1.toTimestamp)(endDate),
            interactionSeconds: log.interactionSeconds,
            durationSeconds,
            classification: log.classification || null,
            source: log.source || 'extension',
            platform: log.platform || 'chrome-extension',
            metadata: log.metadata || {},
            createdAt: (0, firestore_1.nowTimestamp)(),
            updatedAt: (0, firestore_1.nowTimestamp)(),
        };
        const ref = log.eventId
            ? firebase_1.db.collection(COLLECTION).doc(log.eventId)
            : firebase_1.db.collection(COLLECTION).doc();
        batch.set(ref, doc, { merge: true });
        ids.push(ref.id);
    });
    await batch.commit();
    return ids;
}
//# sourceMappingURL=activityService.js.map