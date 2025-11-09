"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const sessionService_1 = require("../services/sessionService");
const response_1 = require("../utils/response");
const firebase_1 = require("../config/firebase");
const firestore_1 = require("../utils/firestore");
const router = (0, express_1.Router)();
exports.sessionsRouter = router;
const computeSchema = zod_1.z.object({
    sessionStart: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.number()]),
    sessionEnd: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.number()]),
    trigger: zod_1.z.enum(['manual', 'auto', 'cron']).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
router.post('/compute', (0, auth_1.requireAuth)(['sessions.write']), async (req, res) => {
    const parsed = computeSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid session compute payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const sessionStart = typeof parsed.data.sessionStart === 'number'
            ? new Date(parsed.data.sessionStart)
            : new Date(parsed.data.sessionStart);
        const sessionEnd = typeof parsed.data.sessionEnd === 'number'
            ? new Date(parsed.data.sessionEnd)
            : new Date(parsed.data.sessionEnd);
        const result = await (0, sessionService_1.computeSessionForRange)({
            userId: req.auth.userId,
            sessionStart,
            sessionEnd,
            trigger: parsed.data.trigger,
            metadata: parsed.data.metadata,
        });
        return (0, response_1.success)(res, result, {}, 201);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'session_compute_failed',
            message: error?.message || 'Failed to compute session',
        });
    }
});
const listQuerySchema = zod_1.z.object({
    start: zod_1.z.string().datetime().optional(),
    end: zod_1.z.string().datetime().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).optional(),
});
router.get('/', (0, auth_1.requireAuth)(['sessions.read']), async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid query parameters',
            details: parsed.error.flatten(),
        });
    }
    try {
        let query = firebase_1.db
            .collection('sessions')
            .where('userId', '==', req.auth.userId)
            .orderBy('startTime', 'desc');
        if (parsed.data.start) {
            query = query.where('startTime', '>=', (0, firestore_1.toTimestamp)(new Date(parsed.data.start)));
        }
        if (parsed.data.end) {
            query = query.where('endTime', '<=', (0, firestore_1.toTimestamp)(new Date(parsed.data.end)));
        }
        const limit = parsed.data.limit ?? 20;
        query = query.limit(limit);
        const snapshot = await query.get();
        const sessions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        return (0, response_1.success)(res, { sessions, count: sessions.length });
    }
    catch (error) {
        console.error('Failed to list sessions', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'session_list_failed',
            message: 'Failed to fetch sessions',
        });
    }
});
router.get('/:id', (0, auth_1.requireAuth)(['sessions.read']), async (req, res) => {
    try {
        const doc = await firebase_1.db.collection('sessions').doc(req.params.id).get();
        if (!doc.exists || doc.data()?.userId !== req.auth.userId) {
            return (0, response_1.apiError)(res, {
                status: 404,
                code: 'session_not_found',
                message: 'Session not found',
            });
        }
        return (0, response_1.success)(res, {
            id: doc.id,
            ...doc.data(),
        });
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'session_fetch_failed',
            message: 'Failed to fetch session',
        });
    }
});
//# sourceMappingURL=sessions.js.map