import express from 'express';
import mongoose from 'mongoose';
import { aiService } from '../services/aiService.js';
import { ApiResponse } from '../utils/apiResponse.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const isAiServiceOnline = await aiService.checkHealth();

  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'online',
      database: isDbConnected ? 'connected' : 'disconnected',
      aiService: isAiServiceOnline ? 'reachable' : 'unreachable'
    }
  };

  return ApiResponse.success(res, healthData, 'Citrus Advisory backend is healthy');
});

export default router;
