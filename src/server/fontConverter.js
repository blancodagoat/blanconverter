/**
 * Font Converter
 * Handles font file conversions
 * Supports: TTF ↔ OTF / WOFF / WOFF2, Font ↔ Web font formats (WOFF2, EOT, SVG)
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class FontConverter {
    constructor() {
        this.supportedFormats = {
            input: ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg'],
            output: ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg']
        };
        
        this.mimeTypes = {
            'ttf': 'font/ttf',
            'otf': 'font/otf',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'eot': 'application/vnd.ms-fontobject',
            'svg': 'image/svg+xml'
        };

        this.fontInfo = null;
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
     * Convert font file
     */
    async convert(inputPath, outputPath, targetFormat, options = {}) {
        try {
            const inputFormat = this.getFileFormat(inputPath);
            const outputFormat = targetFormat.toLowerCase();

            console.log(`Converting font from ${inputFormat} to ${outputFormat}`);

            // Validate formats
            if (!this.supportedFormats.input.includes(inputFormat)) {
                throw new Error(`Unsupported input format: ${inputFormat}`);
            }
            if (!this.supportedFormats.output.includes(outputFormat)) {
                throw new Error(`Unsupported output format: ${outputFormat}`);
            }

            // Handle same format
            if (inputFormat === outputFormat) {
                await fs.copyFile(inputPath, outputPath);
                return { success: true, message: 'File copied (same format)' };
            }

            // Get font information
            await this.getFontInfo(inputPath);

            // Perform conversion based on target format
            switch (outputFormat) {
                case 'ttf':
                    await this.convertToTTF(inputPath, outputPath, inputFormat, options);
                    break;
                case 'otf':
                    await this.convertToOTF(inputPath, outputPath, inputFormat, options);
                    break;
                case 'woff':
                    await this.convertToWOFF(inputPath, outputPath, inputFormat, options);
                    break;
                case 'woff2':
                    await this.convertToWOFF2(inputPath, outputPath, inputFormat, options);
                    break;
                case 'eot':
                    await this.convertToEOT(inputPath, outputPath, inputFormat, options);
                    break;
                case 'svg':
                    await this.convertToSVG(inputPath, outputPath, inputFormat, options);
                    break;
                default:
                    throw new Error(`Unsupported output format: ${outputFormat}`);
            }

            return { 
                success: true, 
                message: `Successfully converted from ${inputFormat} to ${outputFormat}`,
                outputPath,
                fontInfo: this.fontInfo
            };

        } catch (error) {
            console.error('Font conversion error:', error);
            throw new Error(`Font conversion failed: ${error.message}`);
        }
    }

    /**
     * Get font information
     */
    async getFontInfo(fontPath) {
        try {
            const format = this.getFileFormat(fontPath);
            
            switch (format) {
                case 'ttf':
                case 'otf':
                    this.fontInfo = await this.getOpenTypeInfo(fontPath);
                    break;
                case 'woff':
                case 'woff2':
                    this.fontInfo = await this.getWOFFInfo(fontPath);
                    break;
                case 'eot':
                    this.fontInfo = await this.getEOTInfo(fontPath);
                    break;
                case 'svg':
                    this.fontInfo = await this.getSVGFontInfo(fontPath);
                    break;
                default:
                    this.fontInfo = await this.getBasicFontInfo(fontPath);
            }

            return this.fontInfo;
        } catch (error) {
            console.error('Error getting font info:', error);
            this.fontInfo = await this.getBasicFontInfo(fontPath);
            return this.fontInfo;
        }
    }

    /**
     * Get OpenType font information
     */
    async getOpenTypeInfo(fontPath) {
        try {
            // Try using fonttools first
            const { stdout } = await execAsync(`python -m fontTools.ttx -t name "${fontPath}"`);
            
            const info = {
                format: this.getFileFormat(fontPath),
                size: (await fs.stat(fontPath)).size,
                tables: []
            };

            // Parse fonttools output
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes('nameID')) {
                    const match = line.match(/nameID (\d+)/);
                    if (match) {
                        info.tables.push(`nameID ${match[1]}`);
                    }
                }
            }

            return info;
        } catch (error) {
            // Fallback to basic info
            return await this.getBasicFontInfo(fontPath);
        }
    }

    /**
     * Get WOFF font information
     */
    async getWOFFInfo(fontPath) {
        try {
            const { stdout } = await execAsync(`python -m fontTools.ttx -t woff "${fontPath}"`);
            
            return {
                format: this.getFileFormat(fontPath),
                size: (await fs.stat(fontPath)).size,
                compressed: true,
                tables: ['woff']
            };
        } catch (error) {
            return await this.getBasicFontInfo(fontPath);
        }
    }

    /**
     * Get EOT font information
     */
    async getEOTInfo(fontPath) {
        return {
            format: 'eot',
            size: (await fs.stat(fontPath)).size,
            embedded: true,
            tables: ['eot']
        };
    }

    /**
     * Get SVG font information
     */
    async getSVGFontInfo(fontPath) {
        try {
            const content = await fs.readFile(fontPath, 'utf8');
            const fontFaceMatch = content.match(/<font-face[^>]*>/);
            const glyphCount = (content.match(/<glyph/g) || []).length;
            
            return {
                format: 'svg',
                size: (await fs.stat(fontPath)).size,
                glyphs: glyphCount,
                tables: ['svg']
            };
        } catch (error) {
            return await this.getBasicFontInfo(fontPath);
        }
    }

    /**
     * Get basic font information
     */
    async getBasicFontInfo(fontPath) {
        const stats = await fs.stat(fontPath);
        return {
            format: this.getFileFormat(fontPath),
            size: stats.size,
            modified: stats.mtime,
            tables: ['basic']
        };
    }

    /**
     * Convert to TTF
     */
    async convertToTTF(inputPath, outputPath, inputFormat, options = {}) {
        try {
            switch (inputFormat) {
                case 'otf':
                    await this.otfToTTF(inputPath, outputPath, options);
                    break;
                case 'woff':
                    await this.woffToTTF(inputPath, outputPath, options);
                    break;
                case 'woff2':
                    await this.woff2ToTTF(inputPath, outputPath, options);
                    break;
                case 'eot':
                    await this.eotToTTF(inputPath, outputPath, options);
                    break;
                case 'svg':
                    await this.svgToTTF(inputPath, outputPath, options);
                    break;
                default:
                    throw new Error(`Cannot convert ${inputFormat} to TTF`);
            }
        } catch (error) {
            throw new Error(`TTF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to OTF
     */
    async convertToOTF(inputPath, outputPath, inputFormat, options = {}) {
        try {
            switch (inputFormat) {
                case 'ttf':
                    await this.ttfToOTF(inputPath, outputPath, options);
                    break;
                case 'woff':
                    await this.woffToOTF(inputPath, outputPath, options);
                    break;
                case 'woff2':
                    await this.woff2ToOTF(inputPath, outputPath, options);
                    break;
                case 'eot':
                    await this.eotToOTF(inputPath, outputPath, options);
                    break;
                case 'svg':
                    await this.svgToOTF(inputPath, outputPath, options);
                    break;
                default:
                    throw new Error(`Cannot convert ${inputFormat} to OTF`);
            }
        } catch (error) {
            throw new Error(`OTF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to WOFF
     */
    async convertToWOFF(inputPath, outputPath, inputFormat, options = {}) {
        try {
            switch (inputFormat) {
                case 'ttf':
                case 'otf':
                    await this.openTypeToWOFF(inputPath, outputPath, options);
                    break;
                case 'woff2':
                    await this.woff2ToWOFF(inputPath, outputPath, options);
                    break;
                case 'eot':
                    await this.eotToWOFF(inputPath, outputPath, options);
                    break;
                case 'svg':
                    await this.svgToWOFF(inputPath, outputPath, options);
                    break;
                default:
                    throw new Error(`Cannot convert ${inputFormat} to WOFF`);
            }
        } catch (error) {
            throw new Error(`WOFF conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to WOFF2
     */
    async convertToWOFF2(inputPath, outputPath, inputFormat, options = {}) {
        try {
            switch (inputFormat) {
                case 'ttf':
                case 'otf':
                    await this.openTypeToWOFF2(inputPath, outputPath, options);
                    break;
                case 'woff':
                    await this.woffToWOFF2(inputPath, outputPath, options);
                    break;
                case 'eot':
                    await this.eotToWOFF2(inputPath, outputPath, options);
                    break;
                case 'svg':
                    await this.svgToWOFF2(inputPath, outputPath, options);
                    break;
                default:
                    throw new Error(`Cannot convert ${inputFormat} to WOFF2`);
            }
        } catch (error) {
            throw new Error(`WOFF2 conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to EOT
     */
    async convertToEOT(inputPath, outputPath, inputFormat, options = {}) {
        try {
            switch (inputFormat) {
                case 'ttf':
                case 'otf':
                    await this.openTypeToEOT(inputPath, outputPath, options);
                    break;
                case 'woff':
                    await this.woffToEOT(inputPath, outputPath, options);
                    break;
                case 'woff2':
                    await this.woff2ToEOT(inputPath, outputPath, options);
                    break;
                case 'svg':
                    await this.svgToEOT(inputPath, outputPath, options);
                    break;
                default:
                    throw new Error(`Cannot convert ${inputFormat} to EOT`);
            }
        } catch (error) {
            throw new Error(`EOT conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to SVG
     */
    async convertToSVG(inputPath, outputPath, inputFormat, options = {}) {
        try {
            switch (inputFormat) {
                case 'ttf':
                case 'otf':
                    await this.openTypeToSVG(inputPath, outputPath, options);
                    break;
                case 'woff':
                    await this.woffToSVG(inputPath, outputPath, options);
                    break;
                case 'woff2':
                    await this.woff2ToSVG(inputPath, outputPath, options);
                    break;
                case 'eot':
                    await this.eotToSVG(inputPath, outputPath, options);
                    break;
                default:
                    throw new Error(`Cannot convert ${inputFormat} to SVG`);
            }
        } catch (error) {
            throw new Error(`SVG conversion failed: ${error.message}`);
        }
    }

    // TTF Conversion Methods
    async otfToTTF(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async woffToTTF(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async woff2ToTTF(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_decompress "${inputPath}" "${outputPath}"`);
    }

    async eotToTTF(inputPath, outputPath, options = {}) {
        // EOT to TTF conversion requires special handling
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async svgToTTF(inputPath, outputPath, options = {}) {
        // SVG to TTF conversion using fontforge
        await execAsync(`fontforge -c 'Open("${inputPath}"); Generate("${outputPath}");'`);
    }

    // OTF Conversion Methods
    async ttfToOTF(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async woffToOTF(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async woff2ToOTF(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_decompress "${inputPath}" "${outputPath}"`);
    }

    async eotToOTF(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async svgToOTF(inputPath, outputPath, options = {}) {
        await execAsync(`fontforge -c 'Open("${inputPath}"); Generate("${outputPath}");'`);
    }

    // WOFF Conversion Methods
    async openTypeToWOFF(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async woff2ToWOFF(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_decompress "${inputPath}" "${outputPath}"`);
    }

    async eotToWOFF(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async svgToWOFF(inputPath, outputPath, options = {}) {
        await execAsync(`fontforge -c 'Open("${inputPath}"); Generate("${outputPath}");'`);
    }

    // WOFF2 Conversion Methods
    async openTypeToWOFF2(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_compress "${inputPath}" "${outputPath}"`);
    }

    async woffToWOFF2(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_compress "${inputPath}" "${outputPath}"`);
    }

    async eotToWOFF2(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_compress "${inputPath}" "${outputPath}"`);
    }

    async svgToWOFF2(inputPath, outputPath, options = {}) {
        await execAsync(`fontforge -c 'Open("${inputPath}"); Generate("${outputPath}");'`);
    }

    // EOT Conversion Methods
    async openTypeToEOT(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async woffToEOT(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    async woff2ToEOT(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_decompress "${inputPath}" "${outputPath}"`);
    }

    async svgToEOT(inputPath, outputPath, options = {}) {
        await execAsync(`fontforge -c 'Open("${inputPath}"); Generate("${outputPath}");'`);
    }

    // SVG Conversion Methods
    async openTypeToSVG(inputPath, outputPath, options = {}) {
        await execAsync(`fontforge -c 'Open("${inputPath}"); Generate("${outputPath}");'`);
    }

    async woffToSVG(inputPath, outputPath, options = {}) {
        await execAsync(`fontforge -c 'Open("${inputPath}"); Generate("${outputPath}");'`);
    }

    async woff2ToSVG(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_decompress "${inputPath}" "${outputPath}"`);
    }

    async eotToSVG(inputPath, outputPath, options = {}) {
        await execAsync(`fontforge -c 'Open("${inputPath}"); Generate("${outputPath}");'`);
    }

    /**
     * Get file format from path
     */
    getFileFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        switch (ext) {
            case '.ttf': return 'ttf';
            case '.otf': return 'otf';
            case '.woff': return 'woff';
            case '.woff2': return 'woff2';
            case '.eot': return 'eot';
            case '.svg': return 'svg';
            default: return ext.substring(1);
        }
    }

    /**
     * Validate font file
     */
    async validateFont(fontPath) {
        try {
            const format = this.getFileFormat(fontPath);
            const stats = await fs.stat(fontPath);
            
            if (stats.size === 0) {
                return false;
            }

            // Basic format validation
            switch (format) {
                case 'ttf':
                case 'otf':
                    return await this.validateOpenType(fontPath);
                case 'woff':
                case 'woff2':
                    return await this.validateWOFF(fontPath);
                case 'eot':
                    return await this.validateEOT(fontPath);
                case 'svg':
                    return await this.validateSVG(fontPath);
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate OpenType font
     */
    async validateOpenType(fontPath) {
        try {
            await execAsync(`python -m fontTools.ttx -t head "${fontPath}"`);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate WOFF font
     */
    async validateWOFF(fontPath) {
        try {
            await execAsync(`python -m fontTools.ttx -t woff "${fontPath}"`);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate EOT font
     */
    async validateEOT(fontPath) {
        try {
            const buffer = await fs.readFile(fontPath);
            // Check for EOT signature
            return buffer.length > 4 && buffer[0] === 0x4C && buffer[1] === 0x50;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate SVG font
     */
    async validateSVG(fontPath) {
        try {
            const content = await fs.readFile(fontPath, 'utf8');
            return content.includes('<svg') || content.includes('<font');
        } catch (error) {
            return false;
        }
    }

    /**
     * Get font metadata
     */
    async getFontMetadata(fontPath) {
        try {
            const format = this.getFileFormat(fontPath);
            const info = await this.getFontInfo(fontPath);
            
            return {
                format,
                size: info.size,
                tables: info.tables,
                modified: info.modified,
                valid: await this.validateFont(fontPath)
            };
        } catch (error) {
            throw new Error(`Failed to get font metadata: ${error.message}`);
        }
    }

    /**
     * Optimize font file
     */
    async optimizeFont(inputPath, outputPath, options = {}) {
        try {
            const format = this.getFileFormat(inputPath);
            
            switch (format) {
                case 'ttf':
                case 'otf':
                    await this.optimizeOpenType(inputPath, outputPath, options);
                    break;
                case 'woff':
                    await this.optimizeWOFF(inputPath, outputPath, options);
                    break;
                case 'woff2':
                    await this.optimizeWOFF2(inputPath, outputPath, options);
                    break;
                default:
                    await fs.copyFile(inputPath, outputPath);
            }

            return { success: true, message: 'Font optimized successfully' };
        } catch (error) {
            throw new Error(`Font optimization failed: ${error.message}`);
        }
    }

    /**
     * Optimize OpenType font
     */
    async optimizeOpenType(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    /**
     * Optimize WOFF font
     */
    async optimizeWOFF(inputPath, outputPath, options = {}) {
        await execAsync(`python -m fontTools.ttx -o "${outputPath}" "${inputPath}"`);
    }

    /**
     * Optimize WOFF2 font
     */
    async optimizeWOFF2(inputPath, outputPath, options = {}) {
        await execAsync(`woff2_compress "${inputPath}" "${outputPath}"`);
    }
}

module.exports = FontConverter; 