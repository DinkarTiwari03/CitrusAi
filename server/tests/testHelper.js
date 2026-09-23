import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { config } from '../src/config/env.js';

let mongod = null;

export const setupTestDatabase = async () => {
  // First try to connect to configured MongoDB
  try {
    const conn = await connectDatabase();
    console.log('[TestDB] Connected to configured MongoDB');
    return conn;
  } catch (err) {
    console.log('[TestDB] Configured MongoDB unavailable, launching in-memory MongoDB for testing...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`[TestDB] In-memory MongoDB connected: ${uri}`);
    return conn;
  }
};

export const teardownTestDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      // Clean up test collections
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      await disconnectDatabase();
    }
    if (mongod) {
      await mongod.stop();
      console.log('[TestDB] In-memory MongoDB stopped');
    }
  } catch (err) {
    console.warn(`[TestDB] Teardown warning: ${err.message}`);
  }
};
