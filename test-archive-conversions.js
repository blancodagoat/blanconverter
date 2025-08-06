/**
 * Archive Conversion Tests
 * Tests all archive/compression conversions
 */

const fs = require('fs').promises;
const path = require('path');
const ArchiveConverter = require('./src/server/archiveConverter');

class ArchiveConversionTester {
    constructor() {
        this.converter = new ArchiveConverter();
        this.testDir = path.join(__dirname, 'test-archives');
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
        console.log('🚀 Starting Archive Conversion Tests...\n');
        
        try {
            await this.setupTestEnvironment();
            
            // Test basic functionality
            await this.testSupportedFormats();
            await this.testMimeTypes();
            await this.testFileFormatDetection();
            
            // Test archive creation
            await this.testZipCreation();
            await this.testTarCreation();
            await this.testTarGzCreation();
            await this.testTarBz2Creation();
            await this.test7zCreation();
            
            // Test archive extraction
            await this.testZipExtraction();
            await this.testTarExtraction();
            await this.testTarGzExtraction();
            await this.testTarBz2Extraction();
            await this.test7zExtraction();
            await this.testGzExtraction();
            await this.testBz2Extraction();
            
            // Test archive conversions
            await this.testZipToRar();
            await this.testRarToZip();
            await this.testZipToTar();
            await this.testTarToZip();
            await this.testZipToTarGz();
            await this.testTarGzToZip();
            await this.testZipToTarBz2();
            await this.testTarBz2ToZip();
            await this.testZipTo7z();
            await this.test7zToZip();
            await this.testRarToTar();
            await this.testTarToRar();
            await this.testRarTo7z();
            await this.test7zToRar();
            
            // Test archive info and validation
            await this.testArchiveInfo();
            await this.testArchiveValidation();
            
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
        
        const expectedInput = ['zip', 'rar', 'tar', 'tar.gz', 'tar.bz2', '7z', 'gz', 'bz2'];
        const expectedOutput = ['zip', 'tar', 'tar.gz', 'tar.bz2', '7z'];
        
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
            { format: 'zip', expected: 'application/zip' },
            { format: 'rar', expected: 'application/vnd.rar' },
            { format: 'tar', expected: 'application/x-tar' },
            { format: 'tar.gz', expected: 'application/gzip' },
            { format: 'tar.bz2', expected: 'application/x-bzip2' },
            { format: '7z', expected: 'application/x-7z-compressed' },
            { format: 'gz', expected: 'application/gzip' },
            { format: 'bz2', expected: 'application/x-bzip2' }
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
            { filename: 'test.zip', expected: 'zip' },
            { filename: 'test.rar', expected: 'rar' },
            { filename: 'test.tar', expected: 'tar' },
            { filename: 'test.tar.gz', expected: 'tar.gz' },
            { filename: 'test.tar.bz2', expected: 'tar.bz2' },
            { filename: 'test.7z', expected: '7z' },
            { filename: 'test.gz', expected: 'gz' },
            { filename: 'test.bz2', expected: 'bz2' }
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
     * Test ZIP creation
     */
    async testZipCreation() {
        console.log('\n📋 Testing ZIP creation...');
        
        try {
            const testDir = path.join(this.testDir, 'zip-test');
            const zipPath = path.join(this.testDir, 'test.zip');
            
            await this.createTestFiles(testDir);
            await this.converter.compressToZip(testDir, zipPath);
            
            const exists = await fs.access(zipPath).then(() => true).catch(() => false);
            if (exists) {
                this.results.passed++;
                console.log('✅ ZIP creation test passed');
            } else {
                this.results.failed++;
                console.log('❌ ZIP creation test failed - file not created');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ ZIP creation test failed:', error.message);
        }
    }

    /**
     * Test TAR creation
     */
    async testTarCreation() {
        console.log('\n📋 Testing TAR creation...');
        
        try {
            const testDir = path.join(this.testDir, 'tar-test');
            const tarPath = path.join(this.testDir, 'test.tar');
            
            await this.createTestFiles(testDir);
            await this.converter.compressToTar(testDir, tarPath);
            
            const exists = await fs.access(tarPath).then(() => true).catch(() => false);
            if (exists) {
                this.results.passed++;
                console.log('✅ TAR creation test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR creation test failed - file not created');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR creation test failed:', error.message);
        }
    }

    /**
     * Test TAR.GZ creation
     */
    async testTarGzCreation() {
        console.log('\n📋 Testing TAR.GZ creation...');
        
        try {
            const testDir = path.join(this.testDir, 'targz-test');
            const tarGzPath = path.join(this.testDir, 'test.tar.gz');
            
            await this.createTestFiles(testDir);
            await this.converter.compressToTarGz(testDir, tarGzPath);
            
            const exists = await fs.access(tarGzPath).then(() => true).catch(() => false);
            if (exists) {
                this.results.passed++;
                console.log('✅ TAR.GZ creation test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR.GZ creation test failed - file not created');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR.GZ creation test failed:', error.message);
        }
    }

    /**
     * Test TAR.BZ2 creation
     */
    async testTarBz2Creation() {
        console.log('\n📋 Testing TAR.BZ2 creation...');
        
        try {
            const testDir = path.join(this.testDir, 'tarbz2-test');
            const tarBz2Path = path.join(this.testDir, 'test.tar.bz2');
            
            await this.createTestFiles(testDir);
            await this.converter.compressToTarBz2(testDir, tarBz2Path);
            
            const exists = await fs.access(tarBz2Path).then(() => true).catch(() => false);
            if (exists) {
                this.results.passed++;
                console.log('✅ TAR.BZ2 creation test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR.BZ2 creation test failed - file not created');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR.BZ2 creation test failed:', error.message);
        }
    }

    /**
     * Test 7Z creation
     */
    async test7zCreation() {
        console.log('\n📋 Testing 7Z creation...');
        
        try {
            const testDir = path.join(this.testDir, '7z-test');
            const sevenPath = path.join(this.testDir, 'test.7z');
            
            await this.createTestFiles(testDir);
            await this.converter.compressTo7z(testDir, sevenPath);
            
            const exists = await fs.access(sevenPath).then(() => true).catch(() => false);
            if (exists) {
                this.results.passed++;
                console.log('✅ 7Z creation test passed');
            } else {
                this.results.failed++;
                console.log('❌ 7Z creation test failed - file not created');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ 7Z creation test failed:', error.message);
        }
    }

    /**
     * Test ZIP extraction
     */
    async testZipExtraction() {
        console.log('\n📋 Testing ZIP extraction...');
        
        try {
            const testDir = path.join(this.testDir, 'zip-extract-test');
            const zipPath = path.join(this.testDir, 'test.zip');
            const extractDir = path.join(this.testDir, 'zip-extracted');
            
            await fs.mkdir(extractDir, { recursive: true });
            await this.converter.extractZip(zipPath, extractDir);
            
            const files = await fs.readdir(extractDir);
            if (files.length > 0) {
                this.results.passed++;
                console.log('✅ ZIP extraction test passed');
            } else {
                this.results.failed++;
                console.log('❌ ZIP extraction test failed - no files extracted');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ ZIP extraction test failed:', error.message);
        }
    }

    /**
     * Test TAR extraction
     */
    async testTarExtraction() {
        console.log('\n📋 Testing TAR extraction...');
        
        try {
            const tarPath = path.join(this.testDir, 'test.tar');
            const extractDir = path.join(this.testDir, 'tar-extracted');
            
            await fs.mkdir(extractDir, { recursive: true });
            await this.converter.extractTar(tarPath, extractDir);
            
            const files = await fs.readdir(extractDir);
            if (files.length > 0) {
                this.results.passed++;
                console.log('✅ TAR extraction test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR extraction test failed - no files extracted');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR extraction test failed:', error.message);
        }
    }

    /**
     * Test TAR.GZ extraction
     */
    async testTarGzExtraction() {
        console.log('\n📋 Testing TAR.GZ extraction...');
        
        try {
            const tarGzPath = path.join(this.testDir, 'test.tar.gz');
            const extractDir = path.join(this.testDir, 'targz-extracted');
            
            await fs.mkdir(extractDir, { recursive: true });
            await this.converter.extractTar(tarGzPath, extractDir);
            
            const files = await fs.readdir(extractDir);
            if (files.length > 0) {
                this.results.passed++;
                console.log('✅ TAR.GZ extraction test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR.GZ extraction test failed - no files extracted');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR.GZ extraction test failed:', error.message);
        }
    }

    /**
     * Test TAR.BZ2 extraction
     */
    async testTarBz2Extraction() {
        console.log('\n📋 Testing TAR.BZ2 extraction...');
        
        try {
            const tarBz2Path = path.join(this.testDir, 'test.tar.bz2');
            const extractDir = path.join(this.testDir, 'tarbz2-extracted');
            
            await fs.mkdir(extractDir, { recursive: true });
            await this.converter.extractTar(tarBz2Path, extractDir);
            
            const files = await fs.readdir(extractDir);
            if (files.length > 0) {
                this.results.passed++;
                console.log('✅ TAR.BZ2 extraction test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR.BZ2 extraction test failed - no files extracted');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR.BZ2 extraction test failed:', error.message);
        }
    }

    /**
     * Test 7Z extraction
     */
    async test7zExtraction() {
        console.log('\n📋 Testing 7Z extraction...');
        
        try {
            const sevenPath = path.join(this.testDir, 'test.7z');
            const extractDir = path.join(this.testDir, '7z-extracted');
            
            await fs.mkdir(extractDir, { recursive: true });
            await this.converter.extract7z(sevenPath, extractDir);
            
            const files = await fs.readdir(extractDir);
            if (files.length > 0) {
                this.results.passed++;
                console.log('✅ 7Z extraction test passed');
            } else {
                this.results.failed++;
                console.log('❌ 7Z extraction test failed - no files extracted');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ 7Z extraction test failed:', error.message);
        }
    }

    /**
     * Test GZ extraction
     */
    async testGzExtraction() {
        console.log('\n📋 Testing GZ extraction...');
        
        try {
            const gzPath = path.join(this.testDir, 'test.gz');
            const extractDir = path.join(this.testDir, 'gz-extracted');
            
            await fs.mkdir(extractDir, { recursive: true });
            await this.converter.extractGz(gzPath, extractDir);
            
            const files = await fs.readdir(extractDir);
            if (files.length > 0) {
                this.results.passed++;
                console.log('✅ GZ extraction test passed');
            } else {
                this.results.failed++;
                console.log('❌ GZ extraction test failed - no files extracted');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ GZ extraction test failed:', error.message);
        }
    }

    /**
     * Test BZ2 extraction
     */
    async testBz2Extraction() {
        console.log('\n📋 Testing BZ2 extraction...');
        
        try {
            const bz2Path = path.join(this.testDir, 'test.bz2');
            const extractDir = path.join(this.testDir, 'bz2-extracted');
            
            await fs.mkdir(extractDir, { recursive: true });
            await this.converter.extractBz2(bz2Path, extractDir);
            
            const files = await fs.readdir(extractDir);
            if (files.length > 0) {
                this.results.passed++;
                console.log('✅ BZ2 extraction test passed');
            } else {
                this.results.failed++;
                console.log('❌ BZ2 extraction test failed - no files extracted');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ BZ2 extraction test failed:', error.message);
        }
    }

    /**
     * Test ZIP to RAR conversion
     */
    async testZipToRar() {
        console.log('\n📋 Testing ZIP to RAR conversion...');
        
        try {
            const zipPath = path.join(this.testDir, 'test.zip');
            const rarPath = path.join(this.testDir, 'test-converted.rar');
            
            const result = await this.converter.convert(zipPath, rarPath, 'rar');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ ZIP to RAR conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ ZIP to RAR conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ ZIP to RAR conversion test failed:', error.message);
        }
    }

    /**
     * Test RAR to ZIP conversion
     */
    async testRarToZip() {
        console.log('\n📋 Testing RAR to ZIP conversion...');
        
        try {
            const rarPath = path.join(this.testDir, 'test.rar');
            const zipPath = path.join(this.testDir, 'test-converted.zip');
            
            const result = await this.converter.convert(rarPath, zipPath, 'zip');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ RAR to ZIP conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ RAR to ZIP conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ RAR to ZIP conversion test failed:', error.message);
        }
    }

    /**
     * Test ZIP to TAR conversion
     */
    async testZipToTar() {
        console.log('\n📋 Testing ZIP to TAR conversion...');
        
        try {
            const zipPath = path.join(this.testDir, 'test.zip');
            const tarPath = path.join(this.testDir, 'test-converted.tar');
            
            const result = await this.converter.convert(zipPath, tarPath, 'tar');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ ZIP to TAR conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ ZIP to TAR conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ ZIP to TAR conversion test failed:', error.message);
        }
    }

    /**
     * Test TAR to ZIP conversion
     */
    async testTarToZip() {
        console.log('\n📋 Testing TAR to ZIP conversion...');
        
        try {
            const tarPath = path.join(this.testDir, 'test.tar');
            const zipPath = path.join(this.testDir, 'test-converted2.zip');
            
            const result = await this.converter.convert(tarPath, zipPath, 'zip');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ TAR to ZIP conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR to ZIP conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR to ZIP conversion test failed:', error.message);
        }
    }

    /**
     * Test ZIP to TAR.GZ conversion
     */
    async testZipToTarGz() {
        console.log('\n📋 Testing ZIP to TAR.GZ conversion...');
        
        try {
            const zipPath = path.join(this.testDir, 'test.zip');
            const tarGzPath = path.join(this.testDir, 'test-converted.tar.gz');
            
            const result = await this.converter.convert(zipPath, tarGzPath, 'tar.gz');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ ZIP to TAR.GZ conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ ZIP to TAR.GZ conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ ZIP to TAR.GZ conversion test failed:', error.message);
        }
    }

    /**
     * Test TAR.GZ to ZIP conversion
     */
    async testTarGzToZip() {
        console.log('\n📋 Testing TAR.GZ to ZIP conversion...');
        
        try {
            const tarGzPath = path.join(this.testDir, 'test.tar.gz');
            const zipPath = path.join(this.testDir, 'test-converted3.zip');
            
            const result = await this.converter.convert(tarGzPath, zipPath, 'zip');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ TAR.GZ to ZIP conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR.GZ to ZIP conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR.GZ to ZIP conversion test failed:', error.message);
        }
    }

    /**
     * Test ZIP to TAR.BZ2 conversion
     */
    async testZipToTarBz2() {
        console.log('\n📋 Testing ZIP to TAR.BZ2 conversion...');
        
        try {
            const zipPath = path.join(this.testDir, 'test.zip');
            const tarBz2Path = path.join(this.testDir, 'test-converted.tar.bz2');
            
            const result = await this.converter.convert(zipPath, tarBz2Path, 'tar.bz2');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ ZIP to TAR.BZ2 conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ ZIP to TAR.BZ2 conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ ZIP to TAR.BZ2 conversion test failed:', error.message);
        }
    }

    /**
     * Test TAR.BZ2 to ZIP conversion
     */
    async testTarBz2ToZip() {
        console.log('\n📋 Testing TAR.BZ2 to ZIP conversion...');
        
        try {
            const tarBz2Path = path.join(this.testDir, 'test.tar.bz2');
            const zipPath = path.join(this.testDir, 'test-converted4.zip');
            
            const result = await this.converter.convert(tarBz2Path, zipPath, 'zip');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ TAR.BZ2 to ZIP conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR.BZ2 to ZIP conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR.BZ2 to ZIP conversion test failed:', error.message);
        }
    }

    /**
     * Test ZIP to 7Z conversion
     */
    async testZipTo7z() {
        console.log('\n📋 Testing ZIP to 7Z conversion...');
        
        try {
            const zipPath = path.join(this.testDir, 'test.zip');
            const sevenPath = path.join(this.testDir, 'test-converted.7z');
            
            const result = await this.converter.convert(zipPath, sevenPath, '7z');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ ZIP to 7Z conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ ZIP to 7Z conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ ZIP to 7Z conversion test failed:', error.message);
        }
    }

    /**
     * Test 7Z to ZIP conversion
     */
    async test7zToZip() {
        console.log('\n📋 Testing 7Z to ZIP conversion...');
        
        try {
            const sevenPath = path.join(this.testDir, 'test.7z');
            const zipPath = path.join(this.testDir, 'test-converted5.zip');
            
            const result = await this.converter.convert(sevenPath, zipPath, 'zip');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ 7Z to ZIP conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ 7Z to ZIP conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ 7Z to ZIP conversion test failed:', error.message);
        }
    }

    /**
     * Test RAR to TAR conversion
     */
    async testRarToTar() {
        console.log('\n📋 Testing RAR to TAR conversion...');
        
        try {
            const rarPath = path.join(this.testDir, 'test.rar');
            const tarPath = path.join(this.testDir, 'test-converted2.tar');
            
            const result = await this.converter.convert(rarPath, tarPath, 'tar');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ RAR to TAR conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ RAR to TAR conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ RAR to TAR conversion test failed:', error.message);
        }
    }

    /**
     * Test TAR to RAR conversion
     */
    async testTarToRar() {
        console.log('\n📋 Testing TAR to RAR conversion...');
        
        try {
            const tarPath = path.join(this.testDir, 'test.tar');
            const rarPath = path.join(this.testDir, 'test-converted2.rar');
            
            const result = await this.converter.convert(tarPath, rarPath, 'rar');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ TAR to RAR conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ TAR to RAR conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ TAR to RAR conversion test failed:', error.message);
        }
    }

    /**
     * Test RAR to 7Z conversion
     */
    async testRarTo7z() {
        console.log('\n📋 Testing RAR to 7Z conversion...');
        
        try {
            const rarPath = path.join(this.testDir, 'test.rar');
            const sevenPath = path.join(this.testDir, 'test-converted2.7z');
            
            const result = await this.converter.convert(rarPath, sevenPath, '7z');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ RAR to 7Z conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ RAR to 7Z conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ RAR to 7Z conversion test failed:', error.message);
        }
    }

    /**
     * Test 7Z to RAR conversion
     */
    async test7zToRar() {
        console.log('\n📋 Testing 7Z to RAR conversion...');
        
        try {
            const sevenPath = path.join(this.testDir, 'test.7z');
            const rarPath = path.join(this.testDir, 'test-converted3.rar');
            
            const result = await this.converter.convert(sevenPath, rarPath, 'rar');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ 7Z to RAR conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ 7Z to RAR conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ 7Z to RAR conversion test failed:', error.message);
        }
    }

    /**
     * Test archive info
     */
    async testArchiveInfo() {
        console.log('\n📋 Testing archive info...');
        
        try {
            const zipPath = path.join(this.testDir, 'test.zip');
            const info = await this.converter.getArchiveInfo(zipPath);
            
            if (info && info.format && info.size > 0) {
                this.results.passed++;
                console.log('✅ Archive info test passed');
                console.log(`   Format: ${info.format}, Size: ${info.size}, Files: ${info.fileCount}`);
            } else {
                this.results.failed++;
                console.log('❌ Archive info test failed - invalid info returned');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ Archive info test failed:', error.message);
        }
    }

    /**
     * Test archive validation
     */
    async testArchiveValidation() {
        console.log('\n📋 Testing archive validation...');
        
        try {
            const zipPath = path.join(this.testDir, 'test.zip');
            const isValid = await this.converter.validateArchive(zipPath);
            
            if (isValid) {
                this.results.passed++;
                console.log('✅ Archive validation test passed');
            } else {
                this.results.failed++;
                console.log('❌ Archive validation test failed - archive not valid');
            }
        } catch (error) {
            this.results.failed++;
            console.log('❌ Archive validation test failed:', error.message);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('\n📋 Testing error handling...');
        
        try {
            // Test with non-existent file
            const nonExistentPath = path.join(this.testDir, 'non-existent.zip');
            const outputPath = path.join(this.testDir, 'output.zip');
            
            await this.converter.convert(nonExistentPath, outputPath, 'zip');
            
            this.results.failed++;
            console.log('❌ Error handling test failed - should have thrown error');
        } catch (error) {
            this.results.passed++;
            console.log('✅ Error handling test passed - error properly caught');
        }
    }

    /**
     * Create test files
     */
    async createTestFiles(testDir) {
        await fs.mkdir(testDir, { recursive: true });
        
        const testFiles = [
            { name: 'test1.txt', content: 'This is test file 1' },
            { name: 'test2.txt', content: 'This is test file 2' },
            { name: 'subdir/test3.txt', content: 'This is test file 3 in subdirectory' }
        ];
        
        for (const file of testFiles) {
            const filePath = path.join(testDir, file.name);
            const dirPath = path.dirname(filePath);
            
            await fs.mkdir(dirPath, { recursive: true });
            await fs.writeFile(filePath, file.content);
        }
    }

    /**
     * Print test results
     */
    async printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 ARCHIVE CONVERSION TEST RESULTS');
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
            console.log('\n🎉 All archive conversion tests passed!');
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
const tester = new ArchiveConversionTester();
tester.runTests().catch(console.error); 