import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { apiError, success } from '../utils/response';
import { getLeaderboard } from '../services/leaderboardService';

const router = Router();

const querySchema = z.object({
  scope: z.enum(['global', 'friends']).default('global'),
  period: z.enum(['daily', 'weekly', 'monthly', 'all-time']).default('weekly'),
  category: z.enum(['points', 'hours', 'streak', 'xp', 'focus']).default('points'),
  limit: z.coerce.number().min(1).max(100).optional(),
});

router.get('/', requireAuth(['leaderboard.read']), async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid leaderboard query',
      details: parsed.error.flatten(),
    });
  }

  try {
    const payload = await getLeaderboard({
      ...parsed.data,
      userId: req.auth!.userId,
    });
    return success(res, payload);
  } catch (error: any) {
    console.error('Failed to fetch leaderboard', error);
    return apiError(res, {
      status: 500,
      code: 'leaderboard_fetch_failed',
      message: 'Failed to fetch leaderboard',
    });
  }
});

export { router as leaderboardRouter };
