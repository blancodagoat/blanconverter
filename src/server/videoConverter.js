/**
 * Video Converter Module
 * Handles video file conversions using FFmpeg
 */

const path = require('path');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

class VideoConverter {
    constructor() {
        this.supportedFormats = {
            input: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv', '3gp'],
            output: ['mp4', 'avi', 'mov', 'mkv', 'webm']
        };
    }

    /**
     * Convert video to target format
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

            // Check if trimming is requested
            if (options.startTime !== undefined && options.duration !== undefined) {
                return await this.trim(inputPath, targetFormat, options.startTime, options.duration, options);
            }

            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat);
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Get video metadata
            const metadata = await this.getMetadata(inputPath);

            // Convert video
            await this.performConversion(inputPath, outputPath, targetFormat, options);

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputMetadata = await this.getMetadata(outputPath);

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                format: targetFormat.toLowerCase(),
                duration: outputMetadata.duration,
                width: outputMetadata.width,
                height: outputMetadata.height,
                fps: outputMetadata.fps,
                bitrate: outputMetadata.bitrate
            };

        } catch (error) {
            throw new Error(`Video conversion failed: ${error.message}`);
        }
    }

    /**
     * Perform the actual video conversion
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {string} targetFormat - Target format
     * @param {Object} options - Conversion options
     * @returns {Promise<void>}
     */
    performConversion(inputPath, outputPath, targetFormat, options = {}) {
        return new Promise((resolve, reject) => {
            const {
                width,
                height,
                fps = 30,
                bitrate = '1000k',
                audioBitrate = '128k',
                quality = 'high',
                audioCodec = 'aac',
                videoCodec = 'libx264'
            } = options;

            let command = ffmpeg(inputPath);

            // Apply video codec settings
            switch (targetFormat.toLowerCase()) {
                case 'mp4':
                    command = command
                        .videoCodec(videoCodec)
                        .audioCodec(audioCodec);
                    break;

                case 'avi':
                    command = command
                        .videoCodec('libx264')
                        .audioCodec('mp3');
                    break;

                case 'mov':
                    command = command
                        .videoCodec(videoCodec)
                        .audioCodec(audioCodec);
                    break;

                case 'mkv':
                    command = command
                        .videoCodec(videoCodec)
                        .audioCodec(audioCodec);
                    break;

                case 'webm':
                    command = command
                        .videoCodec('libvpx-vp9')
                        .audioCodec('libvorbis');
                    break;

                default:
                    reject(new Error(`Unsupported target format: ${targetFormat}`));
                    return;
            }

            // Apply quality settings
            if (quality === 'high') {
                command = command.videoBitrate(bitrate).audioBitrate(audioBitrate);
            } else if (quality === 'medium') {
                command = command.videoBitrate(Math.floor(parseInt(bitrate) * 0.7) + 'k').audioBitrate(Math.floor(parseInt(audioBitrate) * 0.7) + 'k');
            } else if (quality === 'low') {
                command = command.videoBitrate(Math.floor(parseInt(bitrate) * 0.5) + 'k').audioBitrate(Math.floor(parseInt(audioBitrate) * 0.5) + 'k');
            }

            // Apply frame rate
            command = command.fps(fps);

            // Apply resolution if specified
            if (width && height) {
                command = command.size(`${width}x${height}`);
            }

            command
                .output(outputPath)
                .on('end', () => {
                    resolve();
                })
                .on('error', (error) => {
                    reject(error);
                })
                .on('progress', (progress) => {
                    // Log progress if needed
                    console.log(`Video conversion progress: ${progress.percent}%`);
                })
                .run();
        });
    }

