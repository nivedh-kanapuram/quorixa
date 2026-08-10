'use strict';

import { App } from './app';
import { connectDatabase, closeDatabase } from './config/database';
import { logger } from './config/logger';

const start = async (): Promise<void> => {
  await connectDatabase();

  const app = new App();
  const server = app.listen();

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    try {
      server.close(() => {
        logger.info('HTTP server closed');
      });
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception');
    process.exit(1);
  });
};

start().catch((error) => {
  logger.error({ err: error }, 'Application failed to start');
  process.exit(1);
});
