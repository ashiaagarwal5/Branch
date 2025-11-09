"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const functions = __importStar(require("firebase-functions"));
const runtimeConfig = (() => {
    try {
        return (functions.config() || {});
    }
    catch {
        return {};
    }
})();
const env = {
    projectId: process.env.GCLOUD_PROJECT ||
        process.env.PROJECT_ID ||
        runtimeConfig?.project?.id ||
        '',
    jwtSecret: process.env.JWT_SECRET ||
        runtimeConfig.app?.jwt_secret ||
        'insecure-development-secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ||
        runtimeConfig.app?.refresh_secret ||
        'insecure-development-refresh-secret',
    accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ||
        runtimeConfig.app?.access_token_ttl_seconds ||
        3600),
    extensionAccessTokenTtlSeconds: Number(process.env.EXTENSION_ACCESS_TOKEN_TTL_SECONDS ||
        runtimeConfig.app?.extension_access_ttl_seconds ||
        900),
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ||
        runtimeConfig.app?.refresh_token_ttl_days ||
        7),
    classificationServiceUrl: process.env.CLASSIFICATION_SERVICE_URL ||
        runtimeConfig.services?.classification_url ||
        '',
    imageGenerationServiceUrl: process.env.IMAGE_GENERATION_SERVICE_URL ||
        runtimeConfig.services?.image_generation_url ||
        '',
};
exports.env = env;
//# sourceMappingURL=env.js.map