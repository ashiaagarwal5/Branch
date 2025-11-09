"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const socialService_1 = require("../services/socialService");
const router = (0, express_1.Router)();
exports.socialRouter = router;
const feedSchema = zod_1.z.object({
    type: zod_1.z.enum(['session', 'badge', 'bet', 'custom']),
    message: zod_1.z.string().max(2000).optional(),
    payload: zod_1.z.record(zod_1.z.any()).optional(),
    scope: zod_1.z.enum(['private', 'friends', 'public']).optional(),
    imageUrl: zod_1.z.string().url().optional(),
});
router.post('/feed', (0, auth_1.requireAuth)(['social.write']), async (req, res) => {
    const parsed = feedSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid feed payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const post = await (0, socialService_1.createFeedPost)(req.auth.userId, parsed.data);
        return (0, response_1.success)(res, post, {}, 201);
    }
    catch (error) {
        console.error('Failed to create feed post', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'feed_create_failed',
            message: 'Failed to create feed post',
        });
    }
});
const listFeedSchema = zod_1.z.object({
    scope: zod_1.z.enum(['friends', 'public']).optional(),
    limit: zod_1.z.coerce.number().min(1).max(50).optional(),
});
router.get('/feed', (0, auth_1.requireAuth)(['social.read']), async (req, res) => {
    const parsed = listFeedSchema.safeParse(req.query);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid feed query',
            details: parsed.error.flatten(),
        });
    }
    try {
        const feed = await (0, socialService_1.listFeed)(req.auth.userId, parsed.data);
        return (0, response_1.success)(res, { feed, count: feed.length });
    }
    catch (error) {
        console.error('Failed to fetch feed', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'feed_fetch_failed',
            message: 'Failed to fetch feed',
        });
    }
});
const kudosSchema = zod_1.z.object({
    emoji: zod_1.z.string().min(1).max(8),
    message: zod_1.z.string().max(500).optional(),
});
router.post('/feed/:feedId/kudos', (0, auth_1.requireAuth)(['social.write']), async (req, res) => {
    const parsed = kudosSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid kudos payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const kudos = await (0, socialService_1.addKudos)(req.auth.userId, req.params.feedId, parsed.data.emoji, parsed.data.message);
        return (0, response_1.success)(res, kudos, {}, 201);
    }
    catch (error) {
        console.error('Failed to add kudos', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'kudos_failed',
            message: 'Failed to add kudos',
        });
    }
});
//# sourceMappingURL=social.js.map