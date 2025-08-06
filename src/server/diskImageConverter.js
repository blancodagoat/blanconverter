/**
 * Disk Image Converter
 * Handles disk image format conversions
 * Supports: ISO ↔ BIN / IMG, DMG ↔ ISO
 */
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DiskImageConverter {
    constructor() {
        this.supportedFormats = {
            input: ['iso', 'bin', 'img', 'dmg'],
            output: ['iso', 'bin', 'img', 'dmg']
        };
        
        this.mimeTypes = {
            'iso': 'application/x-iso9660-image',
            'bin': 'application/octet-stream',
            'img': 'application/octet-stream',
            'dmg': 'application/x-apple-diskimage'
        };
        
        this.conversionMatrix = {
            'iso': ['bin', 'img', 'dmg'],
            'bin': ['iso', 'img', 'dmg'],
            'img': ['iso', 'bin', 'dmg'],
            'dmg': ['iso', 'bin', 'img']
        };
        
        this.requiredTools = {
            'dd': 'dd (disk dump) - for binary conversions',
            'hdiutil': 'hdiutil (macOS) - for DMG operations',
            'xorriso': 'xorriso - for ISO operations',
            'isoinfo': 'isoinfo - for ISO information',
            'file': 'file - for format detection'
        };
    }

    getSupportedFormats() {
        return this.supportedFormats;
    }

    getMimeType(format) {
        return this.mimeTypes[format.toLowerCase()] || 'application/octet-stream';
    }

    getAvailableOutputFormats(inputFormat) {
        return this.conversionMatrix[inputFormat.toLowerCase()] || [];
    }

    async convert(inputPath, outputPath, targetFormat, options = {}) {
        try {
            const inputFormat = this.getFileFormat(inputPath);
            const outputFormat = targetFormat.toLowerCase();
            
            console.log(`Converting disk image from ${inputFormat} to ${outputFormat}`);
            
            if (!this.supportedFormats.input.includes(inputFormat)) {
                throw new Error(`Unsupported input format: ${inputFormat}`);
            }
            
            if (!this.supportedFormats.output.includes(outputFormat)) {
                throw new Error(`Unsupported output format: ${outputFormat}`);
            }
            
            const availableFormats = this.getAvailableOutputFormats(inputFormat);
            if (!availableFormats.includes(outputFormat)) {
                throw new Error(`Conversion from ${inputFormat} to ${outputFormat} is not supported`);
            }

            // Validate input file
            await this.validateDiskImage(inputPath, inputFormat);
            
            // Perform conversion
            const result = await this.performConversion(inputPath, outputPath, inputFormat, outputFormat, options);
            
            // Validate output file
            await this.validateDiskImage(outputPath, outputFormat);
            
            // Get file stats
            const stats = await fs.stat(outputPath);
            
            return {
                success: true,
                message: `Successfully converted from ${inputFormat} to ${outputFormat}`,
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: this.getMimeType(outputFormat),
                metadata: await this.getDiskImageMetadata(outputPath, outputFormat)
            };
            
        } catch (error) {
            console.error('Disk image conversion error:', error);
            throw new Error(`Disk image conversion failed: ${error.message}`);
        }
    }

    async performConversion(inputPath, outputPath, inputFormat, outputFormat, options = {}) {
        try {
            // Handle same format (copy operation)
            if (inputFormat === outputFormat) {
                await fs.copyFile(inputPath, outputPath);
                return;
            }

            // Handle ISO conversions
            if (inputFormat === 'iso') {
                if (outputFormat === 'bin' || outputFormat === 'img') {
                    return await this.convertIsoToBinary(inputPath, outputPath, options);
                } else if (outputFormat === 'dmg') {
                    return await this.convertIsoToDmg(inputPath, outputPath, options);
                }
            }

            // Handle BIN/IMG conversions
            if (inputFormat === 'bin' || inputFormat === 'img') {
                if (outputFormat === 'iso') {
                    return await this.convertBinaryToIso(inputPath, outputPath, options);
                } else if (outputFormat === 'dmg') {
                    return await this.convertBinaryToDmg(inputPath, outputPath, options);
                }
            }

            // Handle DMG conversions
            if (inputFormat === 'dmg') {
                if (outputFormat === 'iso') {
                    return await this.convertDmgToIso(inputPath, outputPath, options);
                } else if (outputFormat === 'bin' || outputFormat === 'img') {
                    return await this.convertDmgToBinary(inputPath, outputPath, options);
                }
            }

            throw new Error(`Conversion from ${inputFormat} to ${outputFormat} not implemented`);
            
        } catch (error) {
            throw new Error(`Conversion failed: ${error.message}`);
        }
    }

    async convertIsoToBinary(inputPath, outputPath, options = {}) {
        try {
            // Use dd to convert ISO to binary format
            const blockSize = options.blockSize || '1M';
            const command = `dd if="${inputPath}" of="${outputPath}" bs=${blockSize} conv=notrunc`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('records in') && !stderr.includes('records out')) {
                throw new Error(`dd conversion failed: ${stderr}`);
            }
            
            console.log('ISO to binary conversion completed');
            return { success: true };
            
        } catch (error) {
            throw new Error(`ISO to binary conversion failed: ${error.message}`);
        }
    }

    async convertBinaryToIso(inputPath, outputPath, options = {}) {
        try {
            // Use xorriso to create ISO from binary data
            const volumeName = options.volumeName || 'DISK_IMAGE';
            const command = `xorriso -as mkisofs -o "${outputPath}" -V "${volumeName}" -r "${inputPath}"`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('xorriso')) {
                throw new Error(`xorriso conversion failed: ${stderr}`);
            }
            
            console.log('Binary to ISO conversion completed');
            return { success: true };
            
        } catch (error) {
            // Fallback to dd if xorriso fails
            try {
                const blockSize = options.blockSize || '1M';
                const command = `dd if="${inputPath}" of="${outputPath}" bs=${blockSize} conv=notrunc`;
                
                const { stdout, stderr } = await execAsync(command);
                
                if (stderr && !stderr.includes('records in') && !stderr.includes('records out')) {
                    throw new Error(`dd fallback failed: ${stderr}`);
                }
                
                console.log('Binary to ISO conversion completed (dd fallback)');
                return { success: true };
                
            } catch (fallbackError) {
                throw new Error(`Binary to ISO conversion failed: ${error.message}, fallback failed: ${fallbackError.message}`);
            }
        }
    }

    async convertIsoToDmg(inputPath, outputPath, options = {}) {
        try {
            // Check if we're on macOS (hdiutil is macOS-specific)
            const platform = process.platform;
            if (platform !== 'darwin') {
                throw new Error('DMG conversion requires macOS with hdiutil');
            }

            // Use hdiutil to convert ISO to DMG
            const volumeName = options.volumeName || 'Disk Image';
            const command = `hdiutil convert "${inputPath}" -format UDZO -o "${outputPath}"`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('hdiutil')) {
                throw new Error(`hdiutil conversion failed: ${stderr}`);
            }
            
            console.log('ISO to DMG conversion completed');
            return { success: true };
            
        } catch (error) {
            throw new Error(`ISO to DMG conversion failed: ${error.message}`);
        }
    }

    async convertDmgToIso(inputPath, outputPath, options = {}) {
        try {
            // Check if we're on macOS
            const platform = process.platform;
            if (platform !== 'darwin') {
                throw new Error('DMG to ISO conversion requires macOS with hdiutil');
            }

            // Use hdiutil to convert DMG to ISO
            const command = `hdiutil convert "${inputPath}" -format UDTO -o "${outputPath}"`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('hdiutil')) {
                throw new Error(`hdiutil conversion failed: ${stderr}`);
            }
            
            console.log('DMG to ISO conversion completed');
            return { success: true };
            
        } catch (error) {
            throw new Error(`DMG to ISO conversion failed: ${error.message}`);
        }
    }

    async convertBinaryToDmg(inputPath, outputPath, options = {}) {
        try {
            // Check if we're on macOS
            const platform = process.platform;
            if (platform !== 'darwin') {
                throw new Error('DMG creation requires macOS with hdiutil');
            }

            // First convert binary to ISO, then to DMG
            const tempIsoPath = outputPath.replace('.dmg', '_temp.iso');
            
            try {
                await this.convertBinaryToIso(inputPath, tempIsoPath, options);
                await this.convertIsoToDmg(tempIsoPath, outputPath, options);
                
                // Clean up temp file
                await fs.unlink(tempIsoPath);
                
                console.log('Binary to DMG conversion completed');
                return { success: true };
                
            } catch (conversionError) {
                // Clean up temp file on error
                try {
                    await fs.unlink(tempIsoPath);
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }
                throw conversionError;
            }
            
        } catch (error) {
            throw new Error(`Binary to DMG conversion failed: ${error.message}`);
        }
    }

    async convertDmgToBinary(inputPath, outputPath, options = {}) {
        try {
            // Check if we're on macOS
            const platform = process.platform;
            if (platform !== 'darwin') {
                throw new Error('DMG to binary conversion requires macOS with hdiutil');
            }

            // First convert DMG to ISO, then to binary
            const tempIsoPath = outputPath.replace('.bin', '_temp.iso').replace('.img', '_temp.iso');
            
            try {
                await this.convertDmgToIso(inputPath, tempIsoPath, options);
                await this.convertIsoToBinary(tempIsoPath, outputPath, options);
                
                // Clean up temp file
                await fs.unlink(tempIsoPath);
                
                console.log('DMG to binary conversion completed');
                return { success: true };
                
            } catch (conversionError) {
                // Clean up temp file on error
                try {
                    await fs.unlink(tempIsoPath);
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }
                throw conversionError;
            }
            
        } catch (error) {
            throw new Error(`DMG to binary conversion failed: ${error.message}`);
        }
    }

    async validateDiskImage(filePath, format) {
        try {
            const stats = await fs.stat(filePath);
            
            if (stats.size === 0) {
                throw new Error('Disk image file is empty');
            }
            
            // Check minimum size for different formats
            const minSizes = {
                'iso': 2048, // Minimum ISO size
                'bin': 512,  // Minimum binary size
                'img': 512,  // Minimum image size
                'dmg': 1024  // Minimum DMG size
            };
            
            if (stats.size < minSizes[format]) {
                throw new Error(`Disk image file too small for ${format} format`);
            }
            
            // Use file command to detect format
            try {
                const { stdout } = await execAsync(`file "${filePath}"`);
                
                const expectedPatterns = {
                    'iso': /ISO 9660|CD-ROM|CD-R|DVD|optical/i,
                    'bin': /data|binary|executable/i,
                    'img': /data|binary|disk image/i,
                    'dmg': /Apple Disk Image|DMG/i
                };
                
                const pattern = expectedPatterns[format];
                if (pattern && !pattern.test(stdout)) {
                    console.warn(`Warning: File format detection doesn't match expected ${format} format: ${stdout}`);
                }
                
            } catch (fileError) {
                console.warn(`Warning: Could not verify file format: ${fileError.message}`);
            }
            
            return true;
            
        } catch (error) {
            throw new Error(`Disk image validation failed: ${error.message}`);
        }
    }

    async getDiskImageMetadata(filePath, format) {
        try {
            const stats = await fs.stat(filePath);
            
            const metadata = {
                format: format,
                size: stats.size,
                sizeFormatted: this.formatFileSize(stats.size),
                created: stats.birthtime,
                modified: stats.mtime,
                mimeType: this.getMimeType(format)
            };
            
            // Get additional format-specific metadata
            if (format === 'iso') {
                metadata.isoInfo = await this.getIsoMetadata(filePath);
            } else if (format === 'dmg') {
                metadata.dmgInfo = await this.getDmgMetadata(filePath);
            }
            
            return metadata;
            
        } catch (error) {
            console.warn(`Could not get disk image metadata: ${error.message}`);
            return {
                format: format,
                size: 0,
                sizeFormatted: 'Unknown',
                error: error.message
            };
        }
    }

    async getIsoMetadata(filePath) {
        try {
            const { stdout } = await execAsync(`isoinfo -d -i "${filePath}"`);
            
            const metadata = {
                volumeId: '',
                systemId: '',
                publisher: '',
                dataPreparer: '',
                application: '',
                copyright: '',
                abstract: '',
                bibliographic: '',
                creationDate: '',
                modificationDate: '',
                expirationDate: '',
                effectiveDate: ''
            };
            
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes('Volume id:')) {
                    metadata.volumeId = line.split(':')[1]?.trim() || '';
                } else if (line.includes('System id:')) {
                    metadata.systemId = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Publisher id:')) {
                    metadata.publisher = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Data preparer id:')) {
                    metadata.dataPreparer = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Application id:')) {
                    metadata.application = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Copyright File id:')) {
                    metadata.copyright = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Abstract File id:')) {
                    metadata.abstract = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Bibliographic File id:')) {
                    metadata.bibliographic = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Creation Date:')) {
                    metadata.creationDate = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Modification Date:')) {
                    metadata.modificationDate = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Expiration Date:')) {
                    metadata.expirationDate = line.split(':')[1]?.trim() || '';
                } else if (line.includes('Effective Date:')) {
                    metadata.effectiveDate = line.split(':')[1]?.trim() || '';
                }
            }
            
            return metadata;
            
        } catch (error) {
            console.warn(`Could not get ISO metadata: ${error.message}`);
            return {};
        }
    }

    async getDmgMetadata(filePath) {
        try {
            // Check if we're on macOS
            const platform = process.platform;
            if (platform !== 'darwin') {
                return { error: 'DMG metadata requires macOS' };
            }

            const { stdout } = await execAsync(`hdiutil info "${filePath}"`);
            
            const metadata = {
                format: '',
                encryption: '',
                partitionScheme: '',
                partitionCount: 0,
                totalSize: '',
                freeSpace: '',
                mountPoints: []
            };
            
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes('format:')) {
                    metadata.format = line.split(':')[1]?.trim() || '';
                } else if (line.includes('encryption:')) {
                    metadata.encryption = line.split(':')[1]?.trim() || '';
                } else if (line.includes('partition-scheme:')) {
                    metadata.partitionScheme = line.split(':')[1]?.trim() || '';
                } else if (line.includes('partition-count:')) {
                    metadata.partitionCount = parseInt(line.split(':')[1]?.trim() || '0');
                } else if (line.includes('total-size:')) {
                    metadata.totalSize = line.split(':')[1]?.trim() || '';
                } else if (line.includes('free-space:')) {
                    metadata.freeSpace = line.split(':')[1]?.trim() || '';
                } else if (line.includes('mount-point:')) {
                    const mountPoint = line.split(':')[1]?.trim() || '';
                    if (mountPoint) {
                        metadata.mountPoints.push(mountPoint);
                    }
                }
            }
            
            return metadata;
            
        } catch (error) {
            console.warn(`Could not get DMG metadata: ${error.message}`);
            return { error: error.message };
        }
    }

    getFileFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase().substring(1);
        
        // Handle special cases
        if (ext === 'iso') return 'iso';
        if (ext === 'bin') return 'bin';
        if (ext === 'img') return 'img';
        if (ext === 'dmg') return 'dmg';
        
        // Try to detect from file content
        return this.detectFormatFromContent(filePath);
    }

    async detectFormatFromContent(filePath) {
        try {
            const { stdout } = await execAsync(`file "${filePath}"`);
            
            if (stdout.includes('ISO 9660') || stdout.includes('CD-ROM')) {
                return 'iso';
            } else if (stdout.includes('Apple Disk Image') || stdout.includes('DMG')) {
                return 'dmg';
            } else if (stdout.includes('data') || stdout.includes('binary')) {
                return 'bin';
            } else {
                return 'img'; // Default to img for unknown binary formats
            }
            
        } catch (error) {
            console.warn(`Could not detect format from content: ${error.message}`);
            return 'bin'; // Default fallback
        }
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    async checkRequiredTools() {
        const tools = ['dd', 'file'];
        const missingTools = [];
        
        for (const tool of tools) {
            try {
                await execAsync(`which ${tool}`);
            } catch (error) {
                missingTools.push(tool);
            }
        }
        
        // Check platform-specific tools
        if (process.platform === 'darwin') {
            try {
                await execAsync('which hdiutil');
            } catch (error) {
                missingTools.push('hdiutil (macOS only)');
            }
        }
        
        try {
            await execAsync('which xorriso');
        } catch (error) {
            try {
                await execAsync('which mkisofs');
            } catch (error) {
                missingTools.push('xorriso or mkisofs');
            }
        }
        
        return {
            available: missingTools.length === 0,
            missing: missingTools
        };
    }

    async cleanupDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isDirectory()) {
                    await this.cleanupDirectory(filePath);
                    await fs.rmdir(filePath);
                } else {
                    await fs.unlink(filePath);
                }
            }
        } catch (error) {
            console.warn(`Cleanup warning: ${error.message}`);
        }
    }
}

module.exports = DiskImageConverter; 