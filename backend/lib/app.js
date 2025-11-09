"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_1 = require("./routes/auth");
const logs_1 = require("./routes/logs");
const sessions_1 = require("./routes/sessions");
const requestId_1 = require("./middleware/requestId");
const errorHandler_1 = require("./middleware/errorHandler");
const response_1 = require("./utils/response");
const app = (0, express_1.default)();
exports.app = app;
app.disable('x-powered-by');
app.use(requestId_1.requestId);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('combined', {
    skip: (req) => req.path === '/api/health',
}));
app.get('/api/health', (req, res) => {
    return (0, response_1.success)(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/auth', auth_1.authRouter);
app.use('/api/logs', logs_1.logsRouter);
app.use('/api/sessions', sessions_1.sessionsRouter);
app.use(errorHandler_1.errorHandler);
//# sourceMappingURL=app.js.map