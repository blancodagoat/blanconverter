/**
 * File Converter Server
 * Express.js server for handling file conversions
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import conversion modules
const ImageConverter = require('./src/server/imageConverter');
const DocumentConverter = require('./src/server/documentConverter');
const AudioConverter = require('./src/server/audioConverter');
const VideoConverter = require('./src/server/videoConverter');
const EbookConverter = require('./src/server/ebookConverter');
const ArchiveConverter = require('./src/server/archiveConverter');
const FontConverter = require('./src/server/fontConverter');
const CadConverter = require('./src/server/cadConverter');
const VectorConverter = require('./src/server/vectorConverter');
const DataConverter = require('./src/server/dataConverter');
const DiskImageConverter = require('./src/server/diskImageConverter');
const SpecializedConverter = require('./src/server/specializedConverter');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    }
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourusername.github.io'] 
        : ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static('public'));

// Create necessary directories
const createDirectories = async () => {
    const dirs = ['uploads', 'converted', 'temp'];
    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.log(`Directory ${dir} already exists or cannot be created`);
        }
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 10 // Maximum 10 files at once
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml',
            // Documents
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/rtf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Ebooks
            'application/epub+zip', 'application/x-mobipocket-ebook', 'application/vnd.amazon.ebook',
            // Archives
            'application/zip', 'application/vnd.rar', 'application/x-tar', 'application/gzip', 'application/x-bzip2', 'application/x-7z-compressed',
            // Fonts
            'font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/vnd.ms-fontobject', 'image/svg+xml',
            // CAD/3D
            'application/sla', 'text/plain', 'application/step', 'application/x-3ds', 'application/acad', 'application/dxf', 'model/vnd.collada+xml', 'model/vrml', 'model/x3d+xml',
            // Vector/Graphics
            'application/postscript', 'application/x-coreldraw',
            // Data formats
            'text/csv', 'application/json', 'application/xml', 'text/yaml',
            // Disk Images
            'application/x-iso9660-image', 'application/x-apple-diskimage',
            // Specialized formats
            'application/dicom', 'application/gpx+xml', 'application/vnd.google-earth.kml+xml',
            'application/x-subrip', 'text/vtt',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/mp4', 'audio/x-ms-wma', 'audio/aiff',
            // Video
            'video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm', 'video/x-flv', 'video/x-ms-wmv', 'video/3gpp'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Initialize converters
const imageConverter = new ImageConverter();
const documentConverter = new DocumentConverter();
const audioConverter = new AudioConverter();
const videoConverter = new VideoConverter();
const ebookConverter = new EbookConverter();
const archiveConverter = new ArchiveConverter();
const fontConverter = new FontConverter();
const cadConverter = new CadConverter();
const vectorConverter = new VectorConverter();
const dataConverter = new DataConverter();
const diskImageConverter = new DiskImageConverter();
const specializedConverter = new SpecializedConverter();

// Routes

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

/**
 * Get supported formats
 */
