import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import hpp from 'hpp';
import { env } from './config/env';
import { errorHandler } from './shared/http/error-handler';
import { jsonOnly } from './shared/http/json-only';
import { originGuard } from './shared/origin-guard';
import { globalLimiter } from './shared/http/global-limiter';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { onboardingRouter } from './modules/onboarding/onboarding.routes';
import { usersRouter, settingsRouter } from './modules/users/users.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { postsRouter } from './modules/posts/posts.routes';
import { comfortsRouter } from './modules/comforts/comforts.routes';
import { blocksRouter } from './modules/blocks/blocks.routes';
import { reportsRouter } from './modules/reports/reports.routes';

export function createApp() {
  const app = express();

  // Must match the real proxy hop count in production, or every user shares one IP for rate limits
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet({ referrerPolicy: { policy: 'no-referrer' } }));

  app.use((req, res, next) => {
    const incoming = req.headers['x-request-id'];
    // Accept client-supplied ID only if it's a valid UUID v4; otherwise mint a fresh one.
    const isValidUUID = typeof incoming === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(incoming);
    req.requestId = isValidUUID ? incoming : globalThis.crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
  });

  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(compression());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

  // Reject non-JSON bodies first, then parse with a small size cap
  app.use(jsonOnly);
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use(hpp());

  // Health checks sit before the limiter so monitors are never throttled
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Comfort API running 💙' });
  });
  app.use('/api/v1', healthRouter);

  // Write requests must come from our frontend, then the global rate limit
  app.use(originGuard);
  app.use('/api', globalLimiter);

  app.use('/api/v1/auth', authRouter);
  // Onboarding must stay above usersRouter so /users/onboarding is never read as a username
  app.use('/api/v1/users/onboarding', onboardingRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/categories', categoriesRouter);
  app.use('/api/v1/posts', postsRouter);
  app.use('/api/v1/comforts', comfortsRouter);
  app.use('/api/v1/blocks', blocksRouter);
  app.use('/api/v1/reports', reportsRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}