import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth';
import { logsRouter } from './routes/logs';
import { sessionsRouter } from './routes/sessions';
import { requestId } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { success } from './utils/response';

const app = express();

app.disable('x-powered-by');

app.use(requestId);
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan('combined', {
    skip: (req) => req.path === '/api/health',
  })
);

app.get('/api/health', (req, res) => {
  return success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/logs', logsRouter);
app.use('/api/sessions', sessionsRouter);

app.use(errorHandler);

export { app };
