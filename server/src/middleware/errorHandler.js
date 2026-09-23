import { ApiResponse, AppError } from '../utils/apiResponse.js';
import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred';
  let errors = err.details || null;

  // Log server-side diagnostic information
  if (statusCode >= 500) {
    console.error(`[ErrorHandler] [500] ${err.name}: ${err.message}`, err.stack);
  } else {
    console.warn(`[ErrorHandler] [${statusCode}] ${err.name}: ${err.message}`);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Handle Mongoose cast errors (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': ${err.value}`;
    errors = null;
  }

  // Handle JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body in request';
  }

  // Handle busboy / multipart header syntax errors
  if (err.message && err.message.toLowerCase().includes('boundary')) {
    statusCode = 400;
    message = 'Invalid multipart form data: missing or malformed boundary';
  }

  // Sanitize message in production for unhandled internal errors
  if (statusCode === 500 && config.nodeEnv === 'production') {
    message = 'Internal server error. Please try again later.';
    errors = null;
  }

  return ApiResponse.error(res, message, statusCode, errors);
};

export const notFoundHandler = (req, res) => {
  return ApiResponse.error(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
};
