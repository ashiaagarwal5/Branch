import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import {
  saveActivityBatch,
  saveActivityLog,
} from '../services/activityService';
import { apiError, success } from '../utils/response';

const router = Router();

const classificationSchema = z
  .object({
    category: z.string().min(1).max(100).optional(),
    productive: z.boolean().optional(),
    confidence: z.number().min(0).max(1).optional(),
    probabilities: z.record(z.number().min(0).max(1)).optional(),
  })
  .optional();

const activitySchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(1024),
  domain: z.string().min(1).max(255),
  startedAt: z.union([z.string().datetime(), z.number()]),
  endedAt: z.union([z.string().datetime(), z.number()]),
  interactionSeconds: z.number().int().min(0),
  classification: classificationSchema,
  source: z.enum(['extension', 'manual']).optional(),
  platform: z.string().max(120).optional(),
  metadata: z.record(z.any()).optional(),
  eventId: z.string().min(4).max(128).optional(),
});

router.post('/activity', requireAuth(['logs.write']), async (req, res) => {
  const parsed = activitySchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid activity payload',
      details: parsed.error.flatten(),
    });
  }

  const payload = parsed.data;
  const startedAt =
    typeof payload.startedAt === 'number'
      ? new Date(payload.startedAt)
      : new Date(payload.startedAt);
  const endedAt =
    typeof payload.endedAt === 'number'
      ? new Date(payload.endedAt)
      : new Date(payload.endedAt);

  try {
    const id = await saveActivityLog({
      userId: req.auth!.userId,
      ...payload,
      startedAt,
      endedAt,
    });

    return success(res, { id });
  } catch (error: any) {
    console.error('Failed to save activity', error);
    return apiError(res, {
      status: 500,
      code: 'activity_save_failed',
      message: 'Failed to save activity log',
    });
  }
});

const batchSchema = z.object({
  events: z.array(activitySchema),
});

router.post(
  '/batch',
  requireAuth(['logs.write']),
  async (req, res) => {
    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid batch payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const logs = parsed.data.events.map((event) => ({
        ...event,
        startedAt:
          typeof event.startedAt === 'number'
            ? new Date(event.startedAt)
            : new Date(event.startedAt),
        endedAt:
          typeof event.endedAt === 'number'
            ? new Date(event.endedAt)
            : new Date(event.endedAt),
      }));

      const ids = await saveActivityBatch(req.auth!.userId, logs);
      return success(res, { count: ids.length, ids });
    } catch (error: any) {
      console.error('Failed to save activity batch', error);
      return apiError(res, {
        status: 500,
        code: 'activity_batch_failed',
        message: 'Failed to save activity batch',
      });
    }
  }
);

export { router as logsRouter };