app.get('/api/formats', (req, res) => {
            const formats = {
            images: {
                input: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'heic', 'heif', 'raw', 'cr2', 'nef', 'arw', 'dng'],
                output: ['jpg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'pdf']
            },
            documents: {
                input: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'odt'],
                output: ['pdf', 'docx', 'txt', 'rtf', 'xlsx', 'csv', 'odt', 'jpg', 'png']
            },
            ebooks: {
                input: ['epub', 'mobi', 'azw3', 'pdf', 'docx'],
                output: ['epub', 'mobi', 'azw3', 'pdf', 'docx']
            },
            archives: {
                input: ['zip', 'rar', 'tar', 'tar.gz', 'tar.bz2', '7z', 'gz', 'bz2'],
                output: ['zip', 'tar', 'tar.gz', 'tar.bz2', '7z']
            },
            fonts: {
                input: ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg'],
                output: ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg']
            },
            cad: {
                input: ['stl', 'obj', 'step', 'stp', '3ds', 'dwg', 'dxf', 'dae', 'fbx', 'ply', 'wrl', 'x3d'],
                output: ['stl', 'obj', 'step', 'stp', '3ds', 'dxf', 'pdf', 'svg', 'dae', 'fbx', 'ply', 'wrl', 'x3d']
            },
            vectors: {
                input: ['ai', 'cdr', 'eps', 'svg', 'pdf'],
                output: ['pdf', 'svg', 'png', 'jpg', 'eps', 'ai', 'cdr']
            },
            data: {
                input: ['csv', 'xls', 'xlsx', 'json', 'xml', 'yaml', 'yml'],
                output: ['csv', 'xls', 'xlsx', 'json', 'xml', 'yaml', 'yml']
            },
            diskImages: {
                input: ['iso', 'bin', 'img', 'dmg'],
                output: ['iso', 'bin', 'img', 'dmg']
            },
            specialized: {
                input: ['dicom', 'dcm', 'gpx', 'kml', 'srt', 'vtt', 'txt'],
                output: ['png', 'jpg', 'jpeg', 'gpx', 'kml', 'csv', 'srt', 'vtt', 'txt']
            },
            audio: {
                input: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'aiff'],
                output: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']
            },
            video: {
                input: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', '3gp'],
                output: ['mp4', 'avi', 'mov', 'mkv', 'webm']
            }
        };

    res.json(formats);
});

/**
 * Convert single file
 */
app.post('/api/convert', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded'
            });
        }

        const { targetFormat } = req.body;
        if (!targetFormat) {
            return res.status(400).json({
                error: 'Target format not specified'
            });
        }

        const file = req.file;
        const fileType = this.getFileCategory(file.mimetype);
        const converter = this.getConverter(fileType);

        if (!converter) {
            return res.status(400).json({
                error: 'Unsupported file type'
            });
        }

        // Handle video to audio extraction
        let result;
        if (fileType === 'video' && ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(targetFormat.toLowerCase())) {
            // Extract audio from video
            result = await audioConverter.extractFromVideo(file.path, targetFormat);
        } else {
            // Regular conversion
            result = await converter.convert(file.path, targetFormat);
        }

        // Clean up uploaded file
        await fs.unlink(file.path);

        res.json({
            success: true,
            originalFile: {
                name: file.originalname,
                size: file.size,
                type: file.mimetype
            },
            convertedFile: {
                name: result.filename,
                size: result.size,
                type: result.mimeType,
                url: `/download/${result.filename}`
            }
        });

    } catch (error) {
        console.error('Conversion error:', error);
        
        // Clean up uploaded file on error
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }

        res.status(500).json({
            error: 'Conversion failed',
            message: error.message
        });
    }
});

/**
 * Convert multiple files
 */
app.post('/api/convert-batch', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No files uploaded'
            });
        }

        const { targetFormats } = req.body;
        if (!targetFormats) {
            return res.status(400).json({
                error: 'Target formats not specified'
            });
        }

        const formats = JSON.parse(targetFormats);
        const results = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const targetFormat = formats[i] || 'pdf';

            try {
                const fileType = this.getFileCategory(file.mimetype);
                const converter = this.getConverter(fileType);

                if (converter) {
                    const result = await converter.convert(file.path, targetFormat);
                    results.push({
                        success: true,
                        originalFile: {
                            name: file.originalname,
                            size: file.size,
                            type: file.mimetype
                        },
                        convertedFile: {
                            name: result.filename,
                            size: result.size,
                            type: result.mimeType,
                            url: `/download/${result.filename}`
                        }
                    });
                } else {
                    results.push({
                        success: false,
                        originalFile: {
                            name: file.originalname,
                            size: file.size,
                            type: file.mimetype
                        },
                        error: 'Unsupported file type'
                    });
                }

                // Clean up uploaded file
                await fs.unlink(file.path);

            } catch (error) {
                results.push({
                    success: false,
                    originalFile: {
                        name: file.originalname,
                        size: file.size,
                        type: file.mimetype
                    },
                    error: error.message
                });

                // Clean up uploaded file on error
                try {
                    await fs.unlink(file.path);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }
        }

        res.json({
            success: true,
            results: results
        });

    } catch (error) {
        console.error('Batch conversion error:', error);
        res.status(500).json({
            error: 'Batch conversion failed',
            message: error.message
        });
    }
});

