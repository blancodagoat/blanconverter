/**
 * Font Conversion Tests
 * Tests all font conversions
 */

const fs = require('fs').promises;
const path = require('path');
const FontConverter = require('./src/server/fontConverter');

class FontConversionTester {
    constructor() {
        this.converter = new FontConverter();
        this.testDir = path.join(__dirname, 'test-fonts');
        this.results = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * Run all tests
     */
    async runTests() {
        console.log('🚀 Starting Font Conversion Tests...\n');
        
        try {
            await this.setupTestEnvironment();
            
            // Test basic functionality
            await this.testSupportedFormats();
            await this.testMimeTypes();
            await this.testFileFormatDetection();
            
            // Test font conversions
            await this.testTTFConversions();
            await this.testOTFConversions();
            await this.testWOFFConversions();
            await this.testWOFF2Conversions();
            await this.testEOTConversions();
            await this.testSVGConversions();
            
            // Test font validation and metadata
            await this.testFontValidation();
            await this.testFontMetadata();
            await this.testFontOptimization();
            
            // Test error handling
            await this.testErrorHandling();
            
            await this.printResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Setup test environment
     */
    async setupTestEnvironment() {
        try {
            await fs.mkdir(this.testDir, { recursive: true });
            console.log('✅ Test environment setup complete');
        } catch (error) {
            console.error('❌ Failed to setup test environment:', error);
            throw error;
        }
    }

    /**
     * Test supported formats
     */
    async testSupportedFormats() {
        console.log('\n📋 Testing supported formats...');
        
        const formats = this.converter.getSupportedFormats();
        
        const expectedInput = ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg'];
        const expectedOutput = ['ttf', 'otf', 'woff', 'woff2', 'eot', 'svg'];
        
        const inputMatch = JSON.stringify(formats.input.sort()) === JSON.stringify(expectedInput.sort());
        const outputMatch = JSON.stringify(formats.output.sort()) === JSON.stringify(expectedOutput.sort());
        
        if (inputMatch && outputMatch) {
            this.results.passed++;
            console.log('✅ Supported formats test passed');
        } else {
            this.results.failed++;
            console.log('❌ Supported formats test failed');
        }
    }

    /**
     * Test MIME types
     */
    async testMimeTypes() {
        console.log('\n📋 Testing MIME types...');
        
        const testCases = [
            { format: 'ttf', expected: 'font/ttf' },
            { format: 'otf', expected: 'font/otf' },
            { format: 'woff', expected: 'font/woff' },
            { format: 'woff2', expected: 'font/woff2' },
            { format: 'eot', expected: 'application/vnd.ms-fontobject' },
            { format: 'svg', expected: 'image/svg+xml' }
        ];
        
        let allPassed = true;
        
        for (const testCase of testCases) {
            const mimeType = this.converter.getMimeType(testCase.format);
            if (mimeType !== testCase.expected) {
                allPassed = false;
                console.log(`❌ MIME type test failed for ${testCase.format}`);
            }
        }
        
        if (allPassed) {
            this.results.passed++;
            console.log('✅ MIME types test passed');
        } else {
            this.results.failed++;
        }
    }

    /**
     * Test file format detection
     */
    async testFileFormatDetection() {
        console.log('\n📋 Testing file format detection...');
        
        const testCases = [
            { filename: 'test.ttf', expected: 'ttf' },
            { filename: 'test.otf', expected: 'otf' },
            { filename: 'test.woff', expected: 'woff' },
            { filename: 'test.woff2', expected: 'woff2' },
            { filename: 'test.eot', expected: 'eot' },
            { filename: 'test.svg', expected: 'svg' }
        ];
        
        let allPassed = true;
        
        for (const testCase of testCases) {
            const format = this.converter.getFileFormat(testCase.filename);
            if (format !== testCase.expected) {
                allPassed = false;
                console.log(`❌ Format detection failed for ${testCase.filename}`);
            }
        }
        
        if (allPassed) {
            this.results.passed++;
            console.log('✅ File format detection test passed');
        } else {
            this.results.failed++;
        }
    }

    /**
     * Test TTF conversions
     */
    async testTTFConversions() {
        console.log('\n📋 Testing TTF conversions...');
        
        const conversions = [
            { from: 'otf', to: 'ttf', description: 'OTF → TTF' },
            { from: 'woff', to: 'ttf', description: 'WOFF → TTF' },
            { from: 'woff2', to: 'ttf', description: 'WOFF2 → TTF' },
            { from: 'eot', to: 'ttf', description: 'EOT → TTF' },
            { from: 'svg', to: 'ttf', description: 'SVG → TTF' }
        ];
        
        for (const conversion of conversions) {
            await this.testConversion(conversion.from, conversion.to, conversion.description);
        }
    }

    /**
     * Test OTF conversions
     */
    async testOTFConversions() {
        console.log('\n📋 Testing OTF conversions...');
        
        const conversions = [
            { from: 'ttf', to: 'otf', description: 'TTF → OTF' },
            { from: 'woff', to: 'otf', description: 'WOFF → OTF' },
            { from: 'woff2', to: 'otf', description: 'WOFF2 → OTF' },
            { from: 'eot', to: 'otf', description: 'EOT → OTF' },
            { from: 'svg', to: 'otf', description: 'SVG → OTF' }
        ];
        
        for (const conversion of conversions) {
            await this.testConversion(conversion.from, conversion.to, conversion.description);
        }
    }

    /**
     * Test WOFF conversions
     */
    async testWOFFConversions() {
        console.log('\n📋 Testing WOFF conversions...');
        
        const conversions = [
            { from: 'ttf', to: 'woff', description: 'TTF → WOFF' },
            { from: 'otf', to: 'woff', description: 'OTF → WOFF' },
            { from: 'woff2', to: 'woff', description: 'WOFF2 → WOFF' },
            { from: 'eot', to: 'woff', description: 'EOT → WOFF' },
            { from: 'svg', to: 'woff', description: 'SVG → WOFF' }
        ];
        
        for (const conversion of conversions) {
            await this.testConversion(conversion.from, conversion.to, conversion.description);
        }
    }

    /**
     * Test WOFF2 conversions
     */
    async testWOFF2Conversions() {
        console.log('\n📋 Testing WOFF2 conversions...');
        
        const conversions = [
            { from: 'ttf', to: 'woff2', description: 'TTF → WOFF2' },
            { from: 'otf', to: 'woff2', description: 'OTF → WOFF2' },
            { from: 'woff', to: 'woff2', description: 'WOFF → WOFF2' },
            { from: 'eot', to: 'woff2', description: 'EOT → WOFF2' },
            { from: 'svg', to: 'woff2', description: 'SVG → WOFF2' }
        ];
        
        for (const conversion of conversions) {
            await this.testConversion(conversion.from, conversion.to, conversion.description);
        }
    }

    /**
     * Test EOT conversions
     */
    async testEOTConversions() {
        console.log('\n📋 Testing EOT conversions...');
        
        const conversions = [
            { from: 'ttf', to: 'eot', description: 'TTF → EOT' },
            { from: 'otf', to: 'eot', description: 'OTF → EOT' },
            { from: 'woff', to: 'eot', description: 'WOFF → EOT' },
            { from: 'woff2', to: 'eot', description: 'WOFF2 → EOT' },
            { from: 'svg', to: 'eot', description: 'SVG → EOT' }
        ];
        
        for (const conversion of conversions) {
            await this.testConversion(conversion.from, conversion.to, conversion.description);
        }
    }

    /**
     * Test SVG conversions
     */
    async testSVGConversions() {
        console.log('\n📋 Testing SVG conversions...');
        
        const conversions = [
            { from: 'ttf', to: 'svg', description: 'TTF → SVG' },
            { from: 'otf', to: 'svg', description: 'OTF → SVG' },
            { from: 'woff', to: 'svg', description: 'WOFF → SVG' },
            { from: 'woff2', to: 'svg', description: 'WOFF2 → SVG' },
            { from: 'eot', to: 'svg', description: 'EOT → SVG' }
        ];
        
        for (const conversion of conversions) {
            await this.testConversion(conversion.from, conversion.to, conversion.description);
        }
    }

    /**
     * Test individual conversion
     */
    async testConversion(fromFormat, toFormat, description) {
        try {
            const inputPath = path.join(this.testDir, `test.${fromFormat}`);
            const outputPath = path.join(this.testDir, `test-converted.${toFormat}`);
            
            // Create test font file if it doesn't exist
            await this.createTestFont(inputPath, fromFormat);
            
            const result = await this.converter.convert(inputPath, outputPath, toFormat);
            
            if (result.success) {
                this.results.passed++;
                console.log(`✅ ${description} test passed`);
            } else {
                this.results.failed++;
                console.log(`❌ ${description} test failed`);
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`${description} failed: ${error.message}`);
            console.log(`❌ ${description} test failed: ${error.message}`);
        }
    }

    /**
     * Test font validation
     */
    async testFontValidation() {
        console.log('\n📋 Testing font validation...');
        
        try {
            const testFontPath = path.join(this.testDir, 'test.ttf');
            await this.createTestFont(testFontPath, 'ttf');
            
            const isValid = await this.converter.validateFont(testFontPath);
            
            if (isValid) {
                this.results.passed++;
                console.log('✅ Font validation test passed');
            } else {
                this.results.failed++;
                console.log('❌ Font validation test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Font validation failed: ${error.message}`);
            console.log('❌ Font validation test failed:', error.message);
        }
    }

    /**
     * Test font metadata
     */
    async testFontMetadata() {
        console.log('\n📋 Testing font metadata...');
        
        try {
            const testFontPath = path.join(this.testDir, 'test.ttf');
            await this.createTestFont(testFontPath, 'ttf');
            
            const metadata = await this.converter.getFontMetadata(testFontPath);
            
            if (metadata && metadata.format && metadata.size > 0) {
                this.results.passed++;
                console.log('✅ Font metadata test passed');
            } else {
                this.results.failed++;
                console.log('❌ Font metadata test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Font metadata failed: ${error.message}`);
            console.log('❌ Font metadata test failed:', error.message);
        }
    }

    /**
     * Test font optimization
     */
    async testFontOptimization() {
        console.log('\n📋 Testing font optimization...');
        
        try {
            const inputPath = path.join(this.testDir, 'test.ttf');
            const outputPath = path.join(this.testDir, 'test-optimized.ttf');
            
            await this.createTestFont(inputPath, 'ttf');
            
            const result = await this.converter.optimizeFont(inputPath, outputPath);
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ Font optimization test passed');
            } else {
                this.results.failed++;
                console.log('❌ Font optimization test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Font optimization failed: ${error.message}`);
            console.log('❌ Font optimization test failed:', error.message);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('\n📋 Testing error handling...');
        
        try {
            const nonExistentPath = path.join(this.testDir, 'non-existent.ttf');
            const outputPath = path.join(this.testDir, 'output.ttf');
            
            await this.converter.convert(nonExistentPath, outputPath, 'otf');
            
            this.results.failed++;
            console.log('❌ Error handling test failed - should have thrown error');
        } catch (error) {
            this.results.passed++;
            console.log('✅ Error handling test passed - error properly caught');
        }
    }

    /**
     * Create test font file
     */
    async createTestFont(filePath, format) {
        try {
            // Check if file already exists
            await fs.access(filePath);
            return; // File exists, no need to create
        } catch (error) {
            // File doesn't exist, create it
        }

        switch (format) {
            case 'ttf':
            case 'otf':
                await this.createOpenTypeFont(filePath, format);
                break;
            case 'woff':
            case 'woff2':
                await this.createWOFFFont(filePath, format);
                break;
            case 'eot':
                await this.createEOTFont(filePath);
                break;
            case 'svg':
                await this.createSVGFont(filePath);
                break;
            default:
                throw new Error(`Unsupported format for test font creation: ${format}`);
        }
    }

    /**
     * Create OpenType test font
     */
    async createOpenTypeFont(filePath, format) {
        // Create a minimal OpenType font structure
        const fontData = Buffer.from([
            0x00, 0x01, 0x00, 0x00, // TTF signature
            0x00, 0x00, 0x00, 0x0C, // Number of tables
            0x00, 0x00, 0x00, 0x10, // Search range
            0x00, 0x00, 0x00, 0x00, // Entry selector
            0x00, 0x00, 0x00, 0x00  // Range shift
        ]);
        
        await fs.writeFile(filePath, fontData);
    }

    /**
     * Create WOFF test font
     */
    async createWOFFFont(filePath, format) {
        // Create a minimal WOFF font structure
        const fontData = Buffer.from([
            0x77, 0x4F, 0x46, 0x46, // WOFF signature
            0x00, 0x00, 0x00, 0x01, // WOFF version
            0x00, 0x00, 0x00, 0x00, // Meta offset
            0x00, 0x00, 0x00, 0x00, // Meta length
            0x00, 0x00, 0x00, 0x00, // Meta origLength
            0x00, 0x00, 0x00, 0x00, // Priv offset
            0x00, 0x00, 0x00, 0x00, // Priv length
            0x00, 0x00, 0x00, 0x00  // Priv origLength
        ]);
        
        await fs.writeFile(filePath, fontData);
    }

    /**
     * Create EOT test font
     */
    async createEOTFont(filePath) {
        // Create a minimal EOT font structure
        const fontData = Buffer.from([
            0x4C, 0x50, 0x00, 0x00, // EOT signature
            0x00, 0x00, 0x00, 0x00, // Version
            0x00, 0x00, 0x00, 0x00, // Flags
            0x00, 0x00, 0x00, 0x00, // FontPANOSE
            0x00, 0x00, 0x00, 0x00, // FontCharSet
            0x00, 0x00, 0x00, 0x00, // FontSig
            0x00, 0x00, 0x00, 0x00, // FamilyNameSize
            0x00, 0x00, 0x00, 0x00  // FamilyNameOffset
        ]);
        
        await fs.writeFile(filePath, fontData);
    }

    /**
     * Create SVG test font
     */
    async createSVGFont(filePath) {
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <font id="test-font" horiz-adv-x="1000">
      <font-face font-family="TestFont" units-per-em="1000" />
      <glyph unicode="A" horiz-adv-x="600" d="M100 100 L300 900 L500 100 Z" />
    </font>
  </defs>
</svg>`;
        
        await fs.writeFile(filePath, svgContent);
    }

    /**
     * Print test results
     */
    async printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 FONT CONVERSION TEST RESULTS');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(2)}%`);
        
        if (this.results.errors.length > 0) {
            console.log('\n🚨 Errors:');
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All font conversion tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the implementation.');
        }
    }

    /**
     * Cleanup test files
     */
    async cleanup() {
        try {
            await fs.rm(this.testDir, { recursive: true, force: true });
            console.log('\n🧹 Test cleanup completed');
        } catch (error) {
            console.log('\n⚠️  Cleanup warning:', error.message);
        }
    }
}

// Run tests
const tester = new FontConversionTester();
tester.runTests().catch(console.error); 