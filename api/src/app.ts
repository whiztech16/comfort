import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import hpp from 'hpp';
import { env } from './config/env.js';
import { errorHandler } from './shared/http/error-handler';
import { originGuard } from './shared/origin-guard';
import { authRouter } from './modules/auth/auth.routes';
import { onboardingRouter } from './modules/onboarding/onboarding.routes';import { usersRouter, settingsRouter } from './modules/users/users.routes';
export function createApp() {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(cookieParser());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(hpp());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use((req, res, next) => {
    const incoming = req.headers['x-request-id'];
    // Accept client-supplied ID only if it's a valid UUID v4; otherwise mint a fresh one.
    const isValidUUID = typeof incoming === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(incoming);
    req.requestId = isValidUUID ? incoming : globalThis.crypto.randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Comfort API running 💙' });
  });

  app.use('/api/v1', originGuard);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/onboarding', onboardingRouter);
  app.use('/api/v1/users/onboarding', onboardingRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/settings', settingsRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}