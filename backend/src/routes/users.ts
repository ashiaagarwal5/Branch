import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { apiError, success } from '../utils/response';
import {
  getUserCompositeProfile,
  updateUserPreferences,
  upsertAdaptiveState,
} from '../services/userModelService';

const router = Router();

router.get('/me', requireAuth(['user.read']), async (req, res) => {
  try {
    const profile = await getUserCompositeProfile(req.auth!.userId);
    return success(res, profile);
  } catch (error: any) {
    console.error('Failed to fetch user profile', error);
    return apiError(res, {
      status: 500,
      code: 'user_profile_fetch_failed',
      message: 'Failed to load user profile',
    });
  }
});

const preferencesSchema = z.object({
  preferences: z.record(z.any()),
});

router.put(
  '/me/preferences',
  requireAuth(['user.write']),
  async (req, res) => {
    const parsed = preferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid preferences payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const prefs = await updateUserPreferences(
        req.auth!.userId,
        parsed.data.preferences
      );
      return success(res, prefs);
    } catch (error: any) {
      console.error('Failed to update preferences', error);
      return apiError(res, {
        status: 500,
        code: 'preferences_update_failed',
        message: 'Failed to update preferences',
      });
    }
  }
);

const adaptiveSchema = z.object({
  focusPreferences: z.record(z.any()).optional(),
  modelFeatures: z.record(z.number()).optional(),
  tags: z.array(z.string()).max(32).optional(),
  lastSelfReportScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(1024).optional(),
});

router.post(
  '/adaptive/state',
  requireAuth(['user.write']),
  async (req, res) => {
    const parsed = adaptiveSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid adaptive state payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const state = await upsertAdaptiveState(req.auth!.userId, parsed.data);
      return success(res, state, {}, 201);
    } catch (error: any) {
      console.error('Failed to upsert adaptive state', error);
      return apiError(res, {
        status: 500,
        code: 'adaptive_state_failed',
        message: 'Failed to update adaptive state',
      });
    }
  }
);

export { router as usersRouter };
