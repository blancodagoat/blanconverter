/**
 * Test Script for Audio Conversions
 * Verifies all requested audio conversions are working
 */

const AudioConverter = require('./src/server/audioConverter');
const VideoConverter = require('./src/server/videoConverter');
const fs = require('fs').promises;
const path = require('path');

class AudioConversionTester {
    constructor() {
        this.audioConverter = new AudioConverter();
        this.videoConverter = new VideoConverter();
        this.testResults = [];
        this.testDir = './test-audio-files';
    }

    async runAllTests() {
        console.log('🎵 Starting Audio Conversion Tests...\n');
        await this.createTestDirectory();
        await this.testStandardAudioConversions();
        await this.testVideoToAudioExtraction();
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

    async testStandardAudioConversions() {
        console.log('\n📻 Testing Standard Audio Conversions...');
        
        const testCases = [
            // MP3 conversions
            { input: 'mp3', outputs: ['wav', 'flac', 'aac', 'ogg', 'm4a'] },
            // WAV conversions
            { input: 'wav', outputs: ['mp3', 'flac', 'aac', 'ogg', 'm4a'] },
            // FLAC conversions
            { input: 'flac', outputs: ['mp3', 'wav', 'aac', 'ogg', 'm4a'] },
            // AAC conversions
            { input: 'aac', outputs: ['mp3', 'wav', 'flac', 'ogg', 'm4a'] },
            // OGG conversions
            { input: 'ogg', outputs: ['mp3', 'wav', 'flac', 'aac', 'm4a'] },
            // M4A conversions
            { input: 'm4a', outputs: ['mp3', 'wav', 'flac', 'aac', 'ogg'] }
        ];

        for (const testCase of testCases) {
            await this.testAudioFormatConversions(testCase.input, testCase.outputs);
        }
    }

    async testAudioFormatConversions(inputFormat, outputFormats) {
        console.log(`\n🔄 Testing ${inputFormat.toUpperCase()} conversions...`);
        
        for (const outputFormat of outputFormats) {
            try {
                const testName = `${inputFormat.toUpperCase()} → ${outputFormat.toUpperCase()}`;
                console.log(`  Testing ${testName}...`);
                
                // Create sample audio file
                const inputPath = await this.createSampleAudioFile(inputFormat);
                
                // Perform conversion
                const result = await this.audioConverter.convert(inputPath, outputFormat);
                
                // Verify conversion
                const verification = await this.verifyAudioConversion(result, outputFormat);
                
                this.testResults.push({
                    test: testName,
                    success: verification.success,
                    details: verification.details,
                    result: result
                });
                
                // Cleanup
                await this.cleanupTestFile(inputPath);
                await this.cleanupTestFile(path.join(__dirname, 'converted', result.filename));
                
                console.log(`    ${verification.success ? '✅' : '❌'} ${testName}: ${verification.details}`);
                
            } catch (error) {
                console.log(`    ❌ ${inputFormat.toUpperCase()} → ${outputFormat.toUpperCase()}: ${error.message}`);
                this.testResults.push({
                    test: `${inputFormat.toUpperCase()} → ${outputFormat.toUpperCase()}`,
                    success: false,
                    details: error.message
                });
            }
        }
    }

    async testVideoToAudioExtraction() {
        console.log('\n🎬 Testing Video to Audio Extraction...');
        
        const testCases = [
            { input: 'mp4', outputs: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'] },
            { input: 'avi', outputs: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'] },
            { input: 'mov', outputs: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'] },
            { input: 'mkv', outputs: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'] },
            { input: 'webm', outputs: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'] }
        ];

        for (const testCase of testCases) {
            await this.testVideoToAudioExtraction(testCase.input, testCase.outputs);
        }
    }

    async testVideoToAudioExtraction(inputFormat, outputFormats) {
        console.log(`\n🎥 Testing ${inputFormat.toUpperCase()} to audio extraction...`);
        
        for (const outputFormat of outputFormats) {
            try {
                const testName = `${inputFormat.toUpperCase()} → ${outputFormat.toUpperCase()} (audio)`;
                console.log(`  Testing ${testName}...`);
                
                // Create sample video file
                const inputPath = await this.createSampleVideoFile(inputFormat);
                
                // Perform audio extraction
                const result = await this.audioConverter.extractFromVideo(inputPath, outputFormat);
                
                // Verify extraction
                const verification = await this.verifyAudioConversion(result, outputFormat);
                
                this.testResults.push({
                    test: testName,
                    success: verification.success,
                    details: verification.details,
                    result: result
                });
                
                // Cleanup
                await this.cleanupTestFile(inputPath);
                await this.cleanupTestFile(path.join(__dirname, 'converted', result.filename));
                
                console.log(`    ${verification.success ? '✅' : '❌'} ${testName}: ${verification.details}`);
                
            } catch (error) {
                console.log(`    ❌ ${inputFormat.toUpperCase()} → ${outputFormat.toUpperCase()} (audio): ${error.message}`);
                this.testResults.push({
                    test: `${inputFormat.toUpperCase()} → ${outputFormat.toUpperCase()} (audio)`,
                    success: false,
                    details: error.message
                });
            }
        }
    }

    async createSampleAudioFile(format) {
        const filename = `test-audio-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${format}`;
        const filePath = path.join(this.testDir, filename);
        
        // Create a simple audio file using FFmpeg
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        try {
            // Generate a 3-second test tone
            await execAsync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=3" -c:a ${this.getAudioCodec(format)} "${filePath}"`);
            return filePath;
        } catch (error) {
            // Fallback: create empty file for testing
            await fs.writeFile(filePath, '');
            return filePath;
        }
    }

    async createSampleVideoFile(format) {
        const filename = `test-video-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${format}`;
        const filePath = path.join(this.testDir, filename);
        
        // Create a simple video file using FFmpeg
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        try {
            // Generate a 3-second test video with audio
            await execAsync(`ffmpeg -f lavfi -i "testsrc=duration=3:size=320x240:rate=1" -f lavfi -i "sine=frequency=440:duration=3" -c:v ${this.getVideoCodec(format)} -c:a aac "${filePath}"`);
            return filePath;
        } catch (error) {
            // Fallback: create empty file for testing
            await fs.writeFile(filePath, '');
            return filePath;
        }
    }

    getAudioCodec(format) {
        const codecs = {
            'mp3': 'libmp3lame',
            'wav': 'pcm_s16le',
            'flac': 'flac',
            'aac': 'aac',
            'ogg': 'libvorbis',
            'm4a': 'aac'
        };
        return codecs[format] || 'aac';
    }

    getVideoCodec(format) {
        const codecs = {
            'mp4': 'libx264',
            'avi': 'libxvid',
            'mov': 'libx264',
            'mkv': 'libx264',
            'webm': 'libvpx-vp9'
        };
        return codecs[format] || 'libx264';
    }

    async verifyAudioConversion(result, expectedFormat) {
        try {
            // Check if file exists
            const filePath = path.join(__dirname, 'converted', result.filename);
            const stats = await fs.stat(filePath);
            
            if (stats.size === 0) {
                return { success: false, details: 'Output file is empty' };
            }
            
            // Check format
            const actualFormat = path.extname(result.filename).substring(1).toLowerCase();
            if (actualFormat !== expectedFormat.toLowerCase()) {
                return { success: false, details: `Format mismatch: expected ${expectedFormat}, got ${actualFormat}` };
            }
            
            // Check MIME type
            const expectedMimeType = this.audioConverter.getMimeType(expectedFormat);
            if (result.mimeType !== expectedMimeType) {
                return { success: false, details: `MIME type mismatch: expected ${expectedMimeType}, got ${result.mimeType}` };
            }
            
            // Check file size is reasonable
            if (stats.size < 100) {
                return { success: false, details: 'File size too small (likely corrupted)' };
            }
            
            return { 
                success: true, 
                details: `Successfully converted (${this.formatFileSize(stats.size)})` 
            };
            
        } catch (error) {
            return { success: false, details: `Verification failed: ${error.message}` };
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async cleanupTestFile(filePath) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 AUDIO CONVERSION TEST REPORT');
        console.log('='.repeat(60));
        
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - successfulTests;
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   ✅ Successful: ${successfulTests}`);
        console.log(`   ❌ Failed: ${failedTests}`);
        console.log(`   📊 Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            this.testResults
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`   • ${r.test}: ${r.details}`);
                });
        }
        
        console.log(`\n✅ SUCCESSFUL TESTS:`);
        this.testResults
            .filter(r => r.success)
            .forEach(r => {
                console.log(`   • ${r.test}: ${r.details}`);
            });
        
        console.log('\n' + '='.repeat(60));
        
        if (successfulTests === totalTests) {
            console.log('🎉 ALL AUDIO CONVERSIONS ARE WORKING PERFECTLY!');
        } else {
            console.log('⚠️  SOME CONVERSIONS NEED ATTENTION');
        }
        console.log('='.repeat(60));
    }

    async cleanup() {
        try {
            await fs.rmdir(this.testDir, { recursive: true });
            console.log('\n🧹 Test directory cleaned up');
        } catch (error) {
            console.log('\nℹ️  Cleanup completed');
        }
    }
}

if (require.main === module) {
    const tester = new AudioConversionTester();
    tester.runAllTests()
        .then(() => tester.cleanup())
        .catch(console.error);
}

module.exports = AudioConversionTester; 