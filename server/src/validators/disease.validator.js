import multer from 'multer';

// Use memory storage for quick pass-through to FastAPI
const storage = multer.memoryStorage();

// Reasonable size limit: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Reject with a custom error
        cb(new Error(`Unsupported file type. Allowed types: ${ALLOWED_MIMES.join(', ')}`), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
});

// Middleware wrapper for catching Multer errors gracefully
export const validateDiseaseImage = (req, res, next) => {
    const uploadSingle = upload.single('file');

    uploadSingle(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // E.g., File too large
            return res.status(400).json({
                success: false,
                message: `Upload validation failed: ${err.message}`
            });
        } else if (err) {
            // Unhandled other errors or our custom mime type error
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // Ensure file actually exists in the request payload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded. Please upload a valid leaf image.'
            });
        }

        next();
    });
};
