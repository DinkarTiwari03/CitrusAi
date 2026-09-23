import express from 'express';
import {
  analyzeImage,
  getPredictions,
  getPredictionById,
  getPredictionStats
} from '../controllers/predictionController.js';
import { uploadImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// POST /api/predictions/analyze - Upload image and run full ConvNeXt + RAG + Severity pipeline
router.post('/analyze', uploadImage, analyzeImage);

// GET /api/predictions/stats - Aggregated disease, severity, priority and confidence statistics
router.get('/stats', getPredictionStats);

// GET /api/predictions - Retrieve history with pagination, search, sorting and filters
router.get('/', getPredictions);

// GET /api/predictions/:id - Retrieve specific prediction by MongoDB ID
router.get('/:id', getPredictionById);

export default router;
