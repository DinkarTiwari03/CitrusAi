import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';

class AIService {
  constructor() {
    this.apiUrl = config.aiApiUrl;
    this.timeout = config.aiApiTimeoutMs;
  }

  /**
   * Health check for upstream Python FastAPI service
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        timeout: 5000
      });
      return response.data?.status === 'ok';
    } catch (error) {
      console.warn(`[AIService] Health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends image buffer to Python FastAPI /predict endpoint
   * @param {Object} file - Multer uploaded file object (with buffer, originalname, mimetype)
   * @returns {Promise<Object>} AI analysis result from FastAPI
   */
  async predictCitrusLeaf(file) {
    if (!file || !file.buffer) {
      throw new AppError('No image buffer provided for AI analysis', 400);
    }

    const formData = new FormData();
    formData.append('image', file.buffer, {
      filename: file.originalname || 'leaf.png',
      contentType: file.mimetype || 'image/png'
    });

    try {
      console.log(`[AIService] Forwarding image (${file.size} bytes) to AI API at ${this.apiUrl}/predict...`);

      const response = await axios.post(`${this.apiUrl}/predict`, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: this.timeout,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      const data = response.data;

      if (!data || !data.success) {
        throw new AppError(
          data?.detail || 'AI API returned an unsuccessful response',
          502
        );
      }

      console.log(
        `[AIService] AI analysis successful: ${data.disease} (${data.confidence}%), severity: ${data.severity}`
      );

      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // Network / Connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error(`[AIService] Cannot connect to AI service at ${this.apiUrl}: ${error.message}`);
        throw new AppError(
          'Python AI API is unavailable. Please ensure the AI service is running.',
          503,
          { code: error.code }
        );
      }

      // Timeout errors
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error(`[AIService] AI request timed out after ${this.timeout}ms`);
        throw new AppError(
          'AI analysis request timed out. The model took too long to respond.',
          504
        );
      }

      // Upstream HTTP response errors from FastAPI (e.g. 400, 413, 415, 500)
      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail || error.response.data?.message || 'Error from AI service';

        console.error(`[AIService] Upstream HTTP error ${status}: ${JSON.stringify(detail)}`);

        if (status === 415) {
          throw new AppError(`Unsupported image format: ${detail}`, 415);
        }
        if (status === 400) {
          throw new AppError(`Invalid image payload: ${detail}`, 400);
        }
        if (status === 413) {
          throw new AppError(`Image payload too large: ${detail}`, 413);
        }

        throw new AppError(`AI service error: ${detail}`, 502);
      }

      console.error(`[AIService] Unexpected error: ${error.message}`);
      throw new AppError(`Failed to process image with AI service: ${error.message}`, 500);
    }
  }
}

export const aiService = new AIService();
