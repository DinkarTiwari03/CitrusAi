import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;
let memoryServer = null;

export const connectDatabase = async (customUri = null) => {
  const uri = customUri || config.mongodbUri;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });

    isConnected = true;
    console.log(`[Database] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    console.warn(`[Database] Connection to ${uri} failed: ${error.message}`);

    // In development, if local MongoDB is not running, fallback to in-memory MongoDB
    if (config.nodeEnv !== 'production') {
      try {
        console.log('[Database] Development mode: Starting in-memory MongoDB fallback...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        isConnected = true;
        console.log(`[Database] Connected to in-memory MongoDB: ${memUri}`);
        return conn.connection;
      } catch (memErr) {
        console.error(`[Database] In-memory fallback failed: ${memErr.message}`);
      }
    }

    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] Disconnected from MongoDB');
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
    console.log('[Database] In-memory MongoDB stopped');
  }
};
