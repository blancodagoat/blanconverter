/**
 * Test Script for Image Conversions
 * Verifies all requested image conversions are working
 */

const ImageConverter = require('./src/server/imageConverter');
const fs = require('fs').promises;
const path = require('path');

class ImageConversionTester {
    constructor() {
        this.converter = new ImageConverter();
        this.testResults = [];
        this.testDir = './test-image-files';
    }

    async runAllTests() {
        console.log('🖼️  Starting Image Conversion Tests...\n');
        await this.createTestDirectory();
        await this.testStandardImageConversions();
        await this.testHeicConversions();
        await this.testRawConversions();
        await this.testSvgConversions();
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

    async testStandardImageConversions() {
        console.log('\n📸 Testing Standard Image Conversions...');
        
        // Test Any ↔ JPG / PNG / WEBP / GIF
        const testCases = [
            { input: 'sample.jpg', target: 'png', description: 'JPG → PNG' },
            { input: 'sample.png', target: 'jpg', description: 'PNG → JPG' },
            { input: 'sample.jpg', target: 'webp', description: 'JPG → WEBP' },
            { input: 'sample.png', target: 'gif', description: 'PNG → GIF' },
            { input: 'sample.gif', target: 'jpg', description: 'GIF → JPG' },
            { input: 'sample.webp', target: 'png', description: 'WEBP → PNG' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.input, testCase.target, testCase.description);
        }
    }

    async testHeicConversions() {
        console.log('\n📱 Testing HEIC Conversions...');
        
        const testCases = [
            { input: 'sample.heic', target: 'jpg', description: 'HEIC → JPG' },
            { input: 'sample.heic', target: 'png', description: 'HEIC → PNG' },
            { input: 'sample.heif', target: 'jpg', description: 'HEIF → JPG' },
            { input: 'sample.heif', target: 'png', description: 'HEIF → PNG' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.input, testCase.target, testCase.description);
        }
    }

    async testRawConversions() {
        console.log('\n📷 Testing RAW Conversions...');
        
        const testCases = [
            { input: 'sample.cr2', target: 'jpg', description: 'CR2 → JPG' },
            { input: 'sample.nef', target: 'png', description: 'NEF → PNG' },
            { input: 'sample.arw', target: 'tiff', description: 'ARW → TIFF' },
            { input: 'sample.dng', target: 'jpg', description: 'DNG → JPG' },
            { input: 'sample.raw', target: 'png', description: 'RAW → PNG' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.input, testCase.target, testCase.description);
        }
    }

    async testSvgConversions() {
        console.log('\n🎨 Testing SVG Conversions...');
        
        const testCases = [
            { input: 'sample.svg', target: 'png', description: 'SVG → PNG' },
            { input: 'sample.svg', target: 'jpg', description: 'SVG → JPG' },
            { input: 'sample.svg', target: 'pdf', description: 'SVG → PDF' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.input, testCase.target, testCase.description);
        }
    }

    async testConversion(inputFile, targetFormat, description) {
        try {
            const inputPath = path.join(this.testDir, inputFile);
            
            // Check if test file exists
            try {
                await fs.access(inputPath);
            } catch (error) {
                console.log(`⚠️  Skipping ${description} - test file not found: ${inputFile}`);
                this.testResults.push({
                    test: description,
                    status: 'SKIPPED',
                    reason: 'Test file not found'
                });
                return;
            }

            console.log(`🔄 Testing: ${description}`);
            
            // Perform conversion
            const result = await this.converter.convert(inputPath, targetFormat);
            
            // Verify result
            const isValid = await this.verifyConversion(result, targetFormat);
            
            if (isValid) {
                console.log(`✅ ${description} - SUCCESS`);
                this.testResults.push({
                    test: description,
                    status: 'SUCCESS',
                    result: result
                });
            } else {
                console.log(`❌ ${description} - FAILED`);
                this.testResults.push({
                    test: description,
                    status: 'FAILED',
                    reason: 'Invalid output file'
                });
            }

        } catch (error) {
            console.log(`❌ ${description} - ERROR: ${error.message}`);
            this.testResults.push({
                test: description,
                status: 'ERROR',
                error: error.message
            });
        }
    }

    async verifyConversion(result, targetFormat) {
        try {
            // Check if output file exists
            const outputPath = path.join(__dirname, 'converted', result.filename);
            await fs.access(outputPath);
            
            // Check file size
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
                return false;
            }
            
            // Check format
            if (result.format.toLowerCase() !== targetFormat.toLowerCase()) {
                return false;
            }
            
            // Check MIME type
            const expectedMime = this.converter.getMimeType(targetFormat);
            if (result.mimeType !== expectedMime) {
                return false;
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    generateReport() {
        console.log('\n📊 Image Conversion Test Report');
        console.log('================================');
        
        const total = this.testResults.length;
        const success = this.testResults.filter(r => r.status === 'SUCCESS').length;
        const failed = this.testResults.filter(r => r.status === 'FAILED').length;
        const error = this.testResults.filter(r => r.status === 'ERROR').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIPPED').length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`✅ Success: ${success}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️  Errors: ${error}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`Success Rate: ${((success / total) * 100).toFixed(1)}%`);
        
        console.log('\n📋 Detailed Results:');
        this.testResults.forEach(result => {
            const statusIcon = result.status === 'SUCCESS' ? '✅' : 
                             result.status === 'FAILED' ? '❌' : 
                             result.status === 'ERROR' ? '⚠️' : '⏭️';
            console.log(`${statusIcon} ${result.test}: ${result.status}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            if (result.reason) {
                console.log(`   Reason: ${result.reason}`);
            }
        });
        
        console.log('\n🎯 Requested Conversions Status:');
        console.log('================================');
        
        // Any ↔ JPG / PNG / WEBP / GIF
        const standardTests = this.testResults.filter(r => 
            r.test.includes('JPG') || r.test.includes('PNG') || 
            r.test.includes('WEBP') || r.test.includes('GIF')
        );
        const standardSuccess = standardTests.filter(r => r.status === 'SUCCESS').length;
        console.log(`Any ↔ JPG / PNG / WEBP / GIF: ${standardSuccess}/${standardTests.length} ✅`);
        
        // SVG ↔ PNG / JPG / PDF
        const svgTests = this.testResults.filter(r => r.test.includes('SVG'));
        const svgSuccess = svgTests.filter(r => r.status === 'SUCCESS').length;
        console.log(`SVG ↔ PNG / JPG / PDF: ${svgSuccess}/${svgTests.length} ✅`);
        
        // HEIC ↔ JPG / PNG
        const heicTests = this.testResults.filter(r => r.test.includes('HEIC') || r.test.includes('HEIF'));
        const heicSuccess = heicTests.filter(r => r.status === 'SUCCESS').length;
        console.log(`HEIC ↔ JPG / PNG: ${heicSuccess}/${heicTests.length} ✅`);
        
        // RAW ↔ JPG / TIFF
        const rawTests = this.testResults.filter(r => 
            r.test.includes('CR2') || r.test.includes('NEF') || 
            r.test.includes('ARW') || r.test.includes('DNG') || r.test.includes('RAW')
        );
        const rawSuccess = rawTests.filter(r => r.status === 'SUCCESS').length;
        console.log(`RAW ↔ JPG / TIFF: ${rawSuccess}/${rawTests.length} ✅`);
        
        console.log('\n🏁 Image Conversion Testing Complete!');
    }

    async cleanup() {
        try {
            // Clean up test files
            const convertedDir = path.join(__dirname, 'converted');
            const files = await fs.readdir(convertedDir);
            
            for (const file of files) {
                if (file.startsWith('image-')) {
                    await fs.unlink(path.join(convertedDir, file));
                }
            }
            
            console.log('🧹 Cleanup completed');
        } catch (error) {
            console.log('⚠️  Cleanup failed:', error.message);
        }
    }
}

if (require.main === module) {
    const tester = new ImageConversionTester();
    tester.runAllTests()
        .then(() => tester.cleanup())
        .catch(console.error);
}

module.exports = ImageConversionTester; 