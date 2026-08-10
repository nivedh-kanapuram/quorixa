import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import { logger } from './logger';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 3000;

export const connectDatabase = async (): Promise<void> => {
  logger.info('Connecting to MongoDB Atlas');

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: false,
    });

    logger.info('✅ Connected to MongoDB Atlas');
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to connect to MongoDB Atlas');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      logger.info({ attempt }, 'Retrying MongoDB connection');
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));

      try {
        await mongoose.connect(env.mongoUri, {
          autoIndex: false,
        });
        logger.info('✅ Connected to MongoDB Atlas');
        return;
      } catch (retryError) {
        logger.error({ err: retryError, attempt }, 'MongoDB retry failed');
      }
    }

    logger.error('MongoDB connection retry limit reached');
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.connection.close(false);
  logger.info('MongoDB connection closed');
};
