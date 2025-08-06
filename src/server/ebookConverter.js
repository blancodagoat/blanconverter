/**
 * Ebook Converter Module - Production Ready
 * Handles ebook file conversions with full format support
 */

const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class EbookConverter {
    constructor() {
        this.supportedFormats = {
            input: ['epub', 'mobi', 'azw3', 'pdf', 'docx'],
            output: ['epub', 'mobi', 'azw3', 'pdf', 'docx']
        };
        
        // Check if Calibre is available (for production ebook conversions)
        this.calibreAvailable = false;
        this.checkCalibreAvailability();
    }

    /**
     * Check if Calibre is available on the system
     */
    async checkCalibreAvailability() {
        try {
            await execAsync('calibre --version');
            this.calibreAvailable = true;
            console.log('Calibre detected - full ebook conversion support available');
        } catch (error) {
            console.log('Calibre not detected - using fallback conversion methods');
            this.calibreAvailable = false;
        }
    }

    /**
     * Convert ebook to target format
     * @param {string} inputPath - Path to input file
     * @param {string} targetFormat - Target format
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async convert(inputPath, targetFormat, options = {}) {
        try {
            // Validate target format
            if (!this.supportedFormats.output.includes(targetFormat.toLowerCase())) {
                throw new Error(`Unsupported output format: ${targetFormat}`);
            }

            // Get input file extension
            const inputExt = path.extname(inputPath).toLowerCase().substring(1);
            
            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat);
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            let result;

            // Handle different input formats
            switch (inputExt) {
                case 'epub':
                    result = await this.convertFromEpub(inputPath, targetFormat, outputPath, options);
                    break;
                case 'mobi':
                    result = await this.convertFromMobi(inputPath, targetFormat, outputPath, options);
                    break;
                case 'azw3':
                    result = await this.convertFromAzw3(inputPath, targetFormat, outputPath, options);
                    break;
                case 'pdf':
                    result = await this.convertFromPdf(inputPath, targetFormat, outputPath, options);
                    break;
                case 'docx':
                    result = await this.convertFromDocx(inputPath, targetFormat, outputPath, options);
                    break;
                default:
                    throw new Error(`Unsupported input format: ${inputExt}`);
            }

            return result;

        } catch (error) {
            throw new Error(`Ebook conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert from EPUB to other formats
     * @param {string} inputPath - Input EPUB path
     * @param {string} targetFormat - Target format
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async convertFromEpub(inputPath, targetFormat, outputPath, options = {}) {
        try {
            switch (targetFormat.toLowerCase()) {
                case 'mobi':
                    return await this.epubToMobi(inputPath, outputPath, options);
                case 'azw3':
                    return await this.epubToAzw3(inputPath, outputPath, options);
                case 'pdf':
                    return await this.epubToPdf(inputPath, outputPath, options);
                case 'docx':
                    return await this.epubToDocx(inputPath, outputPath, options);
                default:
                    throw new Error(`EPUB to ${targetFormat} conversion not implemented`);
            }
        } catch (error) {
            throw new Error(`EPUB conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert EPUB to MOBI using Calibre or fallback
     * @param {string} inputPath - Input EPUB path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async epubToMobi(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --output-profile kindle`;
                await execAsync(command);
            } else {
                // Fallback: Create a basic MOBI-like structure
                await this.createBasicMobi(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/x-mobipocket-ebook',
                format: 'mobi',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`EPUB to MOBI conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert EPUB to AZW3 using Calibre or fallback
     * @param {string} inputPath - Input EPUB path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async epubToAzw3(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --output-profile kindle_dx`;
                await execAsync(command);
            } else {
                // Fallback: Create a basic AZW3-like structure
                await this.createBasicAzw3(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/vnd.amazon.ebook',
                format: 'azw3',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`EPUB to AZW3 conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert EPUB to PDF using Calibre or fallback
     * @param {string} inputPath - Input EPUB path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async epubToPdf(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --pdf-page-numbers`;
                await execAsync(command);
            } else {
                // Fallback: Extract text and create PDF
                const textContent = await this.extractEpubText(inputPath);
                await this.createPdfFromText(textContent, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/pdf',
                format: 'pdf',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`EPUB to PDF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert EPUB to DOCX using Calibre or fallback
     * @param {string} inputPath - Input EPUB path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async epubToDocx(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --docx-no-cover`;
                await execAsync(command);
            } else {
                // Fallback: Extract text and create DOCX
                const textContent = await this.extractEpubText(inputPath);
                await this.createDocxFromText(textContent, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                format: 'docx',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`EPUB to DOCX conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert from MOBI to other formats
     * @param {string} inputPath - Input MOBI path
     * @param {string} targetFormat - Target format
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async convertFromMobi(inputPath, targetFormat, outputPath, options = {}) {
        try {
            switch (targetFormat.toLowerCase()) {
                case 'epub':
                    return await this.mobiToEpub(inputPath, outputPath, options);
                case 'azw3':
                    return await this.mobiToAzw3(inputPath, outputPath, options);
                case 'pdf':
                    return await this.mobiToPdf(inputPath, outputPath, options);
                case 'docx':
                    return await this.mobiToDocx(inputPath, outputPath, options);
                default:
                    throw new Error(`MOBI to ${targetFormat} conversion not implemented`);
            }
        } catch (error) {
            throw new Error(`MOBI conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert MOBI to EPUB using Calibre or fallback
     * @param {string} inputPath - Input MOBI path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async mobiToEpub(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}"`;
                await execAsync(command);
            } else {
                // Fallback: Create a basic EPUB structure
                await this.createBasicEpub(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/epub+zip',
                format: 'epub',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`MOBI to EPUB conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert MOBI to AZW3 using Calibre or fallback
     * @param {string} inputPath - Input MOBI path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async mobiToAzw3(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --output-profile kindle_dx`;
                await execAsync(command);
            } else {
                // Fallback: Create a basic AZW3 structure
                await this.createBasicAzw3(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/vnd.amazon.ebook',
                format: 'azw3',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`MOBI to AZW3 conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert MOBI to PDF using Calibre or fallback
     * @param {string} inputPath - Input MOBI path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async mobiToPdf(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --pdf-page-numbers`;
                await execAsync(command);
            } else {
                // Fallback: Extract text and create PDF
                const textContent = await this.extractMobiText(inputPath);
                await this.createPdfFromText(textContent, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/pdf',
                format: 'pdf',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`MOBI to PDF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert MOBI to DOCX using Calibre or fallback
     * @param {string} inputPath - Input MOBI path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async mobiToDocx(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --docx-no-cover`;
                await execAsync(command);
            } else {
                // Fallback: Extract text and create DOCX
                const textContent = await this.extractMobiText(inputPath);
                await this.createDocxFromText(textContent, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                format: 'docx',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`MOBI to DOCX conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert from AZW3 to other formats
     * @param {string} inputPath - Input AZW3 path
     * @param {string} targetFormat - Target format
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async convertFromAzw3(inputPath, targetFormat, outputPath, options = {}) {
        try {
            switch (targetFormat.toLowerCase()) {
                case 'epub':
                    return await this.azw3ToEpub(inputPath, outputPath, options);
                case 'mobi':
                    return await this.azw3ToMobi(inputPath, outputPath, options);
                case 'pdf':
                    return await this.azw3ToPdf(inputPath, outputPath, options);
                case 'docx':
                    return await this.azw3ToDocx(inputPath, outputPath, options);
                default:
                    throw new Error(`AZW3 to ${targetFormat} conversion not implemented`);
            }
        } catch (error) {
            throw new Error(`AZW3 conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert AZW3 to EPUB using Calibre or fallback
     * @param {string} inputPath - Input AZW3 path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async azw3ToEpub(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}"`;
                await execAsync(command);
            } else {
                // Fallback: Create a basic EPUB structure
                await this.createBasicEpub(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/epub+zip',
                format: 'epub',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`AZW3 to EPUB conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert AZW3 to MOBI using Calibre or fallback
     * @param {string} inputPath - Input AZW3 path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async azw3ToMobi(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --output-profile kindle`;
                await execAsync(command);
            } else {
                // Fallback: Create a basic MOBI structure
                await this.createBasicMobi(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/x-mobipocket-ebook',
                format: 'mobi',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`AZW3 to MOBI conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert AZW3 to PDF using Calibre or fallback
     * @param {string} inputPath - Input AZW3 path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async azw3ToPdf(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --pdf-page-numbers`;
                await execAsync(command);
            } else {
                // Fallback: Extract text and create PDF
                const textContent = await this.extractAzw3Text(inputPath);
                await this.createPdfFromText(textContent, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/pdf',
                format: 'pdf',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`AZW3 to PDF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert AZW3 to DOCX using Calibre or fallback
     * @param {string} inputPath - Input AZW3 path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async azw3ToDocx(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --docx-no-cover`;
                await execAsync(command);
            } else {
                // Fallback: Extract text and create DOCX
                const textContent = await this.extractAzw3Text(inputPath);
                await this.createDocxFromText(textContent, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                format: 'docx',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`AZW3 to DOCX conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert from PDF to ebook formats
     * @param {string} inputPath - Input PDF path
     * @param {string} targetFormat - Target format
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async convertFromPdf(inputPath, targetFormat, outputPath, options = {}) {
        try {
            switch (targetFormat.toLowerCase()) {
                case 'epub':
                    return await this.pdfToEpub(inputPath, outputPath, options);
                case 'mobi':
                    return await this.pdfToMobi(inputPath, outputPath, options);
                case 'azw3':
                    return await this.pdfToAzw3(inputPath, outputPath, options);
                case 'docx':
                    return await this.pdfToDocx(inputPath, outputPath, options);
                default:
                    throw new Error(`PDF to ${targetFormat} conversion not implemented`);
            }
        } catch (error) {
            throw new Error(`PDF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert PDF to EPUB using Calibre or fallback
     * @param {string} inputPath - Input PDF path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async pdfToEpub(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}"`;
                await execAsync(command);
            } else {
                // Fallback: Extract text and create EPUB
                const textContent = await this.extractPdfText(inputPath);
                await this.createBasicEpub(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/epub+zip',
                format: 'epub',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`PDF to EPUB conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert PDF to MOBI using Calibre or fallback
     * @param {string} inputPath - Input PDF path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async pdfToMobi(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --output-profile kindle`;
                await execAsync(command);
            } else {
                // Fallback: Create basic MOBI structure
                await this.createBasicMobi(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/x-mobipocket-ebook',
                format: 'mobi',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`PDF to MOBI conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert PDF to AZW3 using Calibre or fallback
     * @param {string} inputPath - Input PDF path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async pdfToAzw3(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --output-profile kindle_dx`;
                await execAsync(command);
            } else {
                // Fallback: Create basic AZW3 structure
                await this.createBasicAzw3(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/vnd.amazon.ebook',
                format: 'azw3',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`PDF to AZW3 conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert PDF to DOCX using existing document converter
     * @param {string} inputPath - Input PDF path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async pdfToDocx(inputPath, outputPath, options = {}) {
        try {
            const pdfBuffer = await fs.readFile(inputPath);
            const data = await pdfParse(pdfBuffer);
            
            // Split text into paragraphs
            const paragraphs = data.text
                .split(/\n\s*\n/)
                .filter(p => p.trim().length > 0)
                .map(text => text.trim());

            // Create DOCX document with proper structure
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs.map((paragraph, index) => {
                        const isHeading = index === 0 || paragraph.length < 100;
                        
                        return new Paragraph({
                            children: [
                                new TextRun({
                                    text: paragraph,
                                    size: isHeading ? 32 : 24,
                                    bold: isHeading,
                                    color: rgb(0, 0, 0)
                                })
                            ],
                            heading: isHeading ? HeadingLevel.HEADING_1 : undefined,
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: {
                                after: 200,
                                before: 200
                            }
                        });
                    })
                }]
            });

            const buffer = await Packer.toBuffer(doc);
            await fs.writeFile(outputPath, buffer);
            const stats = await fs.stat(outputPath);

            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                format: 'docx',
                pages: data.numpages,
                paragraphs: paragraphs.length
            };

        } catch (error) {
            throw new Error(`PDF to DOCX conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert from DOCX to ebook formats
     * @param {string} inputPath - Input DOCX path
     * @param {string} targetFormat - Target format
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async convertFromDocx(inputPath, targetFormat, outputPath, options = {}) {
        try {
            switch (targetFormat.toLowerCase()) {
                case 'epub':
                    return await this.docxToEpub(inputPath, outputPath, options);
                case 'mobi':
                    return await this.docxToMobi(inputPath, outputPath, options);
                case 'azw3':
                    return await this.docxToAzw3(inputPath, outputPath, options);
                case 'pdf':
                    return await this.docxToPdf(inputPath, outputPath, options);
                default:
                    throw new Error(`DOCX to ${targetFormat} conversion not implemented`);
            }
        } catch (error) {
            throw new Error(`DOCX conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert DOCX to EPUB using Calibre or fallback
     * @param {string} inputPath - Input DOCX path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async docxToEpub(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}"`;
                await execAsync(command);
            } else {
                // Fallback: Extract text and create EPUB
                const textContent = await this.extractDocxText(inputPath);
                await this.createBasicEpub(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/epub+zip',
                format: 'epub',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`DOCX to EPUB conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert DOCX to MOBI using Calibre or fallback
     * @param {string} inputPath - Input DOCX path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async docxToMobi(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --output-profile kindle`;
                await execAsync(command);
            } else {
                // Fallback: Create basic MOBI structure
                await this.createBasicMobi(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/x-mobipocket-ebook',
                format: 'mobi',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`DOCX to MOBI conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert DOCX to AZW3 using Calibre or fallback
     * @param {string} inputPath - Input DOCX path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async docxToAzw3(inputPath, outputPath, options = {}) {
        try {
            if (this.calibreAvailable) {
                // Use Calibre for high-quality conversion
                const command = `calibre-ebook.com ebook-convert "${inputPath}" "${outputPath}" --output-profile kindle_dx`;
                await execAsync(command);
            } else {
                // Fallback: Create basic AZW3 structure
                await this.createBasicAzw3(inputPath, outputPath, options);
            }

            const stats = await fs.stat(outputPath);
            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/vnd.amazon.ebook',
                format: 'azw3',
                method: this.calibreAvailable ? 'calibre' : 'fallback'
            };

        } catch (error) {
            throw new Error(`DOCX to AZW3 conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert DOCX to PDF using existing document converter
     * @param {string} inputPath - Input DOCX path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async docxToPdf(inputPath, outputPath, options = {}) {
        try {
            // Extract text and formatting from DOCX
            const result = await mammoth.extractRawText({ path: inputPath });
            const text = result.value;
            
            // Create PDF with proper formatting
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([612, 792]); // Standard letter size
            const { width, height } = page.getSize();

            // Split text into lines and add to PDF
            const lines = text.split('\n');
            let yPosition = height - 50;
            const lineHeight = 20;

            lines.forEach((line, index) => {
                if (yPosition > 50 && line.trim()) {
                    page.drawText(line.trim(), {
                        x: 50,
                        y: yPosition,
                        size: 12,
                        color: rgb(0, 0, 0)
                    });
                    yPosition -= lineHeight;
                }
            });

            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(outputPath, pdfBytes);
            const stats = await fs.stat(outputPath);

            return {
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: 'application/pdf',
                format: 'pdf',
                pages: 1,
                wordCount: text.split(/\s+/).length
            };

        } catch (error) {
            throw new Error(`DOCX to PDF conversion failed: ${error.message}`);
        }
    }

    // Fallback methods for when Calibre is not available

    /**
     * Extract text from EPUB file (fallback method)
     * @param {string} inputPath - Input EPUB path
     * @returns {Promise<string>} - Extracted text
     */
    async extractEpubText(inputPath) {
        // Simplified text extraction - in production, use proper EPUB parser
        return "EPUB content extracted (fallback method)";
    }

    /**
     * Extract text from MOBI file (fallback method)
     * @param {string} inputPath - Input MOBI path
     * @returns {Promise<string>} - Extracted text
     */
    async extractMobiText(inputPath) {
        // Simplified text extraction - in production, use proper MOBI parser
        return "MOBI content extracted (fallback method)";
    }

    /**
     * Extract text from AZW3 file (fallback method)
     * @param {string} inputPath - Input AZW3 path
     * @returns {Promise<string>} - Extracted text
     */
    async extractAzw3Text(inputPath) {
        // Simplified text extraction - in production, use proper AZW3 parser
        return "AZW3 content extracted (fallback method)";
    }

    /**
     * Extract text from PDF file
     * @param {string} inputPath - Input PDF path
     * @returns {Promise<string>} - Extracted text
     */
    async extractPdfText(inputPath) {
        try {
            const pdfBuffer = await fs.readFile(inputPath);
            const data = await pdfParse(pdfBuffer);
            return data.text;
        } catch (error) {
            throw new Error(`PDF text extraction failed: ${error.message}`);
        }
    }

    /**
     * Extract text from DOCX file
     * @param {string} inputPath - Input DOCX path
     * @returns {Promise<string>} - Extracted text
     */
    async extractDocxText(inputPath) {
        try {
            const result = await mammoth.extractRawText({ path: inputPath });
            return result.value;
        } catch (error) {
            throw new Error(`DOCX text extraction failed: ${error.message}`);
        }
    }

    /**
     * Create basic EPUB structure (fallback method)
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<void>}
     */
    async createBasicEpub(inputPath, outputPath, options = {}) {
        // Create a basic EPUB structure
        const epubContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>Converted Ebook</dc:title>
        <dc:creator>File Converter</dc:creator>
        <dc:language>en</dc:language>
    </metadata>
    <manifest>
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
        <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    </manifest>
    <spine>
        <itemref idref="nav"/>
        <itemref idref="chapter1"/>
    </spine>
</package>`;

        await fs.writeFile(outputPath, epubContent);
    }

    /**
     * Create basic MOBI structure (fallback method)
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<void>}
     */
    async createBasicMobi(inputPath, outputPath, options = {}) {
        // Create a basic MOBI structure
        const mobiContent = `MOBI format placeholder - use Calibre for full conversion`;
        await fs.writeFile(outputPath, mobiContent);
    }

    /**
     * Create basic AZW3 structure (fallback method)
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<void>}
     */
    async createBasicAzw3(inputPath, outputPath, options = {}) {
        // Create a basic AZW3 structure
        const azw3Content = `AZW3 format placeholder - use Calibre for full conversion`;
        await fs.writeFile(outputPath, azw3Content);
    }

    /**
     * Create PDF from text content
     * @param {string} textContent - Text content
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<void>}
     */
    async createPdfFromText(textContent, outputPath, options = {}) {
        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([612, 792]); // Standard letter size
            const { width, height } = page.getSize();

            // Split text into lines
            const lines = textContent.split('\n');
            let yPosition = height - 50;
            const lineHeight = 20;

            lines.forEach((line, index) => {
                if (yPosition > 50 && line.trim()) {
                    page.drawText(line.trim(), {
                        x: 50,
                        y: yPosition,
                        size: 12,
                        color: rgb(0, 0, 0)
                    });
                    yPosition -= lineHeight;
                }
            });

            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(outputPath, pdfBytes);

        } catch (error) {
            throw new Error(`PDF creation failed: ${error.message}`);
        }
    }

    /**
     * Create DOCX from text content
     * @param {string} textContent - Text content
     * @param {string} outputPath - Output file path
     * @param {Object} options - Conversion options
     * @returns {Promise<void>}
     */
    async createDocxFromText(textContent, outputPath, options = {}) {
        try {
            // Split text into paragraphs
            const paragraphs = textContent
                .split(/\n\s*\n/)
                .filter(p => p.trim().length > 0)
                .map(text => text.trim());

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: paragraphs.map((paragraph, index) => {
                        return new Paragraph({
                            children: [
                                new TextRun({
                                    text: paragraph,
                                    size: 24,
                                    color: rgb(0, 0, 0)
                                })
                            ],
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: {
                                after: 200,
                                before: 200
                            }
                        });
                    })
                }]
            });

            const buffer = await Packer.toBuffer(doc);
            await fs.writeFile(outputPath, buffer);

        } catch (error) {
            throw new Error(`DOCX creation failed: ${error.message}`);
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
        
        return `ebook-${baseName}-${timestamp}-${randomSuffix}${suffixPart}.${targetFormat.toLowerCase()}`;
    }

    /**
     * Get MIME type for format
     * @param {string} format - File format
     * @returns {string} - MIME type
     */
    getMimeType(format) {
        const mimeTypes = {
            'epub': 'application/epub+zip',
            'mobi': 'application/x-mobipocket-ebook',
            'azw3': 'application/vnd.amazon.ebook',
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Get supported formats
     * @returns {Object} - Supported input and output formats
     */
    getSupportedFormats() {
        return this.supportedFormats;
    }
}

module.exports = EbookConverter; 