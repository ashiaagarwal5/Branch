"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
function extractToken(header) {
    if (!header)
        return null;
    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}
function requireAuth(requiredScopes = []) {
    return (req, res, next) => {
        const token = extractToken(req.header('Authorization'));
        if (!token) {
            return (0, response_1.apiError)(res, {
                status: 401,
                code: 'unauthorized',
                message: 'Authorization header missing or malformed',
            });
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
            if (payload.type !== 'access') {
                throw new Error('invalid token type');
            }
            req.auth = {
                userId: payload.sub,
                scopes: payload.scopes,
                tokenId: payload.jti,
                audience: payload.aud,
                issuedAt: payload.iat,
                expiresAt: payload.exp,
                deviceId: payload.deviceId,
            };
            const missingScopes = requiredScopes.filter((scope) => !payload.scopes.includes(scope));
            if (missingScopes.length > 0) {
                return (0, response_1.apiError)(res, {
                    status: 403,
                    code: 'forbidden',
                    message: `Missing required scopes: ${missingScopes.join(', ')}`,
                });
            }
            return next();
        }
        catch (error) {
            console.error('Token verification failed', error);
            return (0, response_1.apiError)(res, {
                status: 401,
                code: 'invalid_token',
                message: 'Invalid or expired access token',
            });
        }
    };
}
//# sourceMappingURL=auth.js.map