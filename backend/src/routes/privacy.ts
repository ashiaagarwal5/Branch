import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { apiError, success } from '../utils/response';
import {
  getPrivacySettings,
  requestAccountDeletion,
  requestDataExport,
  updatePrivacySettings,
} from '../services/privacyService';

const router = Router();

router.get(
  '/settings',
  requireAuth(['privacy.write', 'user.read']),
  async (req, res) => {
    try {
      const settings = await getPrivacySettings(req.auth!.userId);
      return success(res, settings || {});
    } catch (error: any) {
      return apiError(res, {
        status: 500,
        code: 'privacy_fetch_failed',
        message: 'Failed to load privacy settings',
      });
    }
  }
);

const settingsSchema = z.object({
  autoShareSessions: z.boolean().optional(),
  autoShareBadges: z.boolean().optional(),
  autoShareLeaderboard: z.boolean().optional(),
  allowDataExports: z.boolean().optional(),
  allowResearch: z.boolean().optional(),
  excludeDomains: z.array(z.string()).optional(),
});

router.put(
  '/settings',
  requireAuth(['privacy.write']),
  async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid privacy settings payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const settings = await updatePrivacySettings(
        req.auth!.userId,
        parsed.data
      );
      return success(res, settings);
    } catch (error: any) {
      return apiError(res, {
        status: 500,
        code: 'privacy_update_failed',
        message: 'Failed to update privacy settings',
      });
    }
  }
);

const exportSchema = z.object({
  channels: z.array(z.enum(['email', 'download'])).max(2).optional(),
});

router.post(
  '/export',
  requireAuth(['privacy.write']),
  async (req, res) => {
    const parsed = exportSchema.safeParse(req.body);
    if (!parsed.success) {
      return apiError(res, {
        status: 400,
        code: 'invalid_request',
        message: 'Invalid export payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      const job = await requestDataExport(
        req.auth!.userId,
        parsed.data.channels || ['download']
      );
      return success(res, job, {}, 202);
    } catch (error: any) {
      return apiError(res, {
        status: 500,
        code: 'export_request_failed',
        message: 'Failed to request data export',
      });
    }
  }
);

router.delete(
  '/delete-account',
  requireAuth(['privacy.write']),
  async (req, res) => {
    try {
      await requestAccountDeletion(req.auth!.userId);
      return success(res, { status: 'pending' });
    } catch (error: any) {
      return apiError(res, {
        status: 500,
        code: 'account_delete_failed',
        message: 'Failed to request account deletion',
      });
    }
  }
);

export { router as privacyRouter };
