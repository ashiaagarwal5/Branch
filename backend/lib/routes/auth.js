"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const response_1 = require("../utils/response");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRouter = router;
const idTokenSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(10, 'idToken is required'),
    displayName: zod_1.z.string().min(1).max(60).optional(),
});
router.post('/signup', async (req, res) => {
    const parsed = idTokenSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid signup payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const userId = await (0, authService_1.upsertProfileFromIdToken)(parsed.data.idToken, {
            displayName: parsed.data.displayName,
        });
        const tokens = await (0, authService_1.issueWebTokens)(userId);
        const user = await (0, authService_1.getSerializedUser)(userId);
        return (0, response_1.success)(res, { user, tokens });
    }
    catch (error) {
        console.error('Signup failed', error);
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'signup_failed',
            message: error?.message || 'Failed to create account',
        });
    }
});
router.post('/login', async (req, res) => {
    const parsed = idTokenSchema.pick({ idToken: true }).safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid login payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const userId = await (0, authService_1.upsertProfileFromIdToken)(parsed.data.idToken);
        const tokens = await (0, authService_1.issueWebTokens)(userId);
        const user = await (0, authService_1.getSerializedUser)(userId);
        return (0, response_1.success)(res, { user, tokens });
    }
    catch (error) {
        console.error('Login failed', error);
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'login_failed',
            message: error?.message || 'Failed to login',
        });
    }
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10, 'refreshToken is required'),
    audience: zod_1.z.enum(['web', 'extension']).optional(),
});
router.post('/refresh', async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid refresh payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const { tokens, userId } = await (0, authService_1.rotateRefreshToken)(parsed.data.refreshToken, parsed.data.audience);
        const user = await (0, authService_1.getSerializedUser)(userId);
        return (0, response_1.success)(res, { user, tokens });
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 401,
            code: error?.code || 'invalid_refresh_token',
            message: error?.message || 'Invalid refresh token',
        });
    }
});
router.post('/logout', async (req, res) => {
    const parsed = refreshSchema.pick({ refreshToken: true }).safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid logout payload',
            details: parsed.error.flatten(),
        });
    }
    await (0, authService_1.logoutWithRefreshToken)(parsed.data.refreshToken);
    return (0, response_1.success)(res, { success: true });
});
router.post('/extension/code', (0, auth_1.requireAuth)(['user.read']), async (req, res) => {
    const result = await (0, authService_1.generateExtensionSetupCode)(req.auth.userId);
    return (0, response_1.success)(res, result);
});
const linkExtensionSchema = zod_1.z.object({
    code: zod_1.z.string().min(4).max(64),
    deviceId: zod_1.z.string().min(4).max(128),
    deviceName: zod_1.z.string().min(1).max(128).optional(),
});
router.post('/extension/link', async (req, res) => {
    const parsed = linkExtensionSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid extension link payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const result = await (0, authService_1.linkExtension)(parsed.data);
        return (0, response_1.success)(res, result);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 400,
            code: error?.code || 'extension_link_failed',
            message: error?.message || 'Failed to link extension',
        });
    }
});
router.post('/extension/logout', async (req, res) => {
    const parsed = refreshSchema.pick({ refreshToken: true }).safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid extension logout payload',
            details: parsed.error.flatten(),
        });
    }
    await (0, authService_1.logoutWithRefreshToken)(parsed.data.refreshToken);
    return (0, response_1.success)(res, { success: true });
});
//# sourceMappingURL=auth.js.map