    /**
     * Get video metadata
     * @param {string} filePath - Video file path
     * @returns {Promise<Object>} - Video metadata
     */
    getMetadata(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (error, metadata) => {
                if (error) {
                    reject(error);
                    return;
                }

                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

                if (!videoStream) {
                    reject(new Error('No video stream found'));
                    return;
                }

                resolve({
                    duration: metadata.format.duration,
                    bitrate: metadata.format.bit_rate,
                    width: videoStream.width,
                    height: videoStream.height,
                    fps: eval(videoStream.r_frame_rate), // Convert fraction to number
                    videoCodec: videoStream.codec_name,
                    audioCodec: audioStream ? audioStream.codec_name : null,
                    format: metadata.format.format_name
                });
            });
        });
    }

    /**
     * Compress video file
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {number} quality - Quality level (1-10)
     * @returns {Promise<Object>} - Conversion result
     */
    async compress(inputPath, targetFormat, quality = 5) {
        try {
            const options = {
                quality: quality <= 3 ? 'high' : quality <= 7 ? 'medium' : 'low',
                bitrate: quality <= 3 ? '2000k' : quality <= 7 ? '1000k' : '500k',
                audioBitrate: quality <= 3 ? '192k' : quality <= 7 ? '128k' : '64k'
            };

            return await this.convert(inputPath, targetFormat, options);
        } catch (error) {
            throw new Error(`Video compression failed: ${error.message}`);
        }
    }

    /**
     * Resize video
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {number} width - Target width
     * @param {number} height - Target height
     * @returns {Promise<Object>} - Conversion result
     */
    async resize(inputPath, targetFormat, width, height) {
        try {
            const options = { width, height };
            return await this.convert(inputPath, targetFormat, options);
        } catch (error) {
            throw new Error(`Video resize failed: ${error.message}`);
        }
    }

    /**
     * Change video bitrate
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {string} bitrate - Target bitrate (e.g., '1000k', '2000k')
     * @returns {Promise<Object>} - Conversion result
     */
    async changeBitrate(inputPath, targetFormat, bitrate) {
        try {
            const options = { bitrate };
            return await this.convert(inputPath, targetFormat, options);
        } catch (error) {
            throw new Error(`Bitrate change failed: ${error.message}`);
        }
    }

    /**
     * Change video frame rate
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {number} fps - Target frame rate
     * @returns {Promise<Object>} - Conversion result
     */
    async changeFps(inputPath, targetFormat, fps) {
        try {
            const options = { fps };
            return await this.convert(inputPath, targetFormat, options);
        } catch (error) {
            throw new Error(`Frame rate change failed: ${error.message}`);
        }
    }

    /**
     * Trim video to specific time range
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {number} startTime - Start time in seconds
     * @param {number} duration - Duration in seconds
     * @param {Object} options - Additional conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async trim(inputPath, targetFormat, startTime, duration, options = {}) {
        try {
            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat, 'trimmed');
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Get video metadata
            const metadata = await this.getMetadata(inputPath);

            // Validate trim parameters
            if (startTime < 0 || duration <= 0) {
                throw new Error('Invalid trim parameters: startTime must be >= 0 and duration must be > 0');
            }

            if (startTime + duration > metadata.duration) {
                throw new Error('Trim duration exceeds video length');
            }

            // Perform trim conversion
            await this.performTrimConversion(inputPath, outputPath, targetFormat, startTime, duration, options);

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputMetadata = await this.getMetadata(outputPath);

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                format: targetFormat.toLowerCase(),
                duration: outputMetadata.duration,
                width: outputMetadata.width,
                height: outputMetadata.height,
                fps: outputMetadata.fps,
                bitrate: outputMetadata.bitrate,
                trimInfo: {
                    startTime,
                    duration,
                    originalDuration: metadata.duration
                }
            };

        } catch (error) {
            throw new Error(`Video trim failed: ${error.message}`);
        }
    }

    /**
     * Perform video trim conversion
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {string} targetFormat - Target format
     * @param {number} startTime - Start time in seconds
     * @param {number} duration - Duration in seconds
     * @param {Object} options - Conversion options
     * @returns {Promise<void>}
     */
    performTrimConversion(inputPath, outputPath, targetFormat, startTime, duration, options = {}) {
        return new Promise((resolve, reject) => {
            const {
                width,
                height,
                fps = 30,
                bitrate = '1000k',
                audioBitrate = '128k',
                quality = 'high',
                audioCodec = 'aac',
                videoCodec = 'libx264'
            } = options;

            let command = ffmpeg(inputPath)
                .seekInput(startTime)
                .duration(duration);

            // Apply format-specific settings
            switch (targetFormat.toLowerCase()) {
                case 'mp4':
                    command = command
                        .videoCodec(videoCodec)
                        .audioCodec(audioCodec)
                        .videoBitrate(bitrate)
                        .audioBitrate(audioBitrate)
                        .fps(fps);
                    break;

                case 'avi':
                    command = command
                        .videoCodec('libxvid')
                        .audioCodec('mp3')
                        .videoBitrate(bitrate)
                        .audioBitrate(audioBitrate)
                        .fps(fps);
                    break;

                case 'mov':
                    command = command
                        .videoCodec('libx264')
                        .audioCodec('aac')
                        .videoBitrate(bitrate)
                        .audioBitrate(audioBitrate)
                        .fps(fps);
                    break;

                case 'mkv':
                    command = command
                        .videoCodec('libx264')
                        .audioCodec('aac')
                        .videoBitrate(bitrate)
                        .audioBitrate(audioBitrate)
                        .fps(fps);
                    break;

                case 'webm':
                    command = command
                        .videoCodec('libvpx-vp9')
                        .audioCodec('libvorbis')
                        .videoBitrate(bitrate)
                        .audioBitrate(audioBitrate)
                        .fps(fps);
                    break;

                default:
                    reject(new Error(`Unsupported format: ${targetFormat}`));
                    return;
            }

            // Apply resolution settings
            if (width && height) {
                command = command.size(`${width}x${height}`);
            }

            // Apply quality settings
            if (quality === 'high') {
                command = command.videoQuality(0);
            } else if (quality === 'medium') {
                command = command.videoQuality(5);
            } else if (quality === 'low') {
                command = command.videoQuality(10);
            }

            command
                .output(outputPath)
                .on('end', () => {
                    resolve();
                })
                .on('error', (error) => {
                    reject(error);
                })
                .on('progress', (progress) => {
                    // Log progress if needed
                    console.log(`Video trim progress: ${progress.percent}%`);
                })
                .run();
        });
    }

    /**
     * Extract video without audio
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async extractVideoOnly(inputPath, targetFormat, options = {}) {
        try {
            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat, 'video-only');
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Convert video without audio
            await this.performConversion(inputPath, outputPath, targetFormat, {
                ...options,
                audioCodec: 'none' // Remove audio
            });

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputMetadata = await this.getMetadata(outputPath);

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                format: targetFormat.toLowerCase(),
                duration: outputMetadata.duration,
                width: outputMetadata.width,
                height: outputMetadata.height,
                fps: outputMetadata.fps,
                bitrate: outputMetadata.bitrate
            };

        } catch (error) {
            throw new Error(`Video extraction failed: ${error.message}`);
        }
    }

    /**
     * Create video thumbnail
     * @param {string} inputPath - Input file path
     * @param {number} time - Time in seconds to extract thumbnail
     * @param {number} width - Thumbnail width
     * @param {number} height - Thumbnail height
     * @returns {Promise<Object>} - Thumbnail result
     */
    async createThumbnail(inputPath, time = 5, width = 320, height = 240) {
        return new Promise((resolve, reject) => {
            const outputFilename = this.generateOutputFilename(inputPath, 'jpg', 'thumbnail');
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            ffmpeg(inputPath)
                .seekInput(time)
                .frames(1)
                .size(`${width}x${height}`)
                .output(outputPath)
                .on('end', async () => {
                    try {
                        const stats = await fs.stat(outputPath);
                        resolve({
                            filename: outputFilename,
                            size: stats.size,
                            mimeType: 'image/jpeg',
                            format: 'jpg',
                            width,
                            height,
                            time
                        });
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    reject(error);
                })
                .run();
        });
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
        
        return `video-${baseName}-${timestamp}-${randomSuffix}${suffixPart}.${targetFormat.toLowerCase()}`;
    }

    /**
     * Get MIME type for format
     * @param {string} format - File format
     * @returns {string} - MIME type
     */
    getMimeType(format) {
        const mimeTypes = {
            'mp4': 'video/mp4',
            'avi': 'video/avi',
            'mov': 'video/quicktime',
            'mkv': 'video/x-matroska',
            'webm': 'video/webm',
            'flv': 'video/x-flv',
            'wmv': 'video/x-ms-wmv',
            '3gp': 'video/3gpp'
        };

        return mimeTypes[format.toLowerCase()] || 'video/mp4';
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
}

module.exports = VideoConverter; 