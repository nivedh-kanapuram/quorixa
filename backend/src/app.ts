'use strict';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './middleware/request-logger.middleware';
import healthRoutes from './routes/health.routes';
import documentRoutes from './routes/document.routes';
import chatRoutes from './routes/chat.routes';
import libraryRoutes from './routes/library.routes';
import { errorMiddleware } from './middleware/error.middleware';
import { env } from './config/env';
import { logger } from './config/logger';

export class App {
  public app: express.Express;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // security headers
    this.app.use(helmet());

    // CORS configuration from env
    const corsOptions = this.getCorsOptions();
    this.app.use(cors(corsOptions));

    // request logging
    this.app.use(requestLogger);

    this.app.use(express.json());
  }

  private getCorsOptions() {
    const origin = env.corsOrigin;
    if (!origin) return undefined;
    return { origin: origin.split(',').map((s) => s.trim()) };
  }

  private initializeRoutes(): void {
    this.app.use('/api/v1', healthRoutes);
    this.app.use('/api/v1', documentRoutes);
    this.app.use('/api/v1', chatRoutes);
    this.app.use('/api/v1', libraryRoutes);
  }

  private initializeErrorHandling(): void {
    this.app.use(
      (
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        res.status(404).json({
          success: false,
          message: 'Route not found',
          errorCode: 'ERR_404',
          timestamp: new Date().toISOString(),
        });
      }
    );
    this.app.use(errorMiddleware);
  }

  public listen(): import('http').Server {
    const server = this.app.listen(env.port, () => {
      logger.info(`Server is running on port ${env.port}`);
    });

    return server;
  }
}
