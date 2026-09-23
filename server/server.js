import { app } from './src/app.js';
import { config } from './src/config/env.js';
import { connectDatabase, disconnectDatabase } from './src/config/db.js';

const startServer = async () => {
  try {
    // Attempt database connection
    console.log('[Server] Connecting to MongoDB...');
    try {
      await connectDatabase();
    } catch (dbErr) {
      console.warn(`[Server] Warning: Initial MongoDB connection failed: ${dbErr.message}`);
      console.warn('[Server] Server will continue starting. Ensure MongoDB is running before creating predictions.');
    }

    const server = app.listen(config.port, () => {
      console.log('====================================================');
      console.log(`[Server] Citrus Advisory API Server running`);
      console.log(`[Server] Listening on http://localhost:${config.port}`);
      console.log(`[Server] Environment: ${config.nodeEnv}`);
      console.log(`[Server] Upstream AI API: ${config.aiApiUrl}`);
      console.log('====================================================');
    });

    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('[Server] HTTP server closed. Exiting process.');
        process.exit(0);
      });

      // Force exit if hanging
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(`[Server] Failed to launch server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
