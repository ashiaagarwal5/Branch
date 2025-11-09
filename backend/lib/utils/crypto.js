"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureToken = generateSecureToken;
exports.hashToken = hashToken;
const node_crypto_1 = require("node:crypto");
function generateSecureToken(bytes = 48) {
    return (0, node_crypto_1.randomBytes)(bytes).toString('hex');
}
function hashToken(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
//# sourceMappingURL=crypto.js.map