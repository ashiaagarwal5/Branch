import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth';
import { logsRouter } from './routes/logs';
import { sessionsRouter } from './routes/sessions';
import { tasksRouter } from './routes/tasks';
import { betsRouter } from './routes/bets';
import { leaderboardRouter } from './routes/leaderboard';
import { socialRouter } from './routes/social';
import { privacyRouter } from './routes/privacy';
import { usersRouter } from './routes/users';
import { classifyRouter } from './routes/classify';
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
app.use('/api/tasks', tasksRouter);
app.use('/api/bets', betsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/social', socialRouter);
app.use('/api/privacy', privacyRouter);
app.use('/api/users', usersRouter);
app.use('/api/classify', classifyRouter);

app.use(errorHandler);

export { app };
