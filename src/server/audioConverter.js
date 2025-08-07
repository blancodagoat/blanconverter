/**
 * Audio Converter Module
 * Handles audio file conversions using FFmpeg
 */

const path = require('path');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

class AudioConverter {
    constructor() {
        this.supportedFormats = {
            input: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'aiff'],
            output: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']
        };
    }

    /**
     * Convert audio to target format
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

            // Generate output filename
            const outputFilename = this.generateOutputFilename(inputPath, targetFormat);
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Get audio metadata
            const metadata = await this.getMetadata(inputPath);

            // Convert audio
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
                bitrate: outputMetadata.bitrate,
                sampleRate: outputMetadata.sampleRate,
                channels: outputMetadata.channels
            };

        } catch (error) {
            throw new Error(`Audio conversion failed: ${error.message}`);
        }
    }

    /**
     * Perform the actual audio conversion
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {string} targetFormat - Target format
     * @param {Object} options - Conversion options
     * @returns {Promise<void>}
     */
    performConversion(inputPath, outputPath, targetFormat, options = {}) {
        return new Promise((resolve, reject) => {
            const {
                bitrate = '128k',
                sampleRate = 44100,
                channels = 2,
                quality = 'high'
            } = options;

            let command = ffmpeg(inputPath);

            // Apply format-specific settings
            switch (targetFormat.toLowerCase()) {
                case 'mp3':
                    command = command
                        .audioCodec('libmp3lame')
                        .audioBitrate(bitrate)
                        .audioFrequency(sampleRate)
                        .audioChannels(channels);
                    break;

                case 'wav':
                    command = command
                        .audioCodec('pcm_s16le')
                        .audioFrequency(sampleRate)
                        .audioChannels(channels);
                    break;

                case 'flac':
                    command = command
                        .audioCodec('flac')
                        .audioFrequency(sampleRate)
                        .audioChannels(channels);
                    break;

                case 'aac':
                    command = command
                        .audioCodec('aac')
                        .audioBitrate(bitrate)
                        .audioFrequency(sampleRate)
                        .audioChannels(channels);
                    break;

                case 'ogg':
                    command = command
                        .audioCodec('libvorbis')
                        .audioBitrate(bitrate)
                        .audioFrequency(sampleRate)
                        .audioChannels(channels);
                    break;

                case 'm4a':
                    command = command
                        .audioCodec('aac')
                        .audioBitrate(bitrate)
                        .audioFrequency(sampleRate)
                        .audioChannels(channels)
                        .format('mp4'); // M4A is MP4 container with AAC audio
                    break;

                default:
                    reject(new Error(`Unsupported format: ${targetFormat}`));
                    return;
            }

            // Apply quality settings
            if (quality === 'high') {
                command = command.audioQuality(0);
            } else if (quality === 'medium') {
                command = command.audioQuality(5);
            } else if (quality === 'low') {
                command = command.audioQuality(10);
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
                    console.log(`Audio conversion progress: ${progress.percent}%`);
                })
                .run();
        });
    }

    /**
     * Get audio metadata
     * @param {string} filePath - Audio file path
     * @returns {Promise<Object>} - Audio metadata
     */
    getMetadata(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (error, metadata) => {
                if (error) {
                    reject(error);
                    return;
                }

                const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
                if (!audioStream) {
                    reject(new Error('No audio stream found'));
                    return;
                }

                resolve({
                    duration: metadata.format.duration,
                    bitrate: metadata.format.bit_rate,
                    sampleRate: audioStream.sample_rate,
                    channels: audioStream.channels,
                    codec: audioStream.codec_name,
                    format: metadata.format.format_name
                });
            });
        });
    }

    /**
     * Compress audio file
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {number} quality - Quality level (1-10)
     * @returns {Promise<Object>} - Conversion result
     */
    async compress(inputPath, targetFormat, quality = 5) {
        try {
            const options = {
                quality: quality <= 3 ? 'high' : quality <= 7 ? 'medium' : 'low',
                bitrate: quality <= 3 ? '192k' : quality <= 7 ? '128k' : '64k'
            };

            return await this.convert(inputPath, targetFormat, options);
        } catch (error) {
            throw new Error(`Audio compression failed: ${error.message}`);
        }
    }

    /**
     * Change audio bitrate
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {string} bitrate - Target bitrate (e.g., '128k', '256k')
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
     * Change audio sample rate
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {number} sampleRate - Target sample rate
     * @returns {Promise<Object>} - Conversion result
     */
    async changeSampleRate(inputPath, targetFormat, sampleRate) {
        try {
            const options = { sampleRate };
            return await this.convert(inputPath, targetFormat, options);
        } catch (error) {
            throw new Error(`Sample rate change failed: ${error.message}`);
        }
    }

    /**
     * Convert to mono or stereo
     * @param {string} inputPath - Input file path
     * @param {string} targetFormat - Target format
     * @param {number} channels - Number of channels (1 for mono, 2 for stereo)
     * @returns {Promise<Object>} - Conversion result
     */
    async changeChannels(inputPath, targetFormat, channels) {
        try {
            const options = { channels };
            return await this.convert(inputPath, targetFormat, options);
        } catch (error) {
            throw new Error(`Channel conversion failed: ${error.message}`);
        }
    }

    /**
     * Extract audio from video file
     * @param {string} videoPath - Video file path
     * @param {string} targetFormat - Target audio format
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} - Conversion result
     */
    async extractFromVideo(videoPath, targetFormat, options = {}) {
        try {
            // Generate output filename
            const outputFilename = this.generateOutputFilename(videoPath, targetFormat, 'audio');
            const outputPath = path.join(__dirname, '../../converted', outputFilename);

            // Extract audio from video
            await this.performConversion(videoPath, outputPath, targetFormat, options);

            // Get output file info
            const outputStats = await fs.stat(outputPath);
            const outputMetadata = await this.getMetadata(outputPath);

            return {
                filename: outputFilename,
                size: outputStats.size,
                mimeType: this.getMimeType(targetFormat),
                format: targetFormat.toLowerCase(),
                duration: outputMetadata.duration,
                bitrate: outputMetadata.bitrate,
                sampleRate: outputMetadata.sampleRate,
                channels: outputMetadata.channels
            };

        } catch (error) {
            throw new Error(`Audio extraction failed: ${error.message}`);
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
        
        return `audio-${baseName}-${timestamp}-${randomSuffix}${suffixPart}.${targetFormat.toLowerCase()}`;
    }

    /**
     * Get MIME type for format
     * @param {string} format - File format
     * @returns {string} - MIME type
     */
    getMimeType(format) {
        const mimeTypes = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'flac': 'audio/flac',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg',
            'm4a': 'audio/mp4',
            'wma': 'audio/x-ms-wma',
            'aiff': 'audio/aiff'
        };

        return mimeTypes[format.toLowerCase()] || 'audio/mpeg';
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

module.exports = AudioConverter; 