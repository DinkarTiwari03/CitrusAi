import mongoose from 'mongoose';
import { Prediction } from '../models/Prediction.js';
import { aiService } from '../services/aiService.js';
import { ApiResponse, AppError } from '../utils/apiResponse.js';

export const analyzeImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("Image file is required. Provide file in 'image' field.", 400);
    }

    // 1. Forward image to Python FastAPI AI service
    const aiResult = await aiService.predictCitrusLeaf(req.file);

    // 2. Persist prediction and advisory into MongoDB
    const predictionData = {
      disease: aiResult.disease,
      confidence: aiResult.confidence,
      severity: aiResult.severity,
      affectedArea: aiResult.affectedArea,
      totalLeafPixels: aiResult.totalLeafPixels || 0,
      affectedPixels: aiResult.affectedPixels || 0,
      priority: aiResult.priority || 'MEDIUM',
      recommendations: aiResult.recommendations || [],
      localSources: (aiResult.localSources || []).map((s) => ({
        source: s.source,
        similarity: s.similarity,
        text: s.text || ''
      })),
      webSources: (aiResult.webSources || []).map((w) => ({
        title: w.title || '',
        url: w.url || '',
        snippet: w.snippet || ''
      })),
      advisory: aiResult.advisory || '',
      imageReference: {
        originalName: (req.file.originalname || 'leaf.png').replace(/^.*[\\\/]/, '').replace(/[^\w.-]/g, '_').slice(0, 120),
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    };

    const savedPrediction = await Prediction.create(predictionData);

    return ApiResponse.created(
      res,
      savedPrediction,
      'Citrus leaf analysis completed and recorded successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getPredictions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Optional query filters
    const filter = {};
    if (req.query.disease) {
      filter.disease = req.query.disease;
    }
    if (req.query.severity) {
      filter.severity = req.query.severity;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Search by disease name or original image filename (escaped to prevent ReDoS)
    const search = req.query.search || req.query.q;
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { disease: searchRegex },
        { 'imageReference.originalName': searchRegex }
      ];
    }

    // Sorting
    const validSortFields = ['createdAt', 'confidence', 'affectedArea', 'disease', 'severity'];
    const sortBy = validSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: order };

    const [predictions, total] = await Promise.all([
      Prediction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return ApiResponse.success(
      res,
      {
        predictions,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      },
      'Historical predictions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getPredictionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(`Invalid prediction ID format: '${id}'`, 400);
    }

    const prediction = await Prediction.findById(id).lean();

    if (!prediction) {
      throw new AppError(`Prediction record with ID '${id}' not found`, 404);
    }

    return ApiResponse.success(res, prediction, 'Prediction retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getPredictionStats = async (req, res, next) => {
  try {
    const total = await Prediction.countDocuments();

    if (total === 0) {
      return ApiResponse.success(
        res,
        {
          total: 0,
          diseaseDistribution: [],
          severityDistribution: [],
          priorityDistribution: [],
          confidenceStats: { avg: 0, min: 0, max: 0 },
          avgAffectedArea: 0,
          recentAnalyses: []
        },
        'Prediction statistics retrieved successfully (empty collection)'
      );
    }

    const [
      diseaseAgg,
      severityAgg,
      priorityAgg,
      numStatsAgg,
      recentAnalyses
    ] = await Promise.all([
      // Disease breakdown
      Prediction.aggregate([
        { $group: { _id: '$disease', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } },
        { $sort: { count: -1 } }
      ]),
      // Severity breakdown
      Prediction.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Priority breakdown
      Prediction.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Numeric summary stats
      Prediction.aggregate([
        {
          $group: {
            _id: null,
            avgConfidence: { $avg: '$confidence' },
            minConfidence: { $min: '$confidence' },
            maxConfidence: { $max: '$confidence' },
            avgAffectedArea: { $avg: '$affectedArea' }
          }
        }
      ]),
      // 5 most recent records
      Prediction.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('disease confidence severity affectedArea priority imageReference createdAt')
        .lean()
    ]);

    const diseaseDistribution = diseaseAgg.map((item) => ({
      disease: item._id,
      count: item.count,
      percentage: Math.round((item.count / total) * 1000) / 10,
      avgConfidence: Math.round((item.avgConfidence || 0) * 10) / 10
    }));

    const severityDistribution = severityAgg.map((item) => ({
      severity: item._id,
      count: item.count,
      percentage: Math.round((item.count / total) * 1000) / 10
    }));

    const priorityDistribution = priorityAgg.map((item) => ({
      priority: item._id,
      count: item.count,
      percentage: Math.round((item.count / total) * 1000) / 10
    }));

    const numStats = numStatsAgg[0] || {};

    return ApiResponse.success(
      res,
      {
        total,
        diseaseDistribution,
        severityDistribution,
        priorityDistribution,
        confidenceStats: {
          avg: Math.round((numStats.avgConfidence || 0) * 10) / 10,
          min: Math.round((numStats.minConfidence || 0) * 10) / 10,
          max: Math.round((numStats.maxConfidence || 0) * 10) / 10
        },
        avgAffectedArea: Math.round((numStats.avgAffectedArea || 0) * 10) / 10,
        recentAnalyses
      },
      'Prediction statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};
