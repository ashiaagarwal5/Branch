"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const activityService_1 = require("../services/activityService");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
exports.logsRouter = router;
const classificationSchema = zod_1.z
    .object({
    category: zod_1.z.string().min(1).max(100).optional(),
    productive: zod_1.z.boolean().optional(),
    confidence: zod_1.z.number().min(0).max(1).optional(),
    probabilities: zod_1.z.record(zod_1.z.number().min(0).max(1)).optional(),
})
    .optional();
const activitySchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    title: zod_1.z.string().min(1).max(1024),
    domain: zod_1.z.string().min(1).max(255),
    startedAt: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.number()]),
    endedAt: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.number()]),
    interactionSeconds: zod_1.z.number().int().min(0),
    classification: classificationSchema,
    source: zod_1.z.enum(['extension', 'manual']).optional(),
    platform: zod_1.z.string().max(120).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    eventId: zod_1.z.string().min(4).max(128).optional(),
});
router.post('/activity', (0, auth_1.requireAuth)(['logs.write']), async (req, res) => {
    const parsed = activitySchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid activity payload',
            details: parsed.error.flatten(),
        });
    }
    const payload = parsed.data;
    const startedAt = typeof payload.startedAt === 'number'
        ? new Date(payload.startedAt)
        : new Date(payload.startedAt);
    const endedAt = typeof payload.endedAt === 'number'
        ? new Date(payload.endedAt)
        : new Date(payload.endedAt);
    try {
        const id = await (0, activityService_1.saveActivityLog)({
            userId: req.auth.userId,
            ...payload,
            startedAt,
            endedAt,
        });
        return (0, response_1.success)(res, { id });
    }
    catch (error) {
        console.error('Failed to save activity', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'activity_save_failed',
            message: 'Failed to save activity log',
        });
    }
});
const batchSchema = zod_1.z.object({
    events: zod_1.z.array(activitySchema),
});
router.post('/batch', (0, auth_1.requireAuth)(['logs.write']), async (req, res) => {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid batch payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const logs = parsed.data.events.map((event) => ({
            ...event,
            startedAt: typeof event.startedAt === 'number'
                ? new Date(event.startedAt)
                : new Date(event.startedAt),
            endedAt: typeof event.endedAt === 'number'
                ? new Date(event.endedAt)
                : new Date(event.endedAt),
        }));
        const ids = await (0, activityService_1.saveActivityBatch)(req.auth.userId, logs);
        return (0, response_1.success)(res, { count: ids.length, ids });
    }
    catch (error) {
        console.error('Failed to save activity batch', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'activity_batch_failed',
            message: 'Failed to save activity batch',
        });
    }
});
//# sourceMappingURL=logs.js.map