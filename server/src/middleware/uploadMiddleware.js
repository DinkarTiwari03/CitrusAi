import multer from 'multer';
import { config } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';

// Use in-memory buffer storage to safely validate and stream to FastAPI
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const mimeType = (file.mimetype || '').toLowerCase();

  if (config.allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported file format '${mimeType}'. Allowed formats: ${config.allowedMimeTypes.join(', ')}`,
        415
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1
  },
  fileFilter
});

// Middleware wrapper for single 'image' field
export const uploadImage = (req, res, next) => {
  const contentType = (req.headers['content-type'] || '').toLowerCase();

  // Validate that request is multipart/form-data
  if (!contentType.startsWith('multipart/form-data')) {
    return next(
      new AppError(
        "Invalid Content-Type. Request must be 'multipart/form-data' with an 'image' file field.",
        400
      )
    );
  }

  // Check for missing boundary in Content-Type header
  if (!contentType.includes('boundary=')) {
    return next(
      new AppError(
        "Malformed multipart/form-data request: boundary header is missing.",
        400
      )
    );
  }

  const singleUpload = upload.single('image');

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const maxMb = config.maxFileSizeBytes / (1024 * 1024);
        return next(
          new AppError(`File size exceeds maximum allowed limit of ${maxMb}MB`, 413)
        );
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError(`Unexpected form field '${err.field}'. Use field name 'image'`, 400)
        );
      }
      return next(new AppError(`File upload error: ${err.message}`, 400));
    } else if (err) {
      // Handle busboy boundary / parsing errors
      if (err.message && err.message.toLowerCase().includes('boundary')) {
        return next(
          new AppError('Malformed multipart payload: boundary error in form data', 400)
        );
      }
      return next(err);
    }

    next();
  });
};
