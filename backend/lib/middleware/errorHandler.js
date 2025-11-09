"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const response_1 = require("../utils/response");
function errorHandler(err, _req, res, _next) {
    console.error('Request error', {
        message: err?.message,
        stack: err?.stack,
    });
    if (err?.status && err?.code) {
        return (0, response_1.apiError)(res, {
            status: err.status,
            code: err.code,
            message: err.message,
            details: err.details,
        });
    }
    return (0, response_1.apiError)(res, {
        status: 500,
        code: 'internal_error',
        message: 'An unexpected error occurred',
    });
}
//# sourceMappingURL=errorHandler.js.map