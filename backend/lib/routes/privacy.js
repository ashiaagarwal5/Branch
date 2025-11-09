"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const privacyService_1 = require("../services/privacyService");
const router = (0, express_1.Router)();
exports.privacyRouter = router;
router.get('/settings', (0, auth_1.requireAuth)(['privacy.write', 'user.read']), async (req, res) => {
    try {
        const settings = await (0, privacyService_1.getPrivacySettings)(req.auth.userId);
        return (0, response_1.success)(res, settings || {});
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'privacy_fetch_failed',
            message: 'Failed to load privacy settings',
        });
    }
});
const settingsSchema = zod_1.z.object({
    autoShareSessions: zod_1.z.boolean().optional(),
    autoShareBadges: zod_1.z.boolean().optional(),
    autoShareLeaderboard: zod_1.z.boolean().optional(),
    allowDataExports: zod_1.z.boolean().optional(),
    allowResearch: zod_1.z.boolean().optional(),
    excludeDomains: zod_1.z.array(zod_1.z.string()).optional(),
});
router.put('/settings', (0, auth_1.requireAuth)(['privacy.write']), async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid privacy settings payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const settings = await (0, privacyService_1.updatePrivacySettings)(req.auth.userId, parsed.data);
        return (0, response_1.success)(res, settings);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'privacy_update_failed',
            message: 'Failed to update privacy settings',
        });
    }
});
const exportSchema = zod_1.z.object({
    channels: zod_1.z.array(zod_1.z.enum(['email', 'download'])).max(2).optional(),
});
router.post('/export', (0, auth_1.requireAuth)(['privacy.write']), async (req, res) => {
    const parsed = exportSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid export payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const job = await (0, privacyService_1.requestDataExport)(req.auth.userId, parsed.data.channels || ['download']);
        return (0, response_1.success)(res, job, {}, 202);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'export_request_failed',
            message: 'Failed to request data export',
        });
    }
});
router.delete('/delete-account', (0, auth_1.requireAuth)(['privacy.write']), async (req, res) => {
    try {
        await (0, privacyService_1.requestAccountDeletion)(req.auth.userId);
        return (0, response_1.success)(res, { status: 'pending' });
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'account_delete_failed',
            message: 'Failed to request account deletion',
        });
    }
});
//# sourceMappingURL=privacy.js.map