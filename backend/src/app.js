import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './http.js';
import { csrfCheck, loadSession } from './auth.js';
import { authRoutes } from './routes/auth.js';
import { settingsRoutes } from './routes/settings.js';
import { taskRoutes } from './routes/tasks.js';
import { sessionRoutes } from './routes/sessions.js';
import { gardenRoutes } from './routes/garden.js';
import { friendRoutes } from './routes/friends.js';
import { userRoutes } from './routes/users.js';
import { shopRoutes } from './routes/shop.js';
import { pushRoutes } from './routes/push.js';
import { createPusher } from './push.js';

// Builds the Express app without listening, so tests and Vercel can use it.
// `now` can be replaced in tests with a fake clock.
export function createApp({ db, config, now = () => Date.now(), logger = console, pusher }) {
  const ctx = { db, config, now, logger, pusher: pusher ?? createPusher(config) };
  if (config.demoIgnored) logger.warn('[config] DEMO_MODE is ignored in production.');
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(helmet());
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use('/api', loadSession(ctx), csrfCheck);

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes(ctx));
  app.use('/api/settings', settingsRoutes(ctx));
  app.use('/api/tasks', taskRoutes(ctx));
  app.use('/api/sessions', sessionRoutes(ctx));
  app.use('/api/garden', gardenRoutes(ctx));
  app.use('/api/friends', friendRoutes(ctx));
  app.use('/api/users', userRoutes(ctx));
  app.use('/api/shop', shopRoutes(ctx));
  app.use('/api/push', pushRoutes(ctx));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use(errorHandler(logger));
  return app;
}
