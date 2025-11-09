"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const userModelService_1 = require("../services/userModelService");
const router = (0, express_1.Router)();
exports.usersRouter = router;
router.get('/me', (0, auth_1.requireAuth)(['user.read']), async (req, res) => {
    try {
        const profile = await (0, userModelService_1.getUserCompositeProfile)(req.auth.userId);
        return (0, response_1.success)(res, profile);
    }
    catch (error) {
        console.error('Failed to fetch user profile', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'user_profile_fetch_failed',
            message: 'Failed to load user profile',
        });
    }
});
const preferencesSchema = zod_1.z.object({
    preferences: zod_1.z.record(zod_1.z.any()),
});
router.put('/me/preferences', (0, auth_1.requireAuth)(['user.write']), async (req, res) => {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid preferences payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const prefs = await (0, userModelService_1.updateUserPreferences)(req.auth.userId, parsed.data.preferences);
        return (0, response_1.success)(res, prefs);
    }
    catch (error) {
        console.error('Failed to update preferences', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'preferences_update_failed',
            message: 'Failed to update preferences',
        });
    }
});
const adaptiveSchema = zod_1.z.object({
    focusPreferences: zod_1.z.record(zod_1.z.any()).optional(),
    modelFeatures: zod_1.z.record(zod_1.z.number()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).max(32).optional(),
    lastSelfReportScore: zod_1.z.number().min(0).max(100).optional(),
    notes: zod_1.z.string().max(1024).optional(),
});
router.post('/adaptive/state', (0, auth_1.requireAuth)(['user.write']), async (req, res) => {
    const parsed = adaptiveSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid adaptive state payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const state = await (0, userModelService_1.upsertAdaptiveState)(req.auth.userId, parsed.data);
        return (0, response_1.success)(res, state, {}, 201);
    }
    catch (error) {
        console.error('Failed to upsert adaptive state', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'adaptive_state_failed',
            message: 'Failed to update adaptive state',
        });
    }
});
//# sourceMappingURL=users.js.map