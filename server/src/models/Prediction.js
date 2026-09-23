import mongoose from 'mongoose';

const LocalSourceSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    similarity: { type: Number, required: true },
    text: { type: String, default: '' }
  },
  { _id: false }
);

const WebSourceSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    snippet: { type: String, default: '' }
  },
  { _id: false }
);

const ImageReferenceSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  { _id: false }
);

const PredictionSchema = new mongoose.Schema(
  {
    disease: {
      type: String,
      required: [true, 'Disease classification is required'],
      enum: {
        values: ['Black spot', 'Melanose', 'canker', 'greening', 'healthy'],
        message: '{VALUE} is not a recognized citrus disease category'
      },
      trim: true
    },
    confidence: {
      type: Number,
      required: [true, 'Prediction confidence is required'],
      min: [0, 'Confidence cannot be less than 0'],
      max: [100, 'Confidence cannot exceed 100']
    },
    severity: {
      type: String,
      required: [true, 'Severity assessment is required'],
      enum: {
        values: ['Mild', 'Moderate', 'Severe', 'Critical', 'Unknown'],
        message: '{VALUE} is not a valid severity level'
      },
      default: 'Unknown'
    },
    affectedArea: {
      type: Number,
      required: [true, 'Affected area percentage is required'],
      min: [0, 'Affected area cannot be less than 0'],
      max: [100, 'Affected area cannot exceed 100'],
      default: 0
    },
    totalLeafPixels: {
      type: Number,
      default: 0,
      min: 0
    },
    affectedPixels: {
      type: Number,
      default: 0,
      min: 0
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    recommendations: {
      type: [String],
      default: []
    },
    localSources: {
      type: [LocalSourceSchema],
      default: []
    },
    webSources: {
      type: [WebSourceSchema],
      default: []
    },
    advisory: {
      type: String,
      default: ''
    },
    imageReference: {
      type: ImageReferenceSchema,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound and single-field indexes for fast dashboard queries and history filtering
PredictionSchema.index({ createdAt: -1 });
PredictionSchema.index({ disease: 1, createdAt: -1 });
PredictionSchema.index({ severity: 1, createdAt: -1 });
PredictionSchema.index({ priority: 1 });

export const Prediction = mongoose.model('Prediction', PredictionSchema);
