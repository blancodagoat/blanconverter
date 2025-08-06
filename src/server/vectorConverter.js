/**
 * Vector/Graphic Converter
 * Handles vector and graphic file conversions
 * Supports: AI ↔ PDF / SVG / PNG / EPS, CDR ↔ SVG / PNG / PDF
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const sharp = require('sharp');

const execAsync = promisify(exec);

class VectorConverter {
    constructor() {
        this.supportedFormats = {
            input: ['ai', 'cdr', 'eps', 'svg', 'pdf'],
            output: ['pdf', 'svg', 'png', 'jpg', 'eps', 'ai', 'cdr']
        };
        
        this.mimeTypes = {
            'ai': 'application/postscript',
            'cdr': 'application/x-coreldraw',
            'eps': 'application/postscript',
            'svg': 'image/svg+xml',
            'pdf': 'application/pdf'
        };

        this.conversionMatrix = {
            // Adobe Illustrator (AI)
            'ai': ['pdf', 'svg', 'png', 'jpg', 'eps'],
            // CorelDRAW (CDR)
            'cdr': ['svg', 'png', 'pdf', 'eps'],
            // Encapsulated PostScript (EPS)
            'eps': ['pdf', 'svg', 'png', 'jpg', 'ai'],
            // Scalable Vector Graphics (SVG)
            'svg': ['pdf', 'png', 'jpg', 'eps', 'ai'],
            // Portable Document Format (PDF)
            'pdf': ['svg', 'png', 'jpg', 'eps', 'ai']
        };
    }

    /**
     * Get supported formats
     */
    getSupportedFormats() {
        return this.supportedFormats;
    }

    /**
     * Get MIME type for format
     */
    getMimeType(format) {
        return this.mimeTypes[format.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Get available output formats for input format
     */
    getAvailableOutputFormats(inputFormat) {
        return this.conversionMatrix[inputFormat.toLowerCase()] || [];
    }

    /**
     * Convert vector/graphic file
     */
    async convert(inputPath, outputPath, targetFormat, options = {}) {
        try {
            const inputFormat = this.getFileFormat(inputPath);
            const outputFormat = targetFormat.toLowerCase();

            console.log(`Converting vector/graphic file from ${inputFormat} to ${outputFormat}`);

            // Validate formats
            if (!this.supportedFormats.input.includes(inputFormat)) {
                throw new Error(`Unsupported input format: ${inputFormat}`);
            }
            if (!this.supportedFormats.output.includes(outputFormat)) {
                throw new Error(`Unsupported output format: ${outputFormat}`);
            }

            // Check if conversion is supported
            const availableFormats = this.getAvailableOutputFormats(inputFormat);
            if (!availableFormats.includes(outputFormat)) {
                throw new Error(`Conversion from ${inputFormat} to ${outputFormat} is not supported`);
            }

            // Handle different conversion scenarios
            if (inputFormat === outputFormat) {
                // Same format - just copy
                await fs.copyFile(inputPath, outputPath);
                return { success: true, message: 'File copied (same format)' };
            }

            // Determine conversion type and execute
            if (this.isVectorFormat(inputFormat) && this.isRasterFormat(outputFormat)) {
                return await this.convertVectorToRaster(inputPath, outputPath, inputFormat, outputFormat, options);
            } else if (this.isRasterFormat(inputFormat) && this.isVectorFormat(outputFormat)) {
                return await this.convertRasterToVector(inputPath, outputPath, inputFormat, outputFormat, options);
            } else if (this.isVectorFormat(inputFormat) && this.isVectorFormat(outputFormat)) {
                return await this.convertVectorToVector(inputPath, outputPath, inputFormat, outputFormat, options);
            } else {
                throw new Error(`Unsupported conversion: ${inputFormat} to ${outputFormat}`);
            }

        } catch (error) {
            console.error('Vector/graphic conversion error:', error);
            throw new Error(`Vector/graphic conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert vector to raster format
     */
    async convertVectorToRaster(inputPath, outputPath, inputFormat, outputFormat, options = {}) {
        try {
            const { width = 1920, height = 1080, background = '#FFFFFF' } = options;

            if (inputFormat === 'svg') {
                return await this.convertSvgToRaster(inputPath, outputPath, outputFormat, options);
            } else if (inputFormat === 'ai' || inputFormat === 'eps') {
                return await this.convertPostScriptToRaster(inputPath, outputPath, outputFormat, options);
            } else if (inputFormat === 'cdr') {
                return await this.convertCdrToRaster(inputPath, outputPath, outputFormat, options);
            } else if (inputFormat === 'pdf') {
                return await this.convertPdfToRaster(inputPath, outputPath, outputFormat, options);
            } else {
                throw new Error(`Vector to raster conversion not implemented for ${inputFormat}`);
            }
        } catch (error) {
            throw new Error(`Vector to raster conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert raster to vector format
     */
    async convertRasterToVector(inputPath, outputPath, inputFormat, outputFormat, options = {}) {
        try {
            if (outputFormat === 'svg') {
                return await this.convertRasterToSvg(inputPath, outputPath, inputFormat, options);
            } else if (outputFormat === 'pdf') {
                return await this.convertRasterToPdf(inputPath, outputPath, inputFormat, options);
            } else if (outputFormat === 'eps') {
                return await this.convertRasterToEps(inputPath, outputPath, inputFormat, options);
            } else {
                throw new Error(`Raster to vector conversion not implemented for ${outputFormat}`);
            }
        } catch (error) {
            throw new Error(`Raster to vector conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert vector to vector format
     */
    async convertVectorToVector(inputPath, outputPath, inputFormat, outputFormat, options = {}) {
        try {
            if (inputFormat === 'ai' && outputFormat === 'svg') {
                return await this.convertAiToSvg(inputPath, outputPath, options);
            } else if (inputFormat === 'cdr' && outputFormat === 'svg') {
                return await this.convertCdrToSvg(inputPath, outputPath, options);
            } else if (inputFormat === 'svg' && outputFormat === 'pdf') {
                return await this.convertSvgToPdf(inputPath, outputPath, options);
            } else if (inputFormat === 'pdf' && outputFormat === 'svg') {
                return await this.convertPdfToSvg(inputPath, outputPath, options);
            } else if (inputFormat === 'eps' && outputFormat === 'svg') {
                return await this.convertEpsToSvg(inputPath, outputPath, options);
            } else if (inputFormat === 'svg' && outputFormat === 'eps') {
                return await this.convertSvgToEps(inputPath, outputPath, options);
            } else {
                throw new Error(`Vector to vector conversion not implemented: ${inputFormat} to ${outputFormat}`);
            }
        } catch (error) {
            throw new Error(`Vector to vector conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert SVG to raster format
     */
    async convertSvgToRaster(inputPath, outputPath, outputFormat, options = {}) {
        try {
            const { width = 1920, height = 1080, background = '#FFFFFF' } = options;

            let sharpInstance = sharp(inputPath, { density: 300 });

            // Set background if specified
            if (background !== 'transparent') {
                sharpInstance = sharpInstance.flatten({ background });
            }

            // Resize if specified
            if (width && height) {
                sharpInstance = sharpInstance.resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Convert to target format
            switch (outputFormat) {
                case 'png':
                    await sharpInstance.png({ quality: 90 }).toFile(outputPath);
                    break;
                case 'jpg':
                    await sharpInstance.jpeg({ quality: 90 }).toFile(outputPath);
                    break;
                default:
                    throw new Error(`Unsupported raster format: ${outputFormat}`);
            }

            return {
                success: true,
                message: `Successfully converted SVG to ${outputFormat}`,
                outputPath
            };
        } catch (error) {
            throw new Error(`SVG to raster conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert PostScript (AI/EPS) to raster
     */
    async convertPostScriptToRaster(inputPath, outputPath, outputFormat, options = {}) {
        try {
            const { width = 1920, height = 1080, background = '#FFFFFF' } = options;

            // Use Ghostscript for PostScript to raster conversion
            const gsCommand = `gs -sDEVICE=${outputFormat === 'png' ? 'pngalpha' : 'jpeg'} -dNOPAUSE -dBATCH -dSAFER -sOutputFile="${outputPath}" -r300 -g${width}x${height} "${inputPath}"`;
            
            await execAsync(gsCommand);

            // Verify output file exists
            await fs.access(outputPath);

            return {
                success: true,
                message: `Successfully converted PostScript to ${outputFormat}`,
                outputPath
            };
        } catch (error) {
            // Fallback to Inkscape if Ghostscript fails
            try {
                return await this.convertWithInkscape(inputPath, outputPath, outputFormat, options);
            } catch (inkscapeError) {
                throw new Error(`PostScript to raster conversion failed: ${error.message}`);
            }
        }
    }

    /**
     * Convert CorelDRAW to raster
     */
    async convertCdrToRaster(inputPath, outputPath, outputFormat, options = {}) {
        try {
            const { width = 1920, height = 1080, background = '#FFFFFF' } = options;

            // Use Inkscape for CDR to raster conversion
            return await this.convertWithInkscape(inputPath, outputPath, outputFormat, options);
        } catch (error) {
            throw new Error(`CDR to raster conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert PDF to raster
     */
    async convertPdfToRaster(inputPath, outputPath, outputFormat, options = {}) {
        try {
            const { width = 1920, height = 1080, background = '#FFFFFF', page = 1 } = options;

            let sharpInstance = sharp(inputPath, { page: page - 1, density: 300 });

            // Set background if specified
            if (background !== 'transparent') {
                sharpInstance = sharpInstance.flatten({ background });
            }

            // Resize if specified
            if (width && height) {
                sharpInstance = sharpInstance.resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Convert to target format
            switch (outputFormat) {
                case 'png':
                    await sharpInstance.png({ quality: 90 }).toFile(outputPath);
                    break;
                case 'jpg':
                    await sharpInstance.jpeg({ quality: 90 }).toFile(outputPath);
                    break;
                default:
                    throw new Error(`Unsupported raster format: ${outputFormat}`);
            }

            return {
                success: true,
                message: `Successfully converted PDF to ${outputFormat}`,
                outputPath
            };
        } catch (error) {
            throw new Error(`PDF to raster conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert raster to SVG
     */
    async convertRasterToSvg(inputPath, outputPath, inputFormat, options = {}) {
        try {
            // Use Potrace for bitmap to vector conversion
            const potraceCommand = `potrace "${inputPath}" -s -o "${outputPath}"`;
            await execAsync(potraceCommand);

            // Verify output file exists
            await fs.access(outputPath);

            return {
                success: true,
                message: 'Successfully converted raster to SVG',
                outputPath
            };
        } catch (error) {
            // Fallback to manual SVG generation
            try {
                return await this.generateSvgFromRaster(inputPath, outputPath, options);
            } catch (svgError) {
                throw new Error(`Raster to SVG conversion failed: ${error.message}`);
            }
        }
    }

    /**
     * Convert raster to PDF
     */
    async convertRasterToPdf(inputPath, outputPath, inputFormat, options = {}) {
        try {
            const { width = 1920, height = 1080 } = options;

            // Use Sharp to convert raster to PDF
            await sharp(inputPath)
                .resize(width, height, { fit: 'inside', withoutEnlargement: true })
                .toFormat('pdf')
                .toFile(outputPath);

            return {
                success: true,
                message: 'Successfully converted raster to PDF',
                outputPath
            };
        } catch (error) {
            throw new Error(`Raster to PDF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert raster to EPS
     */
    async convertRasterToEps(inputPath, outputPath, inputFormat, options = {}) {
        try {
            // Use ImageMagick for raster to EPS conversion
            const magickCommand = `magick "${inputPath}" "${outputPath}"`;
            await execAsync(magickCommand);

            // Verify output file exists
            await fs.access(outputPath);

            return {
                success: true,
                message: 'Successfully converted raster to EPS',
                outputPath
            };
        } catch (error) {
            throw new Error(`Raster to EPS conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert AI to SVG
     */
    async convertAiToSvg(inputPath, outputPath, options = {}) {
        try {
            // Use Inkscape for AI to SVG conversion
            return await this.convertWithInkscape(inputPath, outputPath, 'svg', options);
        } catch (error) {
            throw new Error(`AI to SVG conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert CDR to SVG
     */
    async convertCdrToSvg(inputPath, outputPath, options = {}) {
        try {
            // Use Inkscape for CDR to SVG conversion
            return await this.convertWithInkscape(inputPath, outputPath, 'svg', options);
        } catch (error) {
            throw new Error(`CDR to SVG conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert SVG to PDF
     */
    async convertSvgToPdf(inputPath, outputPath, options = {}) {
        try {
            // Use Inkscape for SVG to PDF conversion
            return await this.convertWithInkscape(inputPath, outputPath, 'pdf', options);
        } catch (error) {
            throw new Error(`SVG to PDF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert PDF to SVG
     */
    async convertPdfToSvg(inputPath, outputPath, options = {}) {
        try {
            // Use Inkscape for PDF to SVG conversion
            return await this.convertWithInkscape(inputPath, outputPath, 'svg', options);
        } catch (error) {
            throw new Error(`PDF to SVG conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert EPS to SVG
     */
    async convertEpsToSvg(inputPath, outputPath, options = {}) {
        try {
            // Use Inkscape for EPS to SVG conversion
            return await this.convertWithInkscape(inputPath, outputPath, 'svg', options);
        } catch (error) {
            throw new Error(`EPS to SVG conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert SVG to EPS
     */
    async convertSvgToEps(inputPath, outputPath, options = {}) {
        try {
            // Use Inkscape for SVG to EPS conversion
            return await this.convertWithInkscape(inputPath, outputPath, 'eps', options);
        } catch (error) {
            throw new Error(`SVG to EPS conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert using Inkscape
     */
    async convertWithInkscape(inputPath, outputPath, outputFormat, options = {}) {
        try {
            const { width, height, background = '#FFFFFF' } = options;
            
            let inkscapeCommand = `inkscape --export-type=${outputFormat} --export-filename="${outputPath}"`;
            
            if (width && height) {
                inkscapeCommand += ` --export-width=${width} --export-height=${height}`;
            }
            
            if (background !== 'transparent') {
                inkscapeCommand += ` --export-background="${background}"`;
            }
            
            inkscapeCommand += ` "${inputPath}"`;
            
            await execAsync(inkscapeCommand);

            // Verify output file exists
            await fs.access(outputPath);

            return {
                success: true,
                message: `Successfully converted using Inkscape to ${outputFormat}`,
                outputPath
            };
        } catch (error) {
            throw new Error(`Inkscape conversion failed: ${error.message}`);
        }
    }

    /**
     * Generate SVG from raster (fallback method)
     */
    async generateSvgFromRaster(inputPath, outputPath, options = {}) {
        try {
            const { width = 800, height = 600 } = options;
            
            // Create a simple SVG wrapper around the image
            const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <image href="${inputPath}" width="${width}" height="${height}" />
</svg>`;
            
            await fs.writeFile(outputPath, svgContent);

            return {
                success: true,
                message: 'Successfully generated SVG from raster',
                outputPath
            };
        } catch (error) {
            throw new Error(`SVG generation failed: ${error.message}`);
        }
    }

    /**
     * Get file format from path
     */
    getFileFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase().substring(1);
        return ext;
    }

    /**
     * Check if format is vector
     */
    isVectorFormat(format) {
        const vectorFormats = ['ai', 'cdr', 'eps', 'svg', 'pdf'];
        return vectorFormats.includes(format.toLowerCase());
    }

    /**
     * Check if format is raster
     */
    isRasterFormat(format) {
        const rasterFormats = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'];
        return rasterFormats.includes(format.toLowerCase());
    }

    /**
     * Get vector file metadata
     */
    async getVectorMetadata(filePath) {
        try {
            const format = this.getFileFormat(filePath);
            const stats = await fs.stat(filePath);
            
            let metadata = {
                format,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };

            if (format === 'svg') {
                metadata = await this.getSvgMetadata(filePath, metadata);
            } else if (format === 'pdf') {
                metadata = await this.getPdfMetadata(filePath, metadata);
            } else if (format === 'ai' || format === 'eps') {
                metadata = await this.getPostScriptMetadata(filePath, metadata);
            }

            return metadata;
        } catch (error) {
            throw new Error(`Failed to get vector metadata: ${error.message}`);
        }
    }

    /**
     * Get SVG metadata
     */
    async getSvgMetadata(filePath, baseMetadata) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extract viewBox
            const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/);
            if (viewBoxMatch) {
                const [x, y, width, height] = viewBoxMatch[1].split(' ').map(Number);
                baseMetadata.viewBox = { x, y, width, height };
            }

            // Extract width and height
            const widthMatch = content.match(/width=["']([^"']+)["']/);
            const heightMatch = content.match(/height=["']([^"']+)["']/);
            if (widthMatch) baseMetadata.width = widthMatch[1];
            if (heightMatch) baseMetadata.height = heightMatch[1];

            return baseMetadata;
        } catch (error) {
            return baseMetadata;
        }
    }

    /**
     * Get PDF metadata
     */
    async getPdfMetadata(filePath, baseMetadata) {
        try {
            // Use pdf-lib or similar to extract PDF metadata
            const pdfLib = require('pdf-lib');
            const pdfBytes = await fs.readFile(filePath);
            const pdfDoc = await pdfLib.PDFDocument.load(pdfBytes);
            
            baseMetadata.pageCount = pdfDoc.getPageCount();
            baseMetadata.title = pdfDoc.getTitle();
            baseMetadata.author = pdfDoc.getAuthor();
            baseMetadata.subject = pdfDoc.getSubject();
            
            return baseMetadata;
        } catch (error) {
            return baseMetadata;
        }
    }

    /**
     * Get PostScript metadata
     */
    async getPostScriptMetadata(filePath, baseMetadata) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extract basic PostScript metadata
            const titleMatch = content.match(/\/Title\s+\(([^)]+)\)/);
            const creatorMatch = content.match(/\/Creator\s+\(([^)]+)\)/);
            const creationDateMatch = content.match(/\/CreationDate\s+\(([^)]+)\)/);
            
            if (titleMatch) baseMetadata.title = titleMatch[1];
            if (creatorMatch) baseMetadata.creator = creatorMatch[1];
            if (creationDateMatch) baseMetadata.creationDate = creationDateMatch[1];
            
            return baseMetadata;
        } catch (error) {
            return baseMetadata;
        }
    }

    /**
     * Validate vector file
     */
    async validateVectorFile(filePath) {
        try {
            const format = this.getFileFormat(filePath);
            
            switch (format) {
                case 'svg':
                    return await this.validateSvg(filePath);
                case 'pdf':
                    return await this.validatePdf(filePath);
                case 'ai':
                case 'eps':
                    return await this.validatePostScript(filePath);
                case 'cdr':
                    return await this.validateCdr(filePath);
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate SVG file
     */
    async validateSvg(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return content.includes('<svg') && content.includes('</svg>');
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate PDF file
     */
    async validatePdf(filePath) {
        try {
            const buffer = await fs.readFile(filePath);
            return buffer.toString('ascii', 0, 4) === '%PDF';
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate PostScript file
     */
    async validatePostScript(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return content.includes('%!PS') || content.includes('%!Ai');
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate CDR file
     */
    async validateCdr(filePath) {
        try {
            const buffer = await fs.readFile(filePath);
            // CDR files typically start with specific magic bytes
            const magicBytes = buffer.toString('hex', 0, 8);
            return magicBytes.startsWith('52494646') || magicBytes.startsWith('43524452');
        } catch (error) {
            return false;
        }
    }

    /**
     * Optimize vector file
     */
    async optimizeVectorFile(inputPath, outputPath, options = {}) {
        try {
            const format = this.getFileFormat(inputPath);
            
            if (format === 'svg') {
                return await this.optimizeSvg(inputPath, outputPath, options);
            } else if (format === 'pdf') {
                return await this.optimizePdf(inputPath, outputPath, options);
            } else {
                // For other formats, just copy
                await fs.copyFile(inputPath, outputPath);
                return { success: true, message: 'File copied (optimization not available)' };
            }
        } catch (error) {
            throw new Error(`Vector optimization failed: ${error.message}`);
        }
    }

    /**
     * Optimize SVG file
     */
    async optimizeSvg(inputPath, outputPath, options = {}) {
        try {
            const { removeComments = true, removeEmptyGroups = true, removeEmptyAttrs = true } = options;
            
            // Use SVGO for SVG optimization
            let svgoCommand = `svgo "${inputPath}" -o "${outputPath}"`;
            
            if (removeComments) svgoCommand += ' --enable=removeComments';
            if (removeEmptyGroups) svgoCommand += ' --enable=removeEmptyGroups';
            if (removeEmptyAttrs) svgoCommand += ' --enable=removeEmptyAttrs';
            
            await execAsync(svgoCommand);

            return {
                success: true,
                message: 'Successfully optimized SVG',
                outputPath
            };
        } catch (error) {
            // Fallback to manual optimization
            try {
                const content = await fs.readFile(inputPath, 'utf8');
                let optimized = content;
                
                if (options.removeComments) {
                    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
                }
                
                await fs.writeFile(outputPath, optimized);
                
                return {
                    success: true,
                    message: 'Successfully optimized SVG (manual)',
                    outputPath
                };
            } catch (manualError) {
                throw new Error(`SVG optimization failed: ${error.message}`);
            }
        }
    }

    /**
     * Optimize PDF file
     */
    async optimizePdf(inputPath, outputPath, options = {}) {
        try {
            // Use Ghostscript for PDF optimization
            const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/printer -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
            
            await execAsync(gsCommand);

            return {
                success: true,
                message: 'Successfully optimized PDF',
                outputPath
            };
        } catch (error) {
            throw new Error(`PDF optimization failed: ${error.message}`);
        }
    }
}

module.exports = VectorConverter; 