/**
 * Vector/Graphic Conversion Tests
 * Tests all vector and graphic file conversions
 */

const fs = require('fs').promises;
const path = require('path');
const VectorConverter = require('./src/server/vectorConverter');

class VectorConversionTester {
    constructor() {
        this.converter = new VectorConverter();
        this.testDir = path.join(__dirname, 'test-vectors');
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
        console.log('🚀 Starting Vector/Graphic Conversion Tests...\n');
        
        try {
            await this.setupTestEnvironment();
            
            // Test basic functionality
            await this.testSupportedFormats();
            await this.testMimeTypes();
            await this.testFileFormatDetection();
            
            // Test AI conversions
            await this.testAiToSvg();
            await this.testAiToPdf();
            await this.testAiToPng();
            await this.testAiToEps();
            
            // Test CDR conversions
            await this.testCdrToSvg();
            await this.testCdrToPng();
            await this.testCdrToPdf();
            await this.testCdrToEps();
            
            // Test SVG conversions
            await this.testSvgToPdf();
            await this.testSvgToPng();
            await this.testSvgToJpg();
            await this.testSvgToEps();
            await this.testSvgToAi();
            
            // Test PDF conversions
            await this.testPdfToSvg();
            await this.testPdfToPng();
            await this.testPdfToJpg();
            await this.testPdfToEps();
            await this.testPdfToAi();
            
            // Test EPS conversions
            await this.testEpsToSvg();
            await this.testEpsToPdf();
            await this.testEpsToPng();
            await this.testEpsToJpg();
            await this.testEpsToAi();
            
            // Test vector metadata and validation
            await this.testVectorMetadata();
            await this.testVectorValidation();
            await this.testVectorOptimization();
            
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
        
        const expectedInput = ['ai', 'cdr', 'eps', 'svg', 'pdf'];
        const expectedOutput = ['pdf', 'svg', 'png', 'jpg', 'eps', 'ai', 'cdr'];
        
        const inputMatch = JSON.stringify(formats.input.sort()) === JSON.stringify(expectedInput.sort());
        const outputMatch = JSON.stringify(formats.output.sort()) === JSON.stringify(expectedOutput.sort());
        
        if (inputMatch && outputMatch) {
            this.results.passed++;
            console.log('✅ Supported formats test passed');
        } else {
            this.results.failed++;
            console.log('❌ Supported formats test failed');
            console.log('Expected input:', expectedInput);
            console.log('Actual input:', formats.input);
            console.log('Expected output:', expectedOutput);
            console.log('Actual output:', formats.output);
        }
    }

    /**
     * Test MIME types
     */
    async testMimeTypes() {
        console.log('\n📋 Testing MIME types...');
        
        const testCases = [
            { format: 'ai', expected: 'application/postscript' },
            { format: 'cdr', expected: 'application/x-coreldraw' },
            { format: 'eps', expected: 'application/postscript' },
            { format: 'svg', expected: 'image/svg+xml' },
            { format: 'pdf', expected: 'application/pdf' }
        ];
        
        let allPassed = true;
        
        for (const testCase of testCases) {
            const mimeType = this.converter.getMimeType(testCase.format);
            if (mimeType !== testCase.expected) {
                allPassed = false;
                console.log(`❌ MIME type test failed for ${testCase.format}: expected ${testCase.expected}, got ${mimeType}`);
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
            { filename: 'test.ai', expected: 'ai' },
            { filename: 'test.cdr', expected: 'cdr' },
            { filename: 'test.eps', expected: 'eps' },
            { filename: 'test.svg', expected: 'svg' },
            { filename: 'test.pdf', expected: 'pdf' }
        ];
        
        let allPassed = true;
        
        for (const testCase of testCases) {
            const format = this.converter.getFileFormat(testCase.filename);
            if (format !== testCase.expected) {
                allPassed = false;
                console.log(`❌ Format detection failed for ${testCase.filename}: expected ${testCase.expected}, got ${format}`);
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
     * Test AI to SVG conversion
     */
    async testAiToSvg() {
        console.log('\n📋 Testing AI to SVG conversion...');
        
        try {
            const aiPath = await this.createSampleAiFile();
            const svgPath = path.join(this.testDir, 'test-converted.svg');
            
            const result = await this.converter.convert(aiPath, svgPath, 'svg');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ AI to SVG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ AI to SVG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`AI to SVG conversion failed: ${error.message}`);
            console.log('❌ AI to SVG conversion test failed:', error.message);
        }
    }

    /**
     * Test AI to PDF conversion
     */
    async testAiToPdf() {
        console.log('\n📋 Testing AI to PDF conversion...');
        
        try {
            const aiPath = await this.createSampleAiFile();
            const pdfPath = path.join(this.testDir, 'test-converted.pdf');
            
            const result = await this.converter.convert(aiPath, pdfPath, 'pdf');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ AI to PDF conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ AI to PDF conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`AI to PDF conversion failed: ${error.message}`);
            console.log('❌ AI to PDF conversion test failed:', error.message);
        }
    }

    /**
     * Test AI to PNG conversion
     */
    async testAiToPng() {
        console.log('\n📋 Testing AI to PNG conversion...');
        
        try {
            const aiPath = await this.createSampleAiFile();
            const pngPath = path.join(this.testDir, 'test-converted.png');
            
            const result = await this.converter.convert(aiPath, pngPath, 'png');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ AI to PNG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ AI to PNG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`AI to PNG conversion failed: ${error.message}`);
            console.log('❌ AI to PNG conversion test failed:', error.message);
        }
    }

    /**
     * Test AI to EPS conversion
     */
    async testAiToEps() {
        console.log('\n📋 Testing AI to EPS conversion...');
        
        try {
            const aiPath = await this.createSampleAiFile();
            const epsPath = path.join(this.testDir, 'test-converted.eps');
            
            const result = await this.converter.convert(aiPath, epsPath, 'eps');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ AI to EPS conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ AI to EPS conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`AI to EPS conversion failed: ${error.message}`);
            console.log('❌ AI to EPS conversion test failed:', error.message);
        }
    }

    /**
     * Test CDR to SVG conversion
     */
    async testCdrToSvg() {
        console.log('\n📋 Testing CDR to SVG conversion...');
        
        try {
            const cdrPath = await this.createSampleCdrFile();
            const svgPath = path.join(this.testDir, 'test-converted2.svg');
            
            const result = await this.converter.convert(cdrPath, svgPath, 'svg');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CDR to SVG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CDR to SVG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CDR to SVG conversion failed: ${error.message}`);
            console.log('❌ CDR to SVG conversion test failed:', error.message);
        }
    }

    /**
     * Test CDR to PNG conversion
     */
    async testCdrToPng() {
        console.log('\n📋 Testing CDR to PNG conversion...');
        
        try {
            const cdrPath = await this.createSampleCdrFile();
            const pngPath = path.join(this.testDir, 'test-converted2.png');
            
            const result = await this.converter.convert(cdrPath, pngPath, 'png');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CDR to PNG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CDR to PNG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CDR to PNG conversion failed: ${error.message}`);
            console.log('❌ CDR to PNG conversion test failed:', error.message);
        }
    }

