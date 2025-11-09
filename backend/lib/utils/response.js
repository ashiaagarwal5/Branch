"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.apiError = apiError;
function success(res, data, meta = {}, status = 200) {
    return res.status(status).json({ data, meta });
}
function apiError(res, options) {
    const { status = 400, code, message, details } = options;
    return res.status(status).json({
        error: {
            code,
            message,
            details,
        },
    });
}
//# sourceMappingURL=response.js.map