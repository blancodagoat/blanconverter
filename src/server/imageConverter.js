/**
 * Image Converter Module
 * Handles image file conversions using Sharp and specialized libraries
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const svg2pdf = require('svg2pdf.js');

class ImageConverter {
    constructor() {
        this.supportedFormats = {
            input: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'heic', 'heif', 'raw', 'cr2', 'nef', 'arw', 'dng'],
            output: ['jpg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'pdf']
        };
        
        // RAW format extensions
        this.rawFormats = ['raw', 'cr2', 'nef', 'arw', 'dng', 'crw', 'raf', 'orf', 'rw2', 'pef', 'srw'];
    }

    /**
     * Convert image to target format
     * @param {string} inputPath - Path to input file
     * @param {string} targetFormat - Target format (jpg, png, gif, webp, bmp, tiff, pdf)
     * @returns {Promise<Object>} - Conversion result
     */
    async convert(inputPath, targetFormat) {
        try {
            // Validate target format
            if (!this.supportedFormats.output.includes(targetFormat.toLowerCase())) {
                throw new Error(`Unsupported output format: ${targetFormat}`);
            }

            // Get input file extension
            const inputExt = path.extname(inputPath).toLowerCase().substring(1);
            
            // Handle special format conversions
            if (this.rawFormats.includes(inputExt)) {
                return await this.convertFromRaw(inputPath, targetFormat);
            }
            
            if (inputExt === 'heic' || inputExt === 'heif') {
                return await this.convertFromHeic(inputPath, targetFormat);
            }
            
            if (inputExt === 'svg' && targetFormat === 'pdf') {
                return await this.convertSvgToPdf(inputPath);
            }

            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat);
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Get input image info
            const inputInfo = await sharp(inputPath).metadata();

            // Convert image based on target format
            let convertedImage = sharp(inputPath);

            // Apply format-specific processing
            convertedImage = this.applyFormatProcessing(convertedImage, targetFormat);

            // Save converted image
            await convertedImage.toFile(outputPath);

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputInfo = await sharp(outputPath).metadata();

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                width: outputInfo.width,
                height: outputInfo.height,
                format: targetFormat.toLowerCase()
            };

        } catch (error) {
            throw new Error(`Image conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert HEIC/HEIF image to target format
     * @param {string} inputPath - Path to input HEIC file
     * @param {string} targetFormat - Target format
     * @returns {Promise<Object>} - Conversion result
     */
    async convertFromHeic(inputPath, targetFormat) {
        try {
            // For HEIC conversion, we'll use Sharp's built-in support
            // Sharp has limited HEIC support, so we'll try to convert to JPEG first
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat);
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Try to convert using Sharp
            try {
                const convertedImage = sharp(inputPath);
                const processedImage = this.applyFormatProcessing(convertedImage, targetFormat);
                await processedImage.toFile(outputPath);
            } catch (sharpError) {
                // If Sharp fails, provide helpful error message
                throw new Error(`HEIC conversion failed. Please convert your HEIC file to JPEG first using your device's built-in tools, then upload the JPEG file.`);
            }

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputInfo = await sharp(outputPath).metadata();

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                width: outputInfo.width,
                height: outputInfo.height,
                format: targetFormat.toLowerCase()
            };

        } catch (error) {
            throw new Error(`HEIC conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert RAW image to target format
     * @param {string} inputPath - Path to input RAW file
     * @param {string} targetFormat - Target format
     * @returns {Promise<Object>} - Conversion result
     */
    async convertFromRaw(inputPath, targetFormat) {
        try {
            // Sharp has built-in RAW support for many formats
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat);
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Try to convert using Sharp's RAW support
            try {
                const convertedImage = sharp(inputPath);
                const processedImage = this.applyFormatProcessing(convertedImage, targetFormat);
                await processedImage.toFile(outputPath);
            } catch (sharpError) {
                // If Sharp fails, provide helpful error message
                throw new Error(`RAW conversion failed. This RAW format may not be supported. Please convert to JPEG first using your camera's software or other tools.`);
            }

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputInfo = await sharp(outputPath).metadata();

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                width: outputInfo.width,
                height: outputInfo.height,
                format: targetFormat.toLowerCase()
            };

        } catch (error) {
            throw new Error(`RAW conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert SVG to PDF
     * @param {string} inputPath - Path to input SVG file
     * @returns {Promise<Object>} - Conversion result
     */
    async convertSvgToPdf(inputPath) {
        try {
            // Read SVG content
            const svgContent = await fs.readFile(inputPath, 'utf8');
            
            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, 'pdf');
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Create PDF from SVG
            const pdfBuffer = await svg2pdf(svgContent, {
                width: 800,
                height: 600
            });

            // Save PDF
            await fs.writeFile(outputPath, pdfBuffer);

            // Get output file info
            const outputStats = await fs.stat(outputPath);

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: 'application/pdf',
                width: 800,
                height: 600,
                format: 'pdf'
            };

        } catch (error) {
            throw new Error(`SVG to PDF conversion failed: ${error.message}`);
        }
    }

    /**
     * Resize image to specific dimensions
     * @param {string} inputPath - Path to input file
     * @param {string} targetFormat - Target format
     * @param {Object} options - Resize options
     * @returns {Promise<Object>} - Conversion result
     */
    async resize(inputPath, targetFormat, options = {}) {
        try {
            const {
                width,
                height,
                fit = 'inside',
                position = 'center',
                background = { r: 255, g: 255, b: 255, alpha: 1 }
            } = options;

            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat, 'resized');
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Convert and resize image
            let convertedImage = sharp(inputPath);

            if (width || height) {
                convertedImage = convertedImage.resize(width, height, {
                    fit,
                    position,
                    background
                });
            }

            // Apply format-specific processing
            convertedImage = this.applyFormatProcessing(convertedImage, targetFormat);

            // Save converted image
            await convertedImage.toFile(outputPath);

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputInfo = await sharp(outputPath).metadata();

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                width: outputInfo.width,
                height: outputInfo.height,
                format: targetFormat.toLowerCase()
            };

        } catch (error) {
            throw new Error(`Image resize failed: ${error.message}`);
        }
    }

    /**
     * Compress image while maintaining quality
     * @param {string} inputPath - Path to input file
     * @param {string} targetFormat - Target format
     * @param {number} quality - Quality level (1-100)
     * @returns {Promise<Object>} - Conversion result
     */
    async compress(inputPath, targetFormat, quality = 80) {
        try {
            // Validate quality
            if (quality < 1 || quality > 100) {
                throw new Error('Quality must be between 1 and 100');
            }

            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat, 'compressed');
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Convert and compress image
            let convertedImage = sharp(inputPath);

            // Apply format-specific processing with quality
            convertedImage = this.applyFormatProcessing(convertedImage, targetFormat, { quality });

            // Save converted image
            await convertedImage.toFile(outputPath);

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputInfo = await sharp(outputPath).metadata();

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                width: outputInfo.width,
                height: outputInfo.height,
                format: targetFormat.toLowerCase(),
                quality
            };

        } catch (error) {
            throw new Error(`Image compression failed: ${error.message}`);
        }
    }

    /**
     * Convert image to different color spaces
     * @param {string} inputPath - Path to input file
     * @param {string} targetFormat - Target format
     * @param {string} colorSpace - Target color space (srgb, rgb, cmyk, etc.)
     * @returns {Promise<Object>} - Conversion result
     */
    async convertColorSpace(inputPath, targetFormat, colorSpace = 'srgb') {
        try {
            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat, colorSpace);
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Convert image with color space conversion
            let convertedImage = sharp(inputPath).toColorspace(colorSpace);

            // Apply format-specific processing
            convertedImage = this.applyFormatProcessing(convertedImage, targetFormat);

            // Save converted image
            await convertedImage.toFile(outputPath);

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputInfo = await sharp(outputPath).metadata();

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                width: outputInfo.width,
                height: outputInfo.height,
                format: targetFormat.toLowerCase(),
                colorSpace
            };

        } catch (error) {
            throw new Error(`Color space conversion failed: ${error.message}`);
        }
    }

    /**
     * Apply format-specific processing
     * @param {Sharp} image - Sharp image instance
     * @param {string} format - Target format
     * @param {Object} options - Processing options
     * @returns {Sharp} - Processed image
     */
    applyFormatProcessing(image, format, options = {}) {
        const { quality = 85 } = options;

        switch (format.toLowerCase()) {
            case 'jpg':
            case 'jpeg':
                return image.jpeg({
                    quality,
                    progressive: true,
                    mozjpeg: true
                });

            case 'png':
                return image.png({
                    compressionLevel: 6,
                    progressive: true
                });

            case 'webp':
                return image.webp({
                    quality,
                    effort: 4
                });

            case 'gif':
                return image.gif({
                    effort: 3
                });

            case 'bmp':
                return image.bmp();

            case 'tiff':
                return image.tiff({
                    compression: 'lzw',
                    quality
                });

            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    /**
     * Generate output filename
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {string} suffix - Optional suffix
     * @returns {string} - Output filename
     */
    generateOutputFilename(inputPath, targetFormat, suffix = '') {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const baseName = path.basename(inputPath, path.extname(inputPath));
        const suffixPart = suffix ? `-${suffix}` : '';
        
        return `image-${baseName}-${timestamp}-${randomSuffix}${suffixPart}.${targetFormat.toLowerCase()}`;
    }

    /**
     * Get MIME type for format
     * @param {string} format - File format
     * @returns {string} - MIME type
     */
    getMimeType(format) {
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'svg': 'image/svg+xml',
            'heic': 'image/heic',
            'heif': 'image/heif',
            'raw': 'image/x-raw',
            'cr2': 'image/x-canon-cr2',
            'nef': 'image/x-nikon-nef',
            'arw': 'image/x-sony-arw',
            'dng': 'image/x-adobe-dng',
            'pdf': 'application/pdf'
        };

        return mimeTypes[format.toLowerCase()] || 'image/jpeg';
    }

    /**
     * Get supported formats
     * @returns {Object} - Supported input and output formats
     */
    getSupportedFormats() {
        return this.supportedFormats;
    }

    /**
     * Validate input format
     * @param {string} format - Format to validate
     * @returns {boolean} - Whether format is supported
     */
    isInputFormatSupported(format) {
        return this.supportedFormats.input.includes(format.toLowerCase());
    }

    /**
     * Validate output format
     * @param {string} format - Format to validate
     * @returns {boolean} - Whether format is supported
     */
    isOutputFormatSupported(format) {
        return this.supportedFormats.output.includes(format.toLowerCase());
    }

    /**
     * Get image metadata
     * @param {string} inputPath - Path to input file
     * @returns {Promise<Object>} - Image metadata
     */
    async getMetadata(inputPath) {
        try {
            const metadata = await sharp(inputPath).metadata();
            return {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                channels: metadata.channels,
                depth: metadata.depth,
                density: metadata.density,
                hasProfile: metadata.hasProfile,
                hasAlpha: metadata.hasAlpha,
                orientation: metadata.orientation,
                isOpaque: metadata.isOpaque,
                space: metadata.space
            };
        } catch (error) {
            throw new Error(`Failed to get image metadata: ${error.message}`);
        }
    }
}

module.exports = ImageConverter; 