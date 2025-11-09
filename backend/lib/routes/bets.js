"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.betsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const betService_1 = require("../services/betService");
const router = (0, express_1.Router)();
exports.betsRouter = router;
const createSchema = zod_1.z.object({
    opponentId: zod_1.z.string().min(6),
    wager: zod_1.z.number().min(1).max(100000),
    description: zod_1.z.string().max(2000).optional(),
    conditions: zod_1.z.string().min(10).max(2000),
    resolveBy: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.number()]).optional(),
});
router.post('/create', (0, auth_1.requireAuth)(['bets.write']), async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid bet payload',
            details: parsed.error.flatten(),
        });
    }
    const payload = {
        ...parsed.data,
        resolveBy: parsed.data.resolveBy
            ? new Date(parsed.data.resolveBy)
            : undefined,
    };
    try {
        const bet = await (0, betService_1.createBet)(req.auth.userId, payload);
        return (0, response_1.success)(res, bet, {}, 201);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'bet_create_failed',
            message: error?.message || 'Failed to create bet',
        });
    }
});
const listSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'active', 'declined', 'cancelled', 'settled', 'disputed']).optional(),
    role: zod_1.z.enum(['creator', 'opponent', 'all']).optional(),
});
router.get('/', (0, auth_1.requireAuth)(['bets.read']), async (req, res) => {
    const parsed = listSchema.safeParse(req.query);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid query parameters',
            details: parsed.error.flatten(),
        });
    }
    try {
        const bets = await (0, betService_1.listBets)(req.auth.userId, parsed.data);
        return (0, response_1.success)(res, { bets, count: bets.length });
    }
    catch (error) {
        console.error('Failed to list bets', error);
        return (0, response_1.apiError)(res, {
            status: 500,
            code: 'bet_list_failed',
            message: 'Failed to fetch bets',
        });
    }
});
router.post('/:betId/accept', (0, auth_1.requireAuth)(['bets.write']), async (req, res) => {
    try {
        const bet = await (0, betService_1.acceptBet)(req.auth.userId, req.params.betId);
        return (0, response_1.success)(res, bet);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'bet_accept_failed',
            message: error?.message || 'Failed to accept bet',
        });
    }
});
router.post('/:betId/decline', (0, auth_1.requireAuth)(['bets.write']), async (req, res) => {
    try {
        const bet = await (0, betService_1.declineBet)(req.auth.userId, req.params.betId);
        return (0, response_1.success)(res, bet);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'bet_decline_failed',
            message: error?.message || 'Failed to decline bet',
        });
    }
});
const resolveSchema = zod_1.z.object({
    winnerId: zod_1.z.string().min(6),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
router.post('/:betId/resolve', (0, auth_1.requireAuth)(['bets.write']), async (req, res) => {
    const parsed = resolveSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid resolve payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const bet = await (0, betService_1.resolveBet)(req.auth.userId, req.params.betId, parsed.data.winnerId, parsed.data.metadata);
        return (0, response_1.success)(res, bet);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'bet_resolve_failed',
            message: error?.message || 'Failed to resolve bet',
        });
    }
});
const disputeSchema = zod_1.z.object({
    reason: zod_1.z.string().min(10).max(2000),
});
router.post('/:betId/dispute', (0, auth_1.requireAuth)(['bets.write']), async (req, res) => {
    const parsed = disputeSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid dispute payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const bet = await (0, betService_1.disputeBet)(req.auth.userId, req.params.betId, parsed.data.reason);
        return (0, response_1.success)(res, bet);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 500,
            code: error?.code || 'bet_dispute_failed',
            message: error?.message || 'Failed to dispute bet',
        });
    }
});
//# sourceMappingURL=bets.js.map