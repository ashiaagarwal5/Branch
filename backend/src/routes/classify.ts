import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { apiError, success } from '../utils/response';
import { classifyActivity } from '../services/classificationService';

const router = Router();

const schema = z
  .object({
    title: z.string().max(1024).optional(),
    url: z.string().url().optional(),
    domain: z.string().max(255).optional(),
    text: z.string().max(4000).optional(),
  })
  .refine(
    (data) => data.title || data.url || data.text,
    'Provide at least one of title, url, or text'
  );

router.post('/', requireAuth(['classify.invoke']), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid classification payload',
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await classifyActivity(parsed.data);
    return success(res, result);
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 502,
      code: error?.code || 'classification_failed',
      message: error?.message || 'Classification service failed',
      details: error?.details,
    });
  }
});

export { router as classifyRouter };
