import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { apiError, success } from '../utils/response';
import {
  acceptBet,
  createBet,
  declineBet,
  disputeBet,
  listBets,
  resolveBet,
} from '../services/betService';

const router = Router();

const createSchema = z.object({
  opponentId: z.string().min(6),
  wager: z.number().min(1).max(100000),
  description: z.string().max(2000).optional(),
  conditions: z.string().min(10).max(2000),
  resolveBy: z.union([z.string().datetime(), z.number()]).optional(),
});

router.post('/create', requireAuth(['bets.write']), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
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
    const bet = await createBet(req.auth!.userId, payload);
    return success(res, bet, {}, 201);
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 500,
      code: error?.code || 'bet_create_failed',
      message: error?.message || 'Failed to create bet',
    });
  }
});

const listSchema = z.object({
  status: z.enum(['pending', 'active', 'declined', 'cancelled', 'settled', 'disputed']).optional(),
  role: z.enum(['creator', 'opponent', 'all']).optional(),
});

router.get('/', requireAuth(['bets.read']), async (req, res) => {
  const parsed = listSchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid query parameters',
      details: parsed.error.flatten(),
    });
  }

  try {
    const bets = await listBets(req.auth!.userId, parsed.data);
    return success(res, { bets, count: bets.length });
  } catch (error: any) {
    console.error('Failed to list bets', error);
    return apiError(res, {
      status: 500,
      code: 'bet_list_failed',
      message: 'Failed to fetch bets',
    });
  }
});

router.post('/:betId/accept', requireAuth(['bets.write']), async (req, res) => {
  try {
    const bet = await acceptBet(req.auth!.userId, req.params.betId);
    return success(res, bet);
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 500,
      code: error?.code || 'bet_accept_failed',
      message: error?.message || 'Failed to accept bet',
    });
  }
});

router.post('/:betId/decline', requireAuth(['bets.write']), async (req, res) => {
  try {
    const bet = await declineBet(req.auth!.userId, req.params.betId);
    return success(res, bet);
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 500,
      code: error?.code || 'bet_decline_failed',
      message: error?.message || 'Failed to decline bet',
    });
  }
});

const resolveSchema = z.object({
  winnerId: z.string().min(6),
  metadata: z.record(z.any()).optional(),
});

router.post('/:betId/resolve', requireAuth(['bets.write']), async (req, res) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid resolve payload',
      details: parsed.error.flatten(),
    });
  }

  try {
    const bet = await resolveBet(
      req.auth!.userId,
      req.params.betId,
      parsed.data.winnerId,
      parsed.data.metadata
    );
    return success(res, bet);
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 500,
      code: error?.code || 'bet_resolve_failed',
      message: error?.message || 'Failed to resolve bet',
    });
  }
});

const disputeSchema = z.object({
  reason: z.string().min(10).max(2000),
});

router.post('/:betId/dispute', requireAuth(['bets.write']), async (req, res) => {
  const parsed = disputeSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid dispute payload',
      details: parsed.error.flatten(),
    });
  }

  try {
    const bet = await disputeBet(
      req.auth!.userId,
      req.params.betId,
      parsed.data.reason
    );
    return success(res, bet);
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 500,
      code: error?.code || 'bet_dispute_failed',
      message: error?.message || 'Failed to dispute bet',
    });
  }
});

export { router as betsRouter };
