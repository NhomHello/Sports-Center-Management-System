/**
 * Khoi tao Express app: middleware toan cuc -> routes -> 404 -> error handler.
 * File nay KHONG listen; server.js moi listen (de test bang supertest).
 */
import { ERROR_CODES } from '@scms/shared';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { errorHandler, notFoundHandler } from './common/middlewares/error.middleware.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { HEALTH_PATH, TIME } from './constants/index.js';
import apiRouter from './routes.js';

const JSON_BODY_LIMIT = '1mb';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true }));
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url.endsWith(HEALTH_PATH) },
  }),
);
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MINUTES * TIME.MS_PER_MINUTE,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      code: ERROR_CODES.RATE_LIMITED,
      message: `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${env.RATE_LIMIT_WINDOW_MINUTES} phút.`,
    },
  }),
);

app.use(env.API_PREFIX, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
