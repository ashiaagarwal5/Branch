import { Router } from 'express';
import { z } from 'zod';
import {
  generateExtensionSetupCode,
  getSerializedUser,
  issueWebTokens,
  linkExtension,
  logoutWithRefreshToken,
  rotateRefreshToken,
  upsertProfileFromIdToken,
} from '../services/authService';
import { apiError, success } from '../utils/response';
import { requireAuth } from '../middleware/auth';

const router = Router();

const idTokenSchema = z.object({
  idToken: z.string().min(10, 'idToken is required'),
  displayName: z.string().min(1).max(60).optional(),
});

router.post('/signup', async (req, res) => {
  const parsed = idTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid signup payload',
      details: parsed.error.flatten(),
    });
  }

  try {
    const userId = await upsertProfileFromIdToken(parsed.data.idToken, {
      displayName: parsed.data.displayName,
    });

    const tokens = await issueWebTokens(userId);
    const user = await getSerializedUser(userId);

    return success(res, { user, tokens });
  } catch (error: any) {
    console.error('Signup failed', error);
    return apiError(res, {
      status: 400,
      code: 'signup_failed',
      message: error?.message || 'Failed to create account',
    });
  }
});

router.post('/login', async (req, res) => {
  const parsed = idTokenSchema.pick({ idToken: true }).safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid login payload',
      details: parsed.error.flatten(),
    });
  }

  try {
    const userId = await upsertProfileFromIdToken(parsed.data.idToken);
    const tokens = await issueWebTokens(userId);
    const user = await getSerializedUser(userId);
    return success(res, { user, tokens });
  } catch (error: any) {
    console.error('Login failed', error);
    return apiError(res, {
      status: 400,
      code: 'login_failed',
      message: error?.message || 'Failed to login',
    });
  }
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'refreshToken is required'),
  audience: z.enum(['web', 'extension']).optional(),
});

router.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid refresh payload',
      details: parsed.error.flatten(),
    });
  }

  try {
    const { tokens, userId } = await rotateRefreshToken(
      parsed.data.refreshToken,
      parsed.data.audience
    );
    const user = await getSerializedUser(userId);
    return success(res, { user, tokens });
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 401,
      code: error?.code || 'invalid_refresh_token',
      message: error?.message || 'Invalid refresh token',
    });
  }
});

router.post('/logout', async (req, res) => {
  const parsed = refreshSchema.pick({ refreshToken: true }).safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid logout payload',
      details: parsed.error.flatten(),
    });
  }

  await logoutWithRefreshToken(parsed.data.refreshToken);
  return success(res, { success: true });
});

router.post(
  '/extension/code',
  requireAuth(['user.read']),
  async (req, res) => {
    const result = await generateExtensionSetupCode(req.auth!.userId);
    return success(res, result);
  }
);

const linkExtensionSchema = z.object({
  code: z.string().min(4).max(64),
  deviceId: z.string().min(4).max(128),
  deviceName: z.string().min(1).max(128).optional(),
});

router.post('/extension/link', async (req, res) => {
  const parsed = linkExtensionSchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid extension link payload',
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await linkExtension(parsed.data);
    return success(res, result);
  } catch (error: any) {
    return apiError(res, {
      status: error?.status || 400,
      code: error?.code || 'extension_link_failed',
      message: error?.message || 'Failed to link extension',
    });
  }
});

router.post('/extension/logout', async (req, res) => {
  const parsed = refreshSchema.pick({ refreshToken: true }).safeParse(req.body);
  if (!parsed.success) {
    return apiError(res, {
      status: 400,
      code: 'invalid_request',
      message: 'Invalid extension logout payload',
      details: parsed.error.flatten(),
    });
  }

  await logoutWithRefreshToken(parsed.data.refreshToken);
  return success(res, { success: true });
});

export { router as authRouter };