    /**
     * Test CDR to PDF conversion
     */
    async testCdrToPdf() {
        console.log('\n📋 Testing CDR to PDF conversion...');
        
        try {
            const cdrPath = await this.createSampleCdrFile();
            const pdfPath = path.join(this.testDir, 'test-converted2.pdf');
            
            const result = await this.converter.convert(cdrPath, pdfPath, 'pdf');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CDR to PDF conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CDR to PDF conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CDR to PDF conversion failed: ${error.message}`);
            console.log('❌ CDR to PDF conversion test failed:', error.message);
        }
    }

    /**
     * Test CDR to EPS conversion
     */
    async testCdrToEps() {
        console.log('\n📋 Testing CDR to EPS conversion...');
        
        try {
            const cdrPath = await this.createSampleCdrFile();
            const epsPath = path.join(this.testDir, 'test-converted2.eps');
            
            const result = await this.converter.convert(cdrPath, epsPath, 'eps');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CDR to EPS conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CDR to EPS conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CDR to EPS conversion failed: ${error.message}`);
            console.log('❌ CDR to EPS conversion test failed:', error.message);
        }
    }

    /**
     * Test SVG conversions
     */
    async testSvgToPdf() {
        console.log('\n📋 Testing SVG to PDF conversion...');
        
        try {
            const svgPath = await this.createSampleSvgFile();
            const pdfPath = path.join(this.testDir, 'test-svg-to-pdf.pdf');
            
            const result = await this.converter.convert(svgPath, pdfPath, 'pdf');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ SVG to PDF conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ SVG to PDF conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`SVG to PDF conversion failed: ${error.message}`);
            console.log('❌ SVG to PDF conversion test failed:', error.message);
        }
    }

    async testSvgToPng() {
        console.log('\n📋 Testing SVG to PNG conversion...');
        
        try {
            const svgPath = await this.createSampleSvgFile();
            const pngPath = path.join(this.testDir, 'test-svg-to-png.png');
            
            const result = await this.converter.convert(svgPath, pngPath, 'png');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ SVG to PNG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ SVG to PNG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`SVG to PNG conversion failed: ${error.message}`);
            console.log('❌ SVG to PNG conversion test failed:', error.message);
        }
    }

    async testSvgToJpg() {
        console.log('\n📋 Testing SVG to JPG conversion...');
        
        try {
            const svgPath = await this.createSampleSvgFile();
            const jpgPath = path.join(this.testDir, 'test-svg-to-jpg.jpg');
            
            const result = await this.converter.convert(svgPath, jpgPath, 'jpg');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ SVG to JPG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ SVG to JPG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`SVG to JPG conversion failed: ${error.message}`);
            console.log('❌ SVG to JPG conversion test failed:', error.message);
        }
    }

    async testSvgToEps() {
        console.log('\n📋 Testing SVG to EPS conversion...');
        
        try {
            const svgPath = await this.createSampleSvgFile();
            const epsPath = path.join(this.testDir, 'test-svg-to-eps.eps');
            
            const result = await this.converter.convert(svgPath, epsPath, 'eps');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ SVG to EPS conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ SVG to EPS conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`SVG to EPS conversion failed: ${error.message}`);
            console.log('❌ SVG to EPS conversion test failed:', error.message);
        }
    }

    async testSvgToAi() {
        console.log('\n📋 Testing SVG to AI conversion...');
        
        try {
            const svgPath = await this.createSampleSvgFile();
            const aiPath = path.join(this.testDir, 'test-svg-to-ai.ai');
            
            const result = await this.converter.convert(svgPath, aiPath, 'ai');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ SVG to AI conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ SVG to AI conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`SVG to AI conversion failed: ${error.message}`);
            console.log('❌ SVG to AI conversion test failed:', error.message);
        }
    }

    /**
     * Test PDF conversions
     */
    async testPdfToSvg() {
        console.log('\n📋 Testing PDF to SVG conversion...');
        
        try {
            const pdfPath = await this.createSamplePdfFile();
            const svgPath = path.join(this.testDir, 'test-pdf-to-svg.svg');
            
            const result = await this.converter.convert(pdfPath, svgPath, 'svg');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ PDF to SVG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ PDF to SVG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`PDF to SVG conversion failed: ${error.message}`);
            console.log('❌ PDF to SVG conversion test failed:', error.message);
        }
    }

    async testPdfToPng() {
        console.log('\n📋 Testing PDF to PNG conversion...');
        
        try {
            const pdfPath = await this.createSamplePdfFile();
            const pngPath = path.join(this.testDir, 'test-pdf-to-png.png');
            
            const result = await this.converter.convert(pdfPath, pngPath, 'png');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ PDF to PNG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ PDF to PNG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`PDF to PNG conversion failed: ${error.message}`);
            console.log('❌ PDF to PNG conversion test failed:', error.message);
        }
    }

    async testPdfToJpg() {
        console.log('\n📋 Testing PDF to JPG conversion...');
        
        try {
            const pdfPath = await this.createSamplePdfFile();
            const jpgPath = path.join(this.testDir, 'test-pdf-to-jpg.jpg');
            
            const result = await this.converter.convert(pdfPath, jpgPath, 'jpg');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ PDF to JPG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ PDF to JPG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`PDF to JPG conversion failed: ${error.message}`);
            console.log('❌ PDF to JPG conversion test failed:', error.message);
        }
    }

    async testPdfToEps() {
        console.log('\n📋 Testing PDF to EPS conversion...');
        
        try {
            const pdfPath = await this.createSamplePdfFile();
            const epsPath = path.join(this.testDir, 'test-pdf-to-eps.eps');
            
            const result = await this.converter.convert(pdfPath, epsPath, 'eps');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ PDF to EPS conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ PDF to EPS conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`PDF to EPS conversion failed: ${error.message}`);
            console.log('❌ PDF to EPS conversion test failed:', error.message);
        }
    }

    async testPdfToAi() {
        console.log('\n📋 Testing PDF to AI conversion...');
        
        try {
            const pdfPath = await this.createSamplePdfFile();
            const aiPath = path.join(this.testDir, 'test-pdf-to-ai.ai');
            
            const result = await this.converter.convert(pdfPath, aiPath, 'ai');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ PDF to AI conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ PDF to AI conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`PDF to AI conversion failed: ${error.message}`);
            console.log('❌ PDF to AI conversion test failed:', error.message);
        }
    }

    /**
     * Test EPS conversions
     */
    async testEpsToSvg() {
        console.log('\n📋 Testing EPS to SVG conversion...');
        
        try {
            const epsPath = await this.createSampleEpsFile();
            const svgPath = path.join(this.testDir, 'test-eps-to-svg.svg');
            
            const result = await this.converter.convert(epsPath, svgPath, 'svg');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ EPS to SVG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ EPS to SVG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`EPS to SVG conversion failed: ${error.message}`);
            console.log('❌ EPS to SVG conversion test failed:', error.message);
        }
    }

    async testEpsToPdf() {
        console.log('\n📋 Testing EPS to PDF conversion...');
        
        try {
            const epsPath = await this.createSampleEpsFile();
            const pdfPath = path.join(this.testDir, 'test-eps-to-pdf.pdf');
            
            const result = await this.converter.convert(epsPath, pdfPath, 'pdf');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ EPS to PDF conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ EPS to PDF conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`EPS to PDF conversion failed: ${error.message}`);
            console.log('❌ EPS to PDF conversion test failed:', error.message);
        }
    }

    async testEpsToPng() {
        console.log('\n📋 Testing EPS to PNG conversion...');
        
        try {
            const epsPath = await this.createSampleEpsFile();
            const pngPath = path.join(this.testDir, 'test-eps-to-png.png');
            
            const result = await this.converter.convert(epsPath, pngPath, 'png');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ EPS to PNG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ EPS to PNG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`EPS to PNG conversion failed: ${error.message}`);
            console.log('❌ EPS to PNG conversion test failed:', error.message);
        }
    }

    async testEpsToJpg() {
        console.log('\n📋 Testing EPS to JPG conversion...');
        
        try {
            const epsPath = await this.createSampleEpsFile();
            const jpgPath = path.join(this.testDir, 'test-eps-to-jpg.jpg');
            
            const result = await this.converter.convert(epsPath, jpgPath, 'jpg');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ EPS to JPG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ EPS to JPG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`EPS to JPG conversion failed: ${error.message}`);
            console.log('❌ EPS to JPG conversion test failed:', error.message);
        }
    }

    async testEpsToAi() {
        console.log('\n📋 Testing EPS to AI conversion...');
        
        try {
            const epsPath = await this.createSampleEpsFile();
            const aiPath = path.join(this.testDir, 'test-eps-to-ai.ai');
            
            const result = await this.converter.convert(epsPath, aiPath, 'ai');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ EPS to AI conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ EPS to AI conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`EPS to AI conversion failed: ${error.message}`);
            console.log('❌ EPS to AI conversion test failed:', error.message);
        }
    }

    /**
     * Test vector metadata
     */
    async testVectorMetadata() {
        console.log('\n📋 Testing vector metadata...');
        
        try {
            const svgPath = await this.createSampleSvgFile();
            const metadata = await this.converter.getVectorMetadata(svgPath);
            
            if (metadata && metadata.format && metadata.size > 0) {
                this.results.passed++;
                console.log('✅ Vector metadata test passed');
                console.log(`   Format: ${metadata.format}, Size: ${metadata.size}`);
            } else {
                this.results.failed++;
                console.log('❌ Vector metadata test failed - invalid metadata returned');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Vector metadata failed: ${error.message}`);
            console.log('❌ Vector metadata test failed:', error.message);
        }
    }

    /**
     * Test vector validation
     */
    async testVectorValidation() {
        console.log('\n📋 Testing vector validation...');
        
        try {
            const svgPath = await this.createSampleSvgFile();
            const isValid = await this.converter.validateVectorFile(svgPath);
            
            if (isValid) {
                this.results.passed++;
                console.log('✅ Vector validation test passed');
            } else {
                this.results.failed++;
                console.log('❌ Vector validation test failed - file not valid');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Vector validation failed: ${error.message}`);
            console.log('❌ Vector validation test failed:', error.message);
        }
    }

    /**
     * Test vector optimization
     */
    async testVectorOptimization() {
        console.log('\n📋 Testing vector optimization...');
        
        try {
            const svgPath = await this.createSampleSvgFile();
            const optimizedPath = path.join(this.testDir, 'test-optimized.svg');
            
            const result = await this.converter.optimizeVectorFile(svgPath, optimizedPath);
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ Vector optimization test passed');
            } else {
                this.results.failed++;
                console.log('❌ Vector optimization test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Vector optimization failed: ${error.message}`);
            console.log('❌ Vector optimization test failed:', error.message);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('\n📋 Testing error handling...');
        
        try {
            // Test with non-existent file
            const nonExistentPath = path.join(this.testDir, 'non-existent.ai');
            const outputPath = path.join(this.testDir, 'output.svg');
            
            await this.converter.convert(nonExistentPath, outputPath, 'svg');
            
            this.results.failed++;
            console.log('❌ Error handling test failed - should have thrown error');
        } catch (error) {
            this.results.passed++;
            console.log('✅ Error handling test passed - error properly caught');
        }
    }

    /**
     * Create sample AI file
     */
    async createSampleAiFile() {
        const aiPath = path.join(this.testDir, 'test.ai');
        const aiContent = `%!PS-Adobe-3.0
%%Creator: Adobe Illustrator
%%Title: Test AI File
%%CreationDate: 2024-01-01
%%BoundingBox: 0 0 612 792
%%EndComments
/Helvetica findfont 12 scalefont setfont
100 100 moveto
(Test AI File) show
showpage
%%EOF`;
        
        await fs.writeFile(aiPath, aiContent);
        return aiPath;
    }

    /**
     * Create sample CDR file
     */
    async createSampleCdrFile() {
        const cdrPath = path.join(this.testDir, 'test.cdr');
        // CDR files are binary, so we'll create a minimal valid structure
        const cdrHeader = Buffer.from([
            0x52, 0x49, 0x46, 0x46, // RIFF
            0x00, 0x00, 0x00, 0x00, // Size placeholder
            0x43, 0x44, 0x52, 0x20  // CDR 
        ]);
        
        await fs.writeFile(cdrPath, cdrHeader);
        return cdrPath;
    }

    /**
     * Create sample SVG file
     */
    async createSampleSvgFile() {
        const svgPath = path.join(this.testDir, 'test.svg');
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="blue"/>
  <text x="50" y="50" text-anchor="middle" fill="white">Test</text>
</svg>`;
        
        await fs.writeFile(svgPath, svgContent);
        return svgPath;
    }

    /**
     * Create sample PDF file
     */
    async createSamplePdfFile() {
        const pdfPath = path.join(this.testDir, 'test.pdf');
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 100 Td
(Test PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;
        
        await fs.writeFile(pdfPath, pdfContent);
        return pdfPath;
    }

    /**
     * Create sample EPS file
     */
    async createSampleEpsFile() {
        const epsPath = path.join(this.testDir, 'test.eps');
        const epsContent = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 100 100
%%Title: Test EPS File
%%Creator: Test
%%CreationDate: 2024-01-01
/Helvetica findfont 12 scalefont setfont
50 50 moveto
(Test EPS) show
showpage
%%EOF`;
        
        await fs.writeFile(epsPath, epsContent);
        return epsPath;
    }

    /**
     * Print test results
     */
    async printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 VECTOR/GRAPHIC CONVERSION TEST RESULTS');
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
        
        console.log('\n' + '='.repeat(50));
        
        if (this.results.failed === 0) {
            console.log('🎉 All vector/graphic conversion tests passed!');
        } else {
            console.log('⚠️  Some tests failed. Please check the errors above.');
        }
    }

    /**
     * Cleanup test files
     */
    async cleanup() {
        try {
            const files = await fs.readdir(this.testDir);
            for (const file of files) {
                await fs.unlink(path.join(this.testDir, file));
            }
            await fs.rmdir(this.testDir);
            console.log('🧹 Test cleanup complete');
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

// Run tests
const tester = new VectorConversionTester();
tester.runTests().catch(console.error); 