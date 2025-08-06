/**
 * Archive Converter
 * Handles archive/compression file conversions
 * Supports: RAR ↔ ZIP, TAR ↔ ZIP/7Z, multi-format extraction/compression
 */

const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');
const tar = require('tar');
const Seven = require('node-7z');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ArchiveConverter {
    constructor() {
        this.supportedFormats = {
            input: ['zip', 'rar', 'tar', 'tar.gz', 'tar.bz2', '7z', 'gz', 'bz2'],
            output: ['zip', 'tar', 'tar.gz', 'tar.bz2', '7z']
        };
        
        this.mimeTypes = {
            'zip': 'application/zip',
            'rar': 'application/vnd.rar',
            'tar': 'application/x-tar',
            'tar.gz': 'application/gzip',
            'tar.bz2': 'application/x-bzip2',
            '7z': 'application/x-7z-compressed',
            'gz': 'application/gzip',
            'bz2': 'application/x-bzip2'
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
     * Convert archive file
     */
    async convert(inputPath, outputPath, targetFormat, options = {}) {
        try {
            const inputFormat = this.getFileFormat(inputPath);
            const outputFormat = targetFormat.toLowerCase();

            console.log(`Converting archive from ${inputFormat} to ${outputFormat}`);

            // Validate formats
            if (!this.supportedFormats.input.includes(inputFormat)) {
                throw new Error(`Unsupported input format: ${inputFormat}`);
            }
            if (!this.supportedFormats.output.includes(outputFormat)) {
                throw new Error(`Unsupported output format: ${outputFormat}`);
            }

            // Handle different conversion scenarios
            if (inputFormat === outputFormat) {
                // Same format - just copy
                await fs.copyFile(inputPath, outputPath);
                return { success: true, message: 'File copied (same format)' };
            }

            // Extract and re-compress
            const tempDir = path.join(path.dirname(outputPath), `temp_${Date.now()}`);
            await fs.mkdir(tempDir, { recursive: true });

            try {
                // Extract source archive
                await this.extractArchive(inputPath, tempDir);

                // Compress to target format
                await this.compressToFormat(tempDir, outputPath, outputFormat, options);

                return { 
                    success: true, 
                    message: `Successfully converted from ${inputFormat} to ${outputFormat}`,
                    outputPath 
                };
            } finally {
                // Cleanup temp directory
                await this.cleanupDirectory(tempDir);
            }

        } catch (error) {
            console.error('Archive conversion error:', error);
            throw new Error(`Archive conversion failed: ${error.message}`);
        }
    }

    /**
     * Extract archive to directory
     */
    async extractArchive(archivePath, extractDir) {
        const format = this.getFileFormat(archivePath);
        
        try {
            switch (format) {
                case 'zip':
                    await this.extractZip(archivePath, extractDir);
                    break;
                case 'rar':
                    await this.extractRar(archivePath, extractDir);
                    break;
                case 'tar':
                case 'tar.gz':
                case 'tar.bz2':
                    await this.extractTar(archivePath, extractDir);
                    break;
                case '7z':
                    await this.extract7z(archivePath, extractDir);
                    break;
                case 'gz':
                    await this.extractGz(archivePath, extractDir);
                    break;
                case 'bz2':
                    await this.extractBz2(archivePath, extractDir);
                    break;
                default:
                    throw new Error(`Unsupported archive format for extraction: ${format}`);
            }
        } catch (error) {
            throw new Error(`Failed to extract ${format} archive: ${error.message}`);
        }
    }

    /**
     * Extract ZIP archive
     */
    async extractZip(archivePath, extractDir) {
        return new Promise((resolve, reject) => {
            fs.createReadStream(archivePath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .on('close', () => resolve())
                .on('error', (error) => reject(error));
        });
    }

    /**
     * Extract RAR archive
     */
    async extractRar(archivePath, extractDir) {
        try {
            // Try using unrar-js first
            const unrar = require('unrar-js');
            const buffer = await fs.readFile(archivePath);
            const extracted = unrar.extract(buffer);
            
            for (const [filename, content] of Object.entries(extracted)) {
                const filePath = path.join(extractDir, filename);
                const dirPath = path.dirname(filePath);
                await fs.mkdir(dirPath, { recursive: true });
                await fs.writeFile(filePath, content);
            }
        } catch (error) {
            // Fallback to system unrar command
            try {
                await execAsync(`unrar x "${archivePath}" "${extractDir}" -y`);
            } catch (cmdError) {
                throw new Error('RAR extraction failed. Please ensure unrar is installed on the system.');
            }
        }
    }

    /**
     * Extract TAR archive
     */
    async extractTar(archivePath, extractDir) {
        return tar.extract({
            file: archivePath,
            cwd: extractDir
        });
    }

    /**
     * Extract 7Z archive
     */
    async extract7z(archivePath, extractDir) {
        return new Promise((resolve, reject) => {
            Seven.extract(archivePath, extractDir, {
                $bin: require('7zip-bin').path7za
            })
            .on('end', () => resolve())
            .on('error', (error) => reject(error));
        });
    }

    /**
     * Extract GZ archive
     */
    async extractGz(archivePath, extractDir) {
        const zlib = require('zlib');
        const gunzip = zlib.createGunzip();
        const outputPath = path.join(extractDir, path.basename(archivePath, '.gz'));
        
        return new Promise((resolve, reject) => {
            fs.createReadStream(archivePath)
                .pipe(gunzip)
                .pipe(fs.createWriteStream(outputPath))
                .on('finish', () => resolve())
                .on('error', (error) => reject(error));
        });
    }

    /**
     * Extract BZ2 archive
     */
    async extractBz2(archivePath, extractDir) {
        const bz2 = require('unbzip2-stream');
        const outputPath = path.join(extractDir, path.basename(archivePath, '.bz2'));
        
        return new Promise((resolve, reject) => {
            fs.createReadStream(archivePath)
                .pipe(bz2())
                .pipe(fs.createWriteStream(outputPath))
                .on('finish', () => resolve())
                .on('error', (error) => reject(error));
        });
    }

    /**
     * Compress directory to target format
     */
    async compressToFormat(sourceDir, outputPath, format, options = {}) {
        try {
            switch (format) {
                case 'zip':
                    await this.compressToZip(sourceDir, outputPath, options);
                    break;
                case 'tar':
                    await this.compressToTar(sourceDir, outputPath, options);
                    break;
                case 'tar.gz':
                    await this.compressToTarGz(sourceDir, outputPath, options);
                    break;
                case 'tar.bz2':
                    await this.compressToTarBz2(sourceDir, outputPath, options);
                    break;
                case '7z':
                    await this.compressTo7z(sourceDir, outputPath, options);
                    break;
                default:
                    throw new Error(`Unsupported output format: ${format}`);
            }
        } catch (error) {
            throw new Error(`Failed to compress to ${format}: ${error.message}`);
        }
    }

    /**
     * Compress to ZIP
     */
    async compressToZip(sourceDir, outputPath, options = {}) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: options.compressionLevel || 6 }
            });

            output.on('close', () => resolve());
            archive.on('error', (error) => reject(error));

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    /**
     * Compress to TAR
     */
    async compressToTar(sourceDir, outputPath, options = {}) {
        return tar.create({
            file: outputPath,
            cwd: sourceDir,
            gzip: false
        }, ['.']);
    }

    /**
     * Compress to TAR.GZ
     */
    async compressToTarGz(sourceDir, outputPath, options = {}) {
        return tar.create({
            file: outputPath,
            cwd: sourceDir,
            gzip: true
        }, ['.']);
    }

    /**
     * Compress to TAR.BZ2
     */
    async compressToTarBz2(sourceDir, outputPath, options = {}) {
        const bz2 = require('bzip2');
        const tarStream = tar.create({
            cwd: sourceDir,
            gzip: false
        }, ['.']);

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            tarStream
                .pipe(bz2.createBzip2Compress())
                .pipe(output)
                .on('finish', () => resolve())
                .on('error', (error) => reject(error));
        });
    }

    /**
     * Compress to 7Z
     */
    async compressTo7z(sourceDir, outputPath, options = {}) {
        return new Promise((resolve, reject) => {
            Seven.add(outputPath, `${sourceDir}/*`, {
                $bin: require('7zip-bin').path7za,
                recursive: true,
                $progress: true
            })
            .on('end', () => resolve())
            .on('error', (error) => reject(error));
        });
    }

    /**
     * Get file format from path
     */
    getFileFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath).toLowerCase();
        
        // Handle double extensions
        if (basename.endsWith('.tar.gz')) return 'tar.gz';
        if (basename.endsWith('.tar.bz2')) return 'tar.bz2';
        
        // Handle single extensions
        switch (ext) {
            case '.zip': return 'zip';
            case '.rar': return 'rar';
            case '.tar': return 'tar';
            case '.gz': return 'gz';
            case '.bz2': return 'bz2';
            case '.7z': return '7z';
            default: return ext.substring(1); // Remove the dot
        }
    }

    /**
     * Get archive info
     */
    async getArchiveInfo(archivePath) {
        try {
            const format = this.getFileFormat(archivePath);
            const stats = await fs.stat(archivePath);
            
            let fileCount = 0;
            let totalSize = 0;
            
            switch (format) {
                case 'zip':
                    const zipInfo = await this.getZipInfo(archivePath);
                    fileCount = zipInfo.fileCount;
                    totalSize = zipInfo.totalSize;
                    break;
                case 'rar':
                    const rarInfo = await this.getRarInfo(archivePath);
                    fileCount = rarInfo.fileCount;
                    totalSize = rarInfo.totalSize;
                    break;
                case 'tar':
                case 'tar.gz':
                case 'tar.bz2':
                    const tarInfo = await this.getTarInfo(archivePath);
                    fileCount = tarInfo.fileCount;
                    totalSize = tarInfo.totalSize;
                    break;
                case '7z':
                    const sevenInfo = await this.get7zInfo(archivePath);
                    fileCount = sevenInfo.fileCount;
                    totalSize = sevenInfo.totalSize;
                    break;
            }
            
            return {
                format,
                size: stats.size,
                fileCount,
                totalSize,
                compressed: stats.size < totalSize,
                compressionRatio: totalSize > 0 ? ((totalSize - stats.size) / totalSize * 100).toFixed(2) : 0
            };
        } catch (error) {
            throw new Error(`Failed to get archive info: ${error.message}`);
        }
    }

    /**
     * Get ZIP archive info
     */
    async getZipInfo(archivePath) {
        return new Promise((resolve, reject) => {
            let fileCount = 0;
            let totalSize = 0;
            
            fs.createReadStream(archivePath)
                .pipe(unzipper.Parse())
                .on('entry', (entry) => {
                    fileCount++;
                    totalSize += entry.vars.uncompressedSize;
                    entry.autodrain();
                })
                .on('end', () => resolve({ fileCount, totalSize }))
                .on('error', (error) => reject(error));
        });
    }

    /**
     * Get RAR archive info
     */
    async getRarInfo(archivePath) {
        try {
            const unrar = require('unrar-js');
            const buffer = await fs.readFile(archivePath);
            const extracted = unrar.extract(buffer);
            
            let fileCount = 0;
            let totalSize = 0;
            
            for (const [filename, content] of Object.entries(extracted)) {
                fileCount++;
                totalSize += content.length;
            }
            
            return { fileCount, totalSize };
        } catch (error) {
            // Fallback to system command
            try {
                const { stdout } = await execAsync(`unrar l "${archivePath}"`);
                const lines = stdout.split('\n');
                let fileCount = 0;
                let totalSize = 0;
                
                for (const line of lines) {
                    if (line.trim() && !line.includes('Name') && !line.includes('----')) {
                        const parts = line.split(/\s+/);
                        if (parts.length >= 4) {
                            fileCount++;
                            totalSize += parseInt(parts[1]) || 0;
                        }
                    }
                }
                
                return { fileCount, totalSize };
            } catch (cmdError) {
                throw new Error('Failed to get RAR info');
            }
        }
    }

    /**
     * Get TAR archive info
     */
    async getTarInfo(archivePath) {
        return new Promise((resolve, reject) => {
            let fileCount = 0;
            let totalSize = 0;
            
            fs.createReadStream(archivePath)
                .pipe(tar.list())
                .on('entry', (entry) => {
                    if (entry.type === 'File') {
                        fileCount++;
                        totalSize += entry.size;
                    }
                })
                .on('end', () => resolve({ fileCount, totalSize }))
                .on('error', (error) => reject(error));
        });
    }

    /**
     * Get 7Z archive info
     */
    async get7zInfo(archivePath) {
        return new Promise((resolve, reject) => {
            let fileCount = 0;
            let totalSize = 0;
            
            Seven.list(archivePath, {
                $bin: require('7zip-bin').path7za
            })
            .on('data', (data) => {
                if (data.type === 'file') {
                    fileCount++;
                    totalSize += data.size;
                }
            })
            .on('end', () => resolve({ fileCount, totalSize }))
            .on('error', (error) => reject(error));
        });
    }

    /**
     * Clean up directory
     */
    async cleanupDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isDirectory()) {
                    await this.cleanupDirectory(filePath);
                } else {
                    await fs.unlink(filePath);
                }
            }
            await fs.rmdir(dirPath);
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }

    /**
     * Validate archive file
     */
    async validateArchive(archivePath) {
        try {
            const format = this.getFileFormat(archivePath);
            
            switch (format) {
                case 'zip':
                    return await this.validateZip(archivePath);
                case 'rar':
                    return await this.validateRar(archivePath);
                case 'tar':
                case 'tar.gz':
                case 'tar.bz2':
                    return await this.validateTar(archivePath);
                case '7z':
                    return await this.validate7z(archivePath);
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate ZIP archive
     */
    async validateZip(archivePath) {
        return new Promise((resolve) => {
            fs.createReadStream(archivePath)
                .pipe(unzipper.Parse())
                .on('entry', (entry) => {
                    entry.autodrain();
                })
                .on('end', () => resolve(true))
                .on('error', () => resolve(false));
        });
    }

    /**
     * Validate RAR archive
     */
    async validateRar(archivePath) {
        try {
            const unrar = require('unrar-js');
            const buffer = await fs.readFile(archivePath);
            unrar.extract(buffer);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate TAR archive
     */
    async validateTar(archivePath) {
        return new Promise((resolve) => {
            fs.createReadStream(archivePath)
                .pipe(tar.list())
                .on('entry', (entry) => {
                    // Just read the entry to validate
                })
                .on('end', () => resolve(true))
                .on('error', () => resolve(false));
        });
    }

    /**
     * Validate 7Z archive
     */
    async validate7z(archivePath) {
        return new Promise((resolve) => {
            Seven.list(archivePath, {
                $bin: require('7zip-bin').path7za
            })
            .on('data', (data) => {
                // Just read the data to validate
            })
            .on('end', () => resolve(true))
            .on('error', () => resolve(false));
        });
    }
}

module.exports = ArchiveConverter; 