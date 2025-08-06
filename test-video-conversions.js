/**
 * Test Script for Video Conversions
 * Verifies all requested video conversions are working
 */

const VideoConverter = require('./src/server/videoConverter');
const AudioConverter = require('./src/server/audioConverter');
const fs = require('fs').promises;
const path = require('path');

class VideoConversionTester {
    constructor() {
        this.videoConverter = new VideoConverter();
        this.audioConverter = new AudioConverter();
        this.testResults = [];
        this.testDir = './test-video-files';
    }

    async runAllTests() {
        console.log('🎬 Starting Video Conversion Tests...\n');
        await this.createTestDirectory();
        await this.testFormatConversions();
        await this.testVideoToAudioExtraction();
        await this.testVideoResizing();
        await this.testVideoTrimming();
        await this.testFrameRateAdjustments();
        this.generateReport();
    }

    async createTestDirectory() {
        try {
            await fs.mkdir(this.testDir, { recursive: true });
            console.log('✅ Test directory created');
        } catch (error) {
            console.log('ℹ️  Test directory already exists');
        }
    }

    async createSampleVideoFile(format = 'mp4') {
        const filename = `sample-video.${format}`;
        const filepath = path.join(this.testDir, filename);
        
        // Create a simple test video using FFmpeg
        const ffmpeg = require('fluent-ffmpeg');
        
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input('testsrc=duration=10:size=640x480:rate=30')
                .input('sine=frequency=1000:duration=10')
                .outputOptions([
                    '-c:v libx264',
                    '-c:a aac',
                    '-t 10'
                ])
                .output(filepath)
                .on('end', () => resolve(filepath))
                .on('error', (error) => reject(error))
                .run();
        });
    }

    async testFormatConversions() {
        console.log('\n📹 Testing Video Format Conversions...');
        
        const formats = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
        const sourceFormat = 'mp4';
        
        try {
            const sourceFile = await this.createSampleVideoFile(sourceFormat);
            
            for (const targetFormat of formats) {
                if (targetFormat === sourceFormat) continue;
                
                try {
                    console.log(`  Converting ${sourceFormat} → ${targetFormat}...`);
                    const result = await this.videoConverter.convert(sourceFile, targetFormat);
                    
                    // Verify result
                    const isValid = await this.verifyVideoConversion(result, targetFormat);
                    
                    this.testResults.push({
                        test: `Format Conversion: ${sourceFormat} → ${targetFormat}`,
                        success: isValid,
                        result: result,
                        error: null
                    });
                    
                    console.log(`    ✅ ${sourceFormat} → ${targetFormat}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
                    
                } catch (error) {
                    this.testResults.push({
                        test: `Format Conversion: ${sourceFormat} → ${targetFormat}`,
                        success: false,
                        result: null,
                        error: error.message
                    });
                    console.log(`    ❌ ${sourceFormat} → ${targetFormat}: FAILED - ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Failed to create sample video: ${error.message}`);
        }
    }

    async testVideoToAudioExtraction() {
        console.log('\n🎵 Testing Video to Audio Extraction...');
        
        const audioFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
        
        try {
            const sourceFile = await this.createSampleVideoFile('mp4');
            
            for (const audioFormat of audioFormats) {
                try {
                    console.log(`  Extracting audio: MP4 → ${audioFormat}...`);
                    const result = await this.audioConverter.extractFromVideo(sourceFile, audioFormat);
                    
                    // Verify result
                    const isValid = await this.verifyAudioExtraction(result, audioFormat);
                    
                    this.testResults.push({
                        test: `Audio Extraction: MP4 → ${audioFormat}`,
                        success: isValid,
                        result: result,
                        error: null
                    });
                    
                    console.log(`    ✅ MP4 → ${audioFormat}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
                    
                } catch (error) {
                    this.testResults.push({
                        test: `Audio Extraction: MP4 → ${audioFormat}`,
                        success: false,
                        result: null,
                        error: error.message
                    });
                    console.log(`    ❌ MP4 → ${audioFormat}: FAILED - ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Failed to create sample video: ${error.message}`);
        }
    }

    async testVideoResizing() {
        console.log('\n📐 Testing Video Resizing...');
        
        const resizeTests = [
            { width: 320, height: 240, name: '320x240' },
            { width: 1280, height: 720, name: '1280x720' },
            { width: 1920, height: 1080, name: '1920x1080' }
        ];
        
        try {
            const sourceFile = await this.createSampleVideoFile('mp4');
            
            for (const resizeTest of resizeTests) {
                try {
                    console.log(`  Resizing to ${resizeTest.name}...`);
                    const result = await this.videoConverter.resize(
                        sourceFile, 
                        'mp4', 
                        resizeTest.width, 
                        resizeTest.height
                    );
                    
                    // Verify result
                    const isValid = await this.verifyVideoResize(result, resizeTest.width, resizeTest.height);
                    
                    this.testResults.push({
                        test: `Video Resize: ${resizeTest.name}`,
                        success: isValid,
                        result: result,
                        error: null
                    });
                    
                    console.log(`    ✅ ${resizeTest.name}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
                    
                } catch (error) {
                    this.testResults.push({
                        test: `Video Resize: ${resizeTest.name}`,
                        success: false,
                        result: null,
                        error: error.message
                    });
                    console.log(`    ❌ ${resizeTest.name}: FAILED - ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Failed to create sample video: ${error.message}`);
        }
    }

    async testVideoTrimming() {
        console.log('\n✂️  Testing Video Trimming...');
        
        const trimTests = [
            { startTime: 2, duration: 5, name: '2s-5s' },
            { startTime: 1, duration: 3, name: '1s-3s' },
            { startTime: 0, duration: 8, name: '0s-8s' }
        ];
        
        try {
            const sourceFile = await this.createSampleVideoFile('mp4');
            
            for (const trimTest of trimTests) {
                try {
                    console.log(`  Trimming ${trimTest.name}...`);
                    const result = await this.videoConverter.trim(
                        sourceFile, 
                        'mp4', 
                        trimTest.startTime, 
                        trimTest.duration
                    );
                    
                    // Verify result
                    const isValid = await this.verifyVideoTrim(result, trimTest.duration);
                    
                    this.testResults.push({
                        test: `Video Trim: ${trimTest.name}`,
                        success: isValid,
                        result: result,
                        error: null
                    });
                    
                    console.log(`    ✅ ${trimTest.name}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
                    
                } catch (error) {
                    this.testResults.push({
                        test: `Video Trim: ${trimTest.name}`,
                        success: false,
                        result: null,
                        error: error.message
                    });
                    console.log(`    ❌ ${trimTest.name}: FAILED - ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Failed to create sample video: ${error.message}`);
        }
    }

    async testFrameRateAdjustments() {
        console.log('\n🎞️  Testing Frame Rate Adjustments...');
        
        const fpsTests = [15, 24, 30, 60];
        
        try {
            const sourceFile = await this.createSampleVideoFile('mp4');
            
            for (const fps of fpsTests) {
                try {
                    console.log(`  Changing FPS to ${fps}...`);
                    const result = await this.videoConverter.changeFps(sourceFile, 'mp4', fps);
                    
                    // Verify result
                    const isValid = await this.verifyFrameRate(result, fps);
                    
                    this.testResults.push({
                        test: `Frame Rate: ${fps} FPS`,
                        success: isValid,
                        result: result,
                        error: null
                    });
                    
                    console.log(`    ✅ ${fps} FPS: ${isValid ? 'SUCCESS' : 'FAILED'}`);
                    
                } catch (error) {
                    this.testResults.push({
                        test: `Frame Rate: ${fps} FPS`,
                        success: false,
                        result: null,
                        error: error.message
                    });
                    console.log(`    ❌ ${fps} FPS: FAILED - ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Failed to create sample video: ${error.message}`);
        }
    }

    async verifyVideoConversion(result, expectedFormat) {
        try {
            // Check if file exists
            const filePath = path.join(__dirname, 'converted', result.filename);
            const stats = await fs.stat(filePath);
            
            // Basic validation
            return (
                result.filename &&
                result.size > 0 &&
                result.format === expectedFormat.toLowerCase() &&
                result.mimeType &&
                stats.size > 0
            );
        } catch (error) {
            return false;
        }
    }

    async verifyAudioExtraction(result, expectedFormat) {
        try {
            // Check if file exists
            const filePath = path.join(__dirname, 'converted', result.filename);
            const stats = await fs.stat(filePath);
            
            // Basic validation
            return (
                result.filename &&
                result.size > 0 &&
                result.format === expectedFormat.toLowerCase() &&
                result.mimeType &&
                stats.size > 0
            );
        } catch (error) {
            return false;
        }
    }

    async verifyVideoResize(result, expectedWidth, expectedHeight) {
        try {
            // Check if file exists
            const filePath = path.join(__dirname, 'converted', result.filename);
            const stats = await fs.stat(filePath);
            
            // Basic validation
            return (
                result.filename &&
                result.size > 0 &&
                result.width === expectedWidth &&
                result.height === expectedHeight &&
                stats.size > 0
            );
        } catch (error) {
            return false;
        }
    }

    async verifyVideoTrim(result, expectedDuration) {
        try {
            // Check if file exists
            const filePath = path.join(__dirname, 'converted', result.filename);
            const stats = await fs.stat(filePath);
            
            // Basic validation
            return (
                result.filename &&
                result.size > 0 &&
                result.trimInfo &&
                Math.abs(result.duration - expectedDuration) < 1 && // Allow 1 second tolerance
                stats.size > 0
            );
        } catch (error) {
            return false;
        }
    }

    async verifyFrameRate(result, expectedFps) {
        try {
            // Check if file exists
            const filePath = path.join(__dirname, 'converted', result.filename);
            const stats = await fs.stat(filePath);
            
            // Basic validation
            return (
                result.filename &&
                result.size > 0 &&
                Math.abs(result.fps - expectedFps) < 5 && // Allow 5 FPS tolerance
                stats.size > 0
            );
        } catch (error) {
            return false;
        }
    }

    generateReport() {
        console.log('\n📊 Video Conversion Test Report');
        console.log('=' .repeat(50));
        
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(test => test.success).length;
        const failedTests = totalTests - successfulTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Successful: ${successfulTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(test => !test.success)
                .forEach(test => {
                    console.log(`  - ${test.test}: ${test.error}`);
                });
        }
        
        console.log('\n✅ Successful Tests:');
        this.testResults
            .filter(test => test.success)
            .forEach(test => {
                console.log(`  - ${test.test}`);
            });
        
        console.log('\n🎯 Video Conversion Status:');
        if (successfulTests === totalTests) {
            console.log('✅ ALL VIDEO CONVERSIONS ARE WORKING PERFECTLY!');
        } else if (successfulTests >= totalTests * 0.8) {
            console.log('⚠️  MOST VIDEO CONVERSIONS ARE WORKING (Some issues detected)');
        } else {
            console.log('❌ SIGNIFICANT ISSUES DETECTED IN VIDEO CONVERSIONS');
        }
    }

    async cleanup() {
        try {
            // Clean up test files
            const files = await fs.readdir(this.testDir);
            for (const file of files) {
                await fs.unlink(path.join(this.testDir, file));
            }
            await fs.rmdir(this.testDir);
            console.log('\n🧹 Test files cleaned up');
        } catch (error) {
            console.log('\n⚠️  Could not clean up test files:', error.message);
        }
    }
}

if (require.main === module) {
    const tester = new VideoConversionTester();
    tester.runAllTests()
        .then(() => tester.cleanup())
        .catch(console.error);
}

module.exports = VideoConversionTester; 