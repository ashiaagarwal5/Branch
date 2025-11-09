import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { computeSessionForRange } from '../services/sessionService';
import { apiError, success } from '../utils/response';
import { db } from '../config/firebase';
import { toTimestamp } from '../utils/firestore';

const router = Router();

const computeSchema = z.object({
  sessionStart: z.union([z.string().datetime(), z.number()]),
  sessionEnd: z.union([z.string().datetime(), z.number()]),
  trigger: z.enum(['manual', 'auto', 'cron']).optional(),
  metadata: z.record(z.any()).optional(),
});

router.post(
  '/compute',
  requireAuth(['sessions.write']),
  async (req, res) => {
    const parsed = computeSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid session compute payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const sessionStart =
        typeof parsed.data.sessionStart === 'number'
          ? new Date(parsed.data.sessionStart)
          : new Date(parsed.data.sessionStart);
      const sessionEnd =
        typeof parsed.data.sessionEnd === 'number'
          ? new Date(parsed.data.sessionEnd)
          : new Date(parsed.data.sessionEnd);

      const result = await computeSessionForRange({
        userId: req.auth!.userId,
        sessionStart,
        sessionEnd,
        trigger: parsed.data.trigger,
        metadata: parsed.data.metadata,
      });

      return success(res, result, {}, 201);
    } catch (error: any) {
      return apiError(res, {
        status: error?.status || 500,
        code: error?.code || 'session_compute_failed',
        message: error?.message || 'Failed to compute session',
      });
    }
  }
);

const listQuerySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

router.get('/', requireAuth(['sessions.read']), async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid query parameters',
      details: parsed.error.flatten(),
    });
  }

  try {
    let query = db
      .collection('sessions')
      .where('userId', '==', req.auth!.userId)
      .orderBy('startTime', 'desc');

    if (parsed.data.start) {
      query = query.where(
        'startTime',
        '>=',
        toTimestamp(new Date(parsed.data.start))
      );
    }

    if (parsed.data.end) {
      query = query.where(
        'endTime',
        '<=',
        toTimestamp(new Date(parsed.data.end))
      );
    }

    const limit = parsed.data.limit ?? 20;
    query = query.limit(limit);

    const snapshot = await query.get();
    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return success(res, { sessions, count: sessions.length });
  } catch (error: any) {
    console.error('Failed to list sessions', error);
    return apiError(res, {
      status: 500,
      code: 'session_list_failed',
      message: 'Failed to fetch sessions',
    });
  }
});

router.get('/:id', requireAuth(['sessions.read']), async (req, res) => {
  try {
    const doc = await db.collection('sessions').doc(req.params.id).get();
    if (!doc.exists || doc.data()?.userId !== req.auth!.userId) {
      return apiError(res, {
        status: 404,
        code: 'session_not_found',
        message: 'Session not found',
      });
    }

    return success(res, {
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    return apiError(res, {
      status: 500,
      code: 'session_fetch_failed',
      message: 'Failed to fetch session',
    });
  }
});

export { router as sessionsRouter };
