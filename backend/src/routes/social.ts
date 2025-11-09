import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { apiError, success } from '../utils/response';
import {
  addKudos,
  createFeedPost,
  listFeed,
} from '../services/socialService';

const router = Router();

const feedSchema = z.object({
  type: z.enum(['session', 'badge', 'bet', 'custom']),
  message: z.string().max(2000).optional(),
  payload: z.record(z.any()).optional(),
  scope: z.enum(['private', 'friends', 'public']).optional(),
  imageUrl: z.string().url().optional(),
});

router.post('/feed', requireAuth(['social.write']), async (req, res) => {
  const parsed = feedSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid feed payload',
      details: parsed.error.flatten(),
    });
  }

  try {
    const post = await createFeedPost(req.auth!.userId, parsed.data);
    return success(res, post, {}, 201);
  } catch (error: any) {
    console.error('Failed to create feed post', error);
    return apiError(res, {
      status: 500,
      code: 'feed_create_failed',
      message: 'Failed to create feed post',
    });
  }
});

const listFeedSchema = z.object({
  scope: z.enum(['friends', 'public']).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

router.get('/feed', requireAuth(['social.read']), async (req, res) => {
  const parsed = listFeedSchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid feed query',
      details: parsed.error.flatten(),
    });
  }

  try {
    const feed = await listFeed(req.auth!.userId, parsed.data);
    return success(res, { feed, count: feed.length });
  } catch (error: any) {
    console.error('Failed to fetch feed', error);
    return apiError(res, {
      status: 500,
      code: 'feed_fetch_failed',
      message: 'Failed to fetch feed',
    });
  }
});

const kudosSchema = z.object({
  emoji: z.string().min(1).max(8),
  message: z.string().max(500).optional(),
});

router.post(
  '/feed/:feedId/kudos',
  requireAuth(['social.write']),
  async (req, res) => {
    const parsed = kudosSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid kudos payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const kudos = await addKudos(
        req.auth!.userId,
        req.params.feedId,
        parsed.data.emoji,
        parsed.data.message
      );
      return success(res, kudos, {}, 201);
    } catch (error: any) {
      console.error('Failed to add kudos', error);
      return apiError(res, {
        status: 500,
        code: 'kudos_failed',
        message: 'Failed to add kudos',
      });
    }
  }
);

export { router as socialRouter };
