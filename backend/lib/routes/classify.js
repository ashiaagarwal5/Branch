"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const response_1 = require("../utils/response");
const classificationService_1 = require("../services/classificationService");
const router = (0, express_1.Router)();
exports.classifyRouter = router;
const schema = zod_1.z
    .object({
    title: zod_1.z.string().max(1024).optional(),
    url: zod_1.z.string().url().optional(),
    domain: zod_1.z.string().max(255).optional(),
    text: zod_1.z.string().max(4000).optional(),
})
    .refine((data) => data.title || data.url || data.text, 'Provide at least one of title, url, or text');
router.post('/', (0, auth_1.requireAuth)(['classify.invoke']), async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return (0, response_1.apiError)(res, {
            status: 400,
            code: 'invalid_request',
            message: 'Invalid classification payload',
            details: parsed.error.flatten(),
        });
    }
    try {
        const result = await (0, classificationService_1.classifyActivity)(parsed.data);
        return (0, response_1.success)(res, result);
    }
    catch (error) {
        return (0, response_1.apiError)(res, {
            status: error?.status || 502,
            code: error?.code || 'classification_failed',
            message: error?.message || 'Classification service failed',
            details: error?.details,
        });
    }
});
//# sourceMappingURL=classify.js.map