/**
 * Download converted file
 */
app.get('/download/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'converted', filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                error: 'File not found'
            });
        }

        // Get file stats
        const stats = await fs.stat(filePath);

        // Set headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', stats.size);

        // Stream file
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            error: 'Download failed',
            message: error.message
        });
    }
});

/**
 * Get file conversion status
 */
app.get('/api/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    
    // In a real implementation, you would check the status from a job queue
    // For now, we'll return a mock status
    res.json({
        jobId: jobId,
        status: 'completed',
        progress: 100,
        message: 'Conversion completed successfully'
    });
});

/**
 * Utility function to get file category
 */
function getFileCategory(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('epub') || mimeType.includes('mobipocket') || mimeType.includes('amazon.ebook')) return 'ebook';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || 
        mimeType.includes('gzip') || mimeType.includes('bzip2') || mimeType.includes('7z')) return 'archive';
            if (mimeType.includes('font') || mimeType.includes('ms-fontobject') || 
            (mimeType.includes('svg') && mimeType.includes('xml'))) return 'font';
        if (mimeType.includes('sla') || mimeType.includes('step') || mimeType.includes('3ds') || 
            mimeType.includes('acad') || mimeType.includes('dxf') || mimeType.includes('collada') ||
            mimeType.includes('vrml') || mimeType.includes('x3d')) return 'cad';
            if (mimeType.includes('postscript') || mimeType.includes('coreldraw')) return 'vector';
        if (mimeType.includes('csv') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('yaml')) return 'data';
    if (mimeType.includes('iso9660') || mimeType.includes('apple-diskimage')) return 'diskImage';
        if (mimeType.includes('dicom') || mimeType.includes('gpx') || mimeType.includes('kml') || 
            mimeType.includes('subrip') || mimeType.includes('vtt')) return 'specialized';
        if (mimeType.includes('pdf') || mimeType.includes('document') || 
            mimeType.includes('spreadsheet') || mimeType.includes('presentation') ||
            mimeType.includes('text')) return 'document';
    return 'unknown';
}

/**
 * Utility function to get appropriate converter
 */
function getConverter(fileType) {
    switch (fileType) {
        case 'image':
            return imageConverter;
        case 'document':
            return documentConverter;
        case 'ebook':
            return ebookConverter;
        case 'archive':
            return archiveConverter;
        case 'font':
            return fontConverter;
        case 'cad':
            return cadConverter;
        case 'vector':
            return vectorConverter;
        case 'data':
            return dataConverter;
        case 'diskImage':
            return diskImageConverter;
        case 'specialized':
            return specializedConverter;
        case 'audio':
            return audioConverter;
        case 'video':
            return videoConverter;
        default:
            return null;
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'Maximum file size is 100MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files',
                message: 'Maximum 10 files allowed'
            });
        }
    }

    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
    });
});

// Cleanup function to remove old files
const cleanupOldFiles = async () => {
    try {
        const dirs = ['uploads', 'converted', 'temp'];
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        for (const dir of dirs) {
            const dirPath = path.join(__dirname, dir);
            try {
                const files = await fs.readdir(dirPath);
                const now = Date.now();

                for (const file of files) {
                    const filePath = path.join(dirPath, file);
                    try {
                        const stats = await fs.stat(filePath);
                        if (now - stats.mtime.getTime() > maxAge) {
                            await fs.unlink(filePath);
                            console.log(`Cleaned up old file: ${filePath}`);
                        }
                    } catch (error) {
                        console.error(`Error processing file ${filePath}:`, error);
                    }
                }
            } catch (error) {
                console.error(`Error reading directory ${dirPath}:`, error);
            }
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

// Start server
const startServer = async () => {
    try {
        await createDirectories();
        
        app.listen(PORT, () => {
            console.log(`🚀 File Converter Server running on port ${PORT}`);
            console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`);
            console.log(`📁 Converted directory: ${path.join(__dirname, 'converted')}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Schedule cleanup every hour
        setInterval(cleanupOldFiles, 60 * 60 * 1000);

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer(); 