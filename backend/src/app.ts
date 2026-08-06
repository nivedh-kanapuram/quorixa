"use strict";

import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';
import documentRoutes from './routes/document.routes';
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
    this.app.use(cors());
    this.app.use(express.json());
  }

  private initializeRoutes(): void {
    this.app.use('/api/v1', healthRoutes);
    this.app.use('/api/v1', documentRoutes);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  public listen(): import('http').Server {
    const server = this.app.listen(env.port, () => {
      logger.info(`Server is running on port ${env.port}`);
    });

    return server;
  }
}
