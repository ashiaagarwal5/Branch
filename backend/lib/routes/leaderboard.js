"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const leaderboardService_1 = require("../services/leaderboardService");
const router = (0, express_1.Router)();
exports.leaderboardRouter = router;
const querySchema = zod_1.z.object({
    scope: zod_1.z.enum(['global', 'friends']).default('global'),
    period: zod_1.z.enum(['daily', 'weekly', 'monthly', 'all-time']).default('weekly'),
    category: zod_1.z.enum(['points', 'hours', 'streak', 'xp', 'focus']).default('points'),
    limit: zod_1.z.coerce.number().min(1).max(100).optional(),
});
router.get('/', (0, auth_1.requireAuth)(['leaderboard.read']), async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid leaderboard query',
            details: parsed.error.flatten(),
        });
    }
    try {
        const payload = await (0, leaderboardService_1.getLeaderboard)({
            ...parsed.data,
            userId: req.auth.userId,
        });
        return (0, response_1.success)(res, payload);
    }
    catch (error) {
        console.error('Failed to fetch leaderboard', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'leaderboard_fetch_failed',
            message: 'Failed to fetch leaderboard',
        });
    }
});
//# sourceMappingURL=leaderboard.js.map