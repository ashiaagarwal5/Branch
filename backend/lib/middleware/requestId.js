"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = requestId;
const node_crypto_1 = require("node:crypto");
function requestId(req, res, next) {
    const id = (0, node_crypto_1.randomUUID)();
    req.requestId = id;
    res.setHeader('x-request-id', id);
    next();
}
//# sourceMappingURL=requestId.js.map