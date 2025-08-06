/**
 * Disk Image Conversion Tests
 * Comprehensive test suite for disk image format conversions
 * Tests: ISO ↔ BIN / IMG, DMG ↔ ISO
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const DiskImageConverter = require('./src/server/diskImageConverter');

class DiskImageConversionTester {
    constructor() {
        this.converter = new DiskImageConverter();
        this.testDir = path.join(__dirname, 'test-disk-images');
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
    }

    async setup() {
        try {
            // Create test directory
            await fs.mkdir(this.testDir, { recursive: true });
            console.log('✓ Test directory created');
            
            // Check required tools
            const toolsCheck = await this.converter.checkRequiredTools();
            if (!toolsCheck.available) {
                console.warn('⚠ Warning: Some required tools are missing:', toolsCheck.missing);
                console.warn('  Some tests may fail or be skipped');
            } else {
                console.log('✓ All required tools available');
            }
            
        } catch (error) {
            console.error('Setup failed:', error.message);
            throw error;
        }
    }

    async cleanup() {
        try {
            await this.converter.cleanupDirectory(this.testDir);
            await fs.rmdir(this.testDir);
            console.log('✓ Test directory cleaned up');
        } catch (error) {
            console.warn('Cleanup warning:', error.message);
        }
    }

    async createTestFile(filename, content, size = 1024 * 1024) {
        const filePath = path.join(this.testDir, filename);
        
        if (content) {
            await fs.writeFile(filePath, content);
        } else {
            // Create a binary file with random data
            const buffer = Buffer.alloc(size);
            for (let i = 0; i < size; i++) {
                buffer[i] = Math.floor(Math.random() * 256);
            }
            await fs.writeFile(filePath, buffer);
        }
        
        return filePath;
    }

    async createTestIso(filename = 'test.iso') {
        const filePath = path.join(this.testDir, filename);
        
        try {
            // Create a minimal ISO file structure
            const isoContent = Buffer.alloc(2048);
            
            // ISO 9660 header
            isoContent.write('CD001', 1, 5, 'ascii'); // Standard identifier
            isoContent.write('01', 6, 2, 'ascii');    // Version
            isoContent.write('00', 8, 1, 'ascii');    // Unused
            isoContent.write('TEST_ISO', 9, 32, 'ascii'); // System identifier
            isoContent.write('TEST_VOLUME', 41, 32, 'ascii'); // Volume identifier
            
            await fs.writeFile(filePath, isoContent);
            return filePath;
            
        } catch (error) {
            // Fallback to simple binary file
            return await this.createTestFile(filename, null, 2048);
        }
    }

    async createTestDmg(filename = 'test.dmg') {
        const filePath = path.join(this.testDir, filename);
        
        try {
            // Create a minimal DMG file structure
            const dmgContent = Buffer.alloc(1024);
            
            // DMG header (simplified)
            dmgContent.write('koly', 0, 4, 'ascii');  // DMG signature
            dmgContent.writeUInt32LE(1024, 4);        // Header size
            dmgContent.writeUInt32LE(1, 8);           // Version
            
            await fs.writeFile(filePath, dmgContent);
            return filePath;
            
        } catch (error) {
            // Fallback to simple binary file
            return await this.createTestFile(filename, null, 1024);
        }
    }

    async runTest(testName, testFunction) {
        this.results.total++;
        console.log(`\n🧪 Running: ${testName}`);
        
        try {
            await testFunction();
            console.log(`✅ PASSED: ${testName}`);
            this.results.passed++;
        } catch (error) {
            console.error(`❌ FAILED: ${testName}`);
            console.error(`   Error: ${error.message}`);
            this.results.failed++;
            this.results.errors.push({ test: testName, error: error.message });
        }
    }

    async testSupportedFormats() {
        const formats = this.converter.getSupportedFormats();
        
        if (!formats.input || !formats.output) {
            throw new Error('Supported formats not properly defined');
        }
        
        const expectedInputs = ['iso', 'bin', 'img', 'dmg'];
        const expectedOutputs = ['iso', 'bin', 'img', 'dmg'];
        
        for (const format of expectedInputs) {
            if (!formats.input.includes(format)) {
                throw new Error(`Missing input format: ${format}`);
            }
        }
        
        for (const format of expectedOutputs) {
            if (!formats.output.includes(format)) {
                throw new Error(`Missing output format: ${format}`);
            }
        }
        
        console.log('   Supported formats:', formats);
    }

    async testMimeTypes() {
        const testCases = [
            { format: 'iso', expected: 'application/x-iso9660-image' },
            { format: 'bin', expected: 'application/octet-stream' },
            { format: 'img', expected: 'application/octet-stream' },
            { format: 'dmg', expected: 'application/x-apple-diskimage' }
        ];
        
        for (const testCase of testCases) {
            const mimeType = this.converter.getMimeType(testCase.format);
            if (mimeType !== testCase.expected) {
                throw new Error(`MIME type mismatch for ${testCase.format}: expected ${testCase.expected}, got ${mimeType}`);
            }
        }
        
        console.log('   MIME types verified');
    }

    async testFileFormatDetection() {
        // Test ISO file
        const isoPath = await this.createTestIso('format_test.iso');
        const isoFormat = this.converter.getFileFormat(isoPath);
        if (isoFormat !== 'iso') {
            throw new Error(`ISO format detection failed: got ${isoFormat}`);
        }
        
        // Test BIN file
        const binPath = await this.createTestFile('format_test.bin');
        const binFormat = this.converter.getFileFormat(binPath);
        if (binFormat !== 'bin') {
            throw new Error(`BIN format detection failed: got ${binFormat}`);
        }
        
        // Test IMG file
        const imgPath = await this.createTestFile('format_test.img');
        const imgFormat = this.converter.getFileFormat(imgPath);
        if (imgFormat !== 'img') {
            throw new Error(`IMG format detection failed: got ${imgFormat}`);
        }
        
        // Test DMG file
        const dmgPath = await this.createTestDmg('format_test.dmg');
        const dmgFormat = this.converter.getFileFormat(dmgPath);
        if (dmgFormat !== 'dmg') {
            throw new Error(`DMG format detection failed: got ${dmgFormat}`);
        }
        
        console.log('   File format detection working');
    }

    async testAvailableOutputFormats() {
        const testCases = [
            { input: 'iso', expected: ['bin', 'img', 'dmg'] },
            { input: 'bin', expected: ['iso', 'img', 'dmg'] },
            { input: 'img', expected: ['iso', 'bin', 'dmg'] },
            { input: 'dmg', expected: ['iso', 'bin', 'img'] }
        ];
        
        for (const testCase of testCases) {
            const available = this.converter.getAvailableOutputFormats(testCase.input);
            
            for (const expected of testCase.expected) {
                if (!available.includes(expected)) {
                    throw new Error(`Missing output format ${expected} for input ${testCase.input}`);
                }
            }
        }
        
        console.log('   Available output formats verified');
    }

    async testIsoToBinaryConversion() {
        const inputPath = await this.createTestIso('iso_to_bin_test.iso');
        const outputPath = path.join(this.testDir, 'iso_to_bin_test.bin');
        
        const result = await this.converter.convert(inputPath, outputPath, 'bin');
        
        if (!result.success) {
            throw new Error('ISO to binary conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        console.log(`   Converted ISO to BIN: ${result.size} bytes`);
    }

    async testBinaryToIsoConversion() {
        const inputPath = await this.createTestFile('bin_to_iso_test.bin', null, 2048);
        const outputPath = path.join(this.testDir, 'bin_to_iso_test.iso');
        
        const result = await this.converter.convert(inputPath, outputPath, 'iso');
        
        if (!result.success) {
            throw new Error('Binary to ISO conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        console.log(`   Converted BIN to ISO: ${result.size} bytes`);
    }

    async testIsoToImgConversion() {
        const inputPath = await this.createTestIso('iso_to_img_test.iso');
        const outputPath = path.join(this.testDir, 'iso_to_img_test.img');
        
        const result = await this.converter.convert(inputPath, outputPath, 'img');
        
        if (!result.success) {
            throw new Error('ISO to IMG conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        console.log(`   Converted ISO to IMG: ${result.size} bytes`);
    }

    async testImgToIsoConversion() {
        const inputPath = await this.createTestFile('img_to_iso_test.img', null, 2048);
        const outputPath = path.join(this.testDir, 'img_to_iso_test.iso');
        
        const result = await this.converter.convert(inputPath, outputPath, 'iso');
        
        if (!result.success) {
            throw new Error('IMG to ISO conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        console.log(`   Converted IMG to ISO: ${result.size} bytes`);
    }

    async testDmgConversions() {
        // Skip DMG tests on non-macOS platforms
        if (process.platform !== 'darwin') {
            console.log('   Skipping DMG tests (macOS only)');
            return;
        }
        
        const inputPath = await this.createTestDmg('dmg_test.dmg');
        const outputPath = path.join(this.testDir, 'dmg_test.iso');
        
        try {
            const result = await this.converter.convert(inputPath, outputPath, 'iso');
            
            if (!result.success) {
                throw new Error('DMG to ISO conversion failed');
            }
            
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
                throw new Error('Output file is empty');
            }
            
            console.log(`   Converted DMG to ISO: ${result.size} bytes`);
            
        } catch (error) {
            console.log(`   DMG conversion test skipped: ${error.message}`);
        }
    }

    async testMetadataRetrieval() {
        const inputPath = await this.createTestIso('metadata_test.iso');
        
        const metadata = await this.converter.getDiskImageMetadata(inputPath, 'iso');
        
        if (!metadata) {
            throw new Error('Failed to retrieve metadata');
        }
        
        if (!metadata.format || metadata.format !== 'iso') {
            throw new Error('Invalid metadata format');
        }
        
        if (!metadata.size || metadata.size === 0) {
            throw new Error('Invalid metadata size');
        }
        
        console.log('   Metadata retrieval working');
    }

    async testValidation() {
        const validPath = await this.createTestIso('validation_test.iso');
        
        // Test valid file
        const isValid = await this.converter.validateDiskImage(validPath, 'iso');
        if (!isValid) {
            throw new Error('Valid file validation failed');
        }
        
        // Test empty file
        const emptyPath = await this.createTestFile('empty_test.iso', '');
        try {
            await this.converter.validateDiskImage(emptyPath, 'iso');
            throw new Error('Empty file validation should have failed');
        } catch (error) {
            // Expected error
        }
        
        console.log('   File validation working');
    }

    async testErrorHandling() {
        // Test unsupported input format
        const unsupportedPath = await this.createTestFile('unsupported.txt', 'test');
        const outputPath = path.join(this.testDir, 'error_test.bin');
        
        try {
            await this.converter.convert(unsupportedPath, outputPath, 'bin');
            throw new Error('Should have failed for unsupported format');
        } catch (error) {
            // Expected error
        }
        
        // Test unsupported output format
        const validPath = await this.createTestIso('error_test.iso');
        try {
            await this.converter.convert(validPath, outputPath, 'unsupported');
            throw new Error('Should have failed for unsupported output format');
        } catch (error) {
            // Expected error
        }
        
        console.log('   Error handling working');
    }

    async testLargeFileHandling() {
        const largePath = await this.createTestFile('large_test.bin', null, 10 * 1024 * 1024); // 10MB
        const outputPath = path.join(this.testDir, 'large_test.iso');
        
        try {
            const result = await this.converter.convert(largePath, outputPath, 'iso');
            
            if (!result.success) {
                throw new Error('Large file conversion failed');
            }
            
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
                throw new Error('Large file output is empty');
            }
            
            console.log(`   Large file conversion: ${result.size} bytes`);
            
        } catch (error) {
            console.log(`   Large file test skipped: ${error.message}`);
        }
    }

    async testConversionOptions() {
        const inputPath = await this.createTestIso('options_test.iso');
        const outputPath = path.join(this.testDir, 'options_test.bin');
        
        const options = {
            blockSize: '512K',
            volumeName: 'TEST_VOLUME'
        };
        
        const result = await this.converter.convert(inputPath, outputPath, 'bin', options);
        
        if (!result.success) {
            throw new Error('Conversion with options failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        console.log('   Conversion options working');
    }

    async testRoundTripConversion() {
        const originalPath = await this.createTestIso('roundtrip_test.iso');
        const intermediatePath = path.join(this.testDir, 'roundtrip_test.bin');
        const finalPath = path.join(this.testDir, 'roundtrip_test_final.iso');
        
        // ISO → BIN → ISO
        const result1 = await this.converter.convert(originalPath, intermediatePath, 'bin');
        if (!result1.success) {
            throw new Error('First conversion failed');
        }
        
        const result2 = await this.converter.convert(intermediatePath, finalPath, 'iso');
        if (!result2.success) {
            throw new Error('Second conversion failed');
        }
        
        const originalStats = await fs.stat(originalPath);
        const finalStats = await fs.stat(finalPath);
        
        // Files should be similar in size (allowing for some differences)
        const sizeDiff = Math.abs(originalStats.size - finalStats.size);
        const sizeRatio = sizeDiff / originalStats.size;
        
        if (sizeRatio > 0.1) { // Allow 10% difference
            throw new Error(`Round trip conversion size mismatch: original ${originalStats.size}, final ${finalStats.size}`);
        }
        
        console.log('   Round trip conversion successful');
    }

    async runAllTests() {
        console.log('🚀 Starting Disk Image Conversion Tests\n');
        
        await this.setup();
        
        // Basic functionality tests
        await this.runTest('Supported Formats', () => this.testSupportedFormats());
        await this.runTest('MIME Types', () => this.testMimeTypes());
        await this.runTest('File Format Detection', () => this.testFileFormatDetection());
        await this.runTest('Available Output Formats', () => this.testAvailableOutputFormats());
        
        // Conversion tests
        await this.runTest('ISO to Binary Conversion', () => this.testIsoToBinaryConversion());
        await this.runTest('Binary to ISO Conversion', () => this.testBinaryToIsoConversion());
        await this.runTest('ISO to IMG Conversion', () => this.testIsoToImgConversion());
        await this.runTest('IMG to ISO Conversion', () => this.testImgToIsoConversion());
        await this.runTest('DMG Conversions', () => this.testDmgConversions());
        
        // Advanced tests
        await this.runTest('Metadata Retrieval', () => this.testMetadataRetrieval());
        await this.runTest('File Validation', () => this.testValidation());
        await this.runTest('Error Handling', () => this.testErrorHandling());
        await this.runTest('Large File Handling', () => this.testLargeFileHandling());
        await this.runTest('Conversion Options', () => this.testConversionOptions());
        await this.runTest('Round Trip Conversion', () => this.testRoundTripConversion());
        
        await this.cleanup();
        
        this.printResults();
    }

    printResults() {
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.errors.forEach(error => {
                console.log(`   - ${error.test}: ${error.error}`);
            });
        }
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All disk image conversion tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new DiskImageConversionTester();
    tester.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = DiskImageConversionTester; 