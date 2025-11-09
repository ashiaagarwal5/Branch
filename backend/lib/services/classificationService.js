"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyActivity = classifyActivity;
const env_1 = require("../config/env");
async function classifyActivity(payload) {
    if (!env_1.env.classificationServiceUrl) {
        throw Object.assign(new Error('Classification service URL not configured'), {
            status: 503,
            code: 'classification_unavailable',
        });
    }
    const response = await fetch(`${env_1.env.classificationServiceUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const text = await response.text();
        throw Object.assign(new Error('Classification request failed'), {
            status: 502,
            code: 'classification_failed',
            details: text,
        });
    }
    return response.json();
}
//# sourceMappingURL=classificationService.js.map