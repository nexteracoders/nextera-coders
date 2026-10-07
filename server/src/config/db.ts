import mongoose from 'mongoose';
import { config } from './env';
import { configureDns } from './dns';
import { logger } from '../utils/logger';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (!config.databaseUrl) {
    logger.warn('DATABASE_URL is not configured. Database features will be unavailable.');
    return false;
  }

  // Ensure DNS servers are configured before MongoDB SRV resolution begins
  configureDns(config.mongodbDnsServers);

  try {
    const conn = await mongoose.connect(config.databaseUrl, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return true;
  } catch (error) {
    isConnected = false;
    logger.warn(`MongoDB connection failed: ${(error as Error).message}. Continuing in standalone mode.`);
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  logger.info('MongoDB reconnected');
});

export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}

export async function disconnectDB(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  }
}
