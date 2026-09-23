import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 65000,
  headers: {
    'Accept': 'application/json'
  }
});

// Response interceptor to unwrap data and handle error formats consistently
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected network error occurred';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      message =
        error.response.data?.message ||
        error.response.data?.detail ||
        `Server responded with error status ${statusCode}`;
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      statusCode = 504;
      message = 'Request timed out. The AI model or server took too long to respond.';
    } else if (error.request) {
      statusCode = 503;
      message = 'Cannot reach backend server. Please verify Express is running on port 5000.';
    }

    return Promise.reject({
      statusCode,
      message,
      rawError: error
    });
  }
);

export const api = {
  /**
   * Check backend, database, and AI service health
   */
  async checkHealth() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  /**
   * Upload citrus leaf image for ConvNeXt classification, OpenCV severity assessment & RAG advisory
   */
  async analyzeImage(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/predictions/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent);
        }
      }
    });

    return response.data;
  },

  /**
   * Retrieve paginated history of predictions
   */
  async getPredictions(params = {}) {
    const response = await apiClient.get('/predictions', { params });
    return response.data;
  },

  /**
   * Retrieve a specific prediction record by ID
   */
  async getPredictionById(id) {
    const response = await apiClient.get(`/predictions/${id}`);
    return response.data;
  },

  /**
   * Retrieve aggregated prediction statistics
   */
  async getStats() {
    const response = await apiClient.get('/predictions/stats');
    return response.data;
  },

  /**
   * Download predictions as CSV
   */
  exportPredictionsCsv(predictions = []) {
    if (!predictions || predictions.length === 0) return;

    const headers = [
      'ID',
      'Date',
      'Image Filename',
      'Disease',
      'Confidence (%)',
      'Severity',
      'Affected Area (%)',
      'Total Leaf Pixels',
      'Affected Pixels',
      'Priority',
      'Recommendations Count',
      'Local Sources Count',
      'Web Sources Count'
    ];

    const rows = predictions.map((p) => [
      `"${p._id || ''}"`,
      `"${p.createdAt ? new Date(p.createdAt).toISOString() : ''}"`,
      `"${(p.imageReference?.originalName || '').replace(/"/g, '""')}"`,
      `"${p.disease || ''}"`,
      p.confidence != null ? p.confidence : '',
      `"${p.severity || ''}"`,
      p.affectedArea != null ? p.affectedArea : '',
      p.totalLeafPixels != null ? p.totalLeafPixels : '',
      p.affectedPixels != null ? p.affectedPixels : '',
      `"${p.priority || ''}"`,
      p.recommendations ? p.recommendations.length : 0,
      p.localSources ? p.localSources.length : 0,
      p.webSources ? p.webSources.length : 0
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `citrus_predictions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export default api;
