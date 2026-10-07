import app from './app';
import { config } from './config/env';
import { configureDns } from './config/dns';
import { connectDB, disconnectDB } from './config/db';
import { logger } from './utils/logger';
import { User } from './models/user.model';
import http from 'http';
import { socketService } from './services/socket.service';

// Ensure DNS servers are configured before server startup & MongoDB connection
configureDns(config.mongodbDnsServers);

const server = http.createServer(app);

// Initialize Socket.io Real-Time Engine
socketService.init(server);

async function startServer() {
  // Connect to Database
  const connected = await connectDB();

  if (connected) {
    // Ensure Super-Admin credentials exist
    try {
      const adminEmail = 'nexteracoders@gmail.com';
      const adminPassword = 'Nextera@123';
      let adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'NextEra Coders Administrator',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          bio: 'Chief Platform Administrator at NextEra Coders.',
          skills: ['TypeScript', 'Express', 'React', 'MongoDB', 'System Design'],
        });
        logger.info(`[Startup] Created fixed Super-Admin account: ${adminEmail}`);
      } else {
        adminUser.role = 'admin';
        const passwordMatches = await adminUser.comparePassword(adminPassword);
        if (!passwordMatches) {
          adminUser.password = adminPassword;
        }
        await adminUser.save();
        logger.info(`[Startup] Verified & synced Super-Admin account: ${adminEmail}`);
      }

      // Ensure all users by default follow the NextEra Coders Administrator account
      if (adminUser) {
        const otherUsers = await User.find({ _id: { $ne: adminUser._id } }).select('_id');
        if (otherUsers.length > 0) {
          const otherUserIds = otherUsers.map((u) => u._id);
          await User.updateMany(
            { _id: { $in: otherUserIds } },
            { $addToSet: { following: adminUser._id } }
          );
          await User.findByIdAndUpdate(adminUser._id, {
            $addToSet: { followers: { $each: otherUserIds } },
          });
          logger.info(`[Startup] Synced ${otherUserIds.length} users to follow Admin by default.`);
        }
      }
    } catch (err: any) {
      logger.warn(`Admin startup sync notice: ${err.message}`);
    }

    // Ensure fixed Demo Student credentials exist
    // Startup sync complete without mock demo users

    // Sanitize any student accounts with uninitialized/defaulted subscriptions without valid plan/dates
    try {
      await User.updateMany(
        {
          role: 'student',
          $or: [
            { 'subscription.plan': { $exists: false } },
            { 'subscription.plan': null },
            { 'subscription.startDate': { $exists: false } },
            { 'subscription.startDate': null },
          ],
        },
        {
          $unset: { subscription: 1 },
          $set: { isPro: false },
        }
      );
      logger.info('Cleaned up uninitialized user subscriptions.');
    } catch (err) {
      logger.warn(`Subscription cleanup notice: ${(err as Error).message}`);
    }
  }

  // Start listening
  server.listen(config.port, () => {
    logger.info(`==================================================`);
    logger.info(` NextEra Coders Learning API Server`);
    logger.info(` Tagline: Learn. Code. Build. Grow.`);
    logger.info(` Environment: ${config.nodeEnv}`);
    logger.info(` Port: ${config.port}`);
    logger.info(` Health Endpoint: http://localhost:${config.port}/api/health`);
    logger.info(`==================================================`);
  });
}

// Graceful Shutdown Management
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDB();
    logger.info('Graceful shutdown completed.');
    process.exit(0);
  });

  // Force shutdown after 10s if hanging
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
