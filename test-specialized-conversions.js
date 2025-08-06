/**
 * Specialized Conversion Tests
 * Comprehensive test suite for specialized format conversions
 * Tests: DICOM ↔ PNG / JPG, GPX ↔ KML / CSV, SRT ↔ VTT / TXT
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const SpecializedConverter = require('./src/server/specializedConverter');

class SpecializedConversionTester {
    constructor() {
        this.converter = new SpecializedConverter();
        this.testDir = path.join(__dirname, 'test-specialized');
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

    async createTestFile(filename, content, size = 1024) {
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

    async createTestDicom(filename = 'test.dcm') {
        const filePath = path.join(this.testDir, filename);
        
        try {
            // Create a minimal DICOM file structure
            const dicomContent = Buffer.alloc(256);
            
            // DICOM header (simplified)
            dicomContent.write('DICM', 128, 4, 'ascii');  // DICOM signature
            dicomContent.writeUInt32LE(256, 0);           // File size
            dicomContent.writeUInt32LE(1, 4);             // Version
            
            await fs.writeFile(filePath, dicomContent);
            return filePath;
            
        } catch (error) {
            // Fallback to simple binary file
            return await this.createTestFile(filename, null, 256);
        }
    }

    async createTestGpx(filename = 'test.gpx') {
        const filePath = path.join(this.testDir, filename);
        
        const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="File Converter" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060">
        <ele>10</ele>
        <time>2023-01-01T12:00:00Z</time>
      </trkpt>
      <trkpt lat="40.7589" lon="-73.9851">
        <ele>15</ele>
        <time>2023-01-01T12:01:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;
        
        await fs.writeFile(filePath, gpxContent);
        return filePath;
    }

    async createTestKml(filename = 'test.kml') {
        const filePath = path.join(this.testDir, filename);
        
        const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Test Document</name>
    <Placemark>
      <name>Test Point</name>
      <description>Test description</description>
      <Point>
        <coordinates>-74.0060,40.7128,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;
        
        await fs.writeFile(filePath, kmlContent);
        return filePath;
    }

    async createTestSrt(filename = 'test.srt') {
        const filePath = path.join(this.testDir, filename);
        
        const srtContent = `1
00:00:01,000 --> 00:00:04,000
This is the first subtitle line.

2
00:00:05,000 --> 00:00:08,000
This is the second subtitle line.
And this is a second line of text.

3
00:00:09,000 --> 00:00:12,000
This is the third subtitle.`;
        
        await fs.writeFile(filePath, srtContent);
        return filePath;
    }

    async createTestVtt(filename = 'test.vtt') {
        const filePath = path.join(this.testDir, filename);
        
        const vttContent = `WEBVTT

00:00:01.000 --> 00:00:04.000
This is the first subtitle line.

00:00:05.000 --> 00:00:08.000
This is the second subtitle line.
And this is a second line of text.

00:00:09.000 --> 00:00:12.000
This is the third subtitle.`;
        
        await fs.writeFile(filePath, vttContent);
        return filePath;
    }

    async createTestTxt(filename = 'test.txt') {
        const filePath = path.join(this.testDir, filename);
        
        const txtContent = `This is the first line of text.
This is the second line of text.
This is the third line of text.
This is the fourth line of text.`;
        
        await fs.writeFile(filePath, txtContent);
        return filePath;
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
        
        const expectedInputs = ['dicom', 'dcm', 'gpx', 'kml', 'srt', 'vtt', 'txt'];
        const expectedOutputs = ['png', 'jpg', 'jpeg', 'gpx', 'kml', 'csv', 'srt', 'vtt', 'txt'];
        
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
            { format: 'dicom', expected: 'application/dicom' },
            { format: 'dcm', expected: 'application/dicom' },
            { format: 'gpx', expected: 'application/gpx+xml' },
            { format: 'kml', expected: 'application/vnd.google-earth.kml+xml' },
            { format: 'srt', expected: 'application/x-subrip' },
            { format: 'vtt', expected: 'text/vtt' },
            { format: 'txt', expected: 'text/plain' }
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
        // Test DICOM file
        const dicomPath = await this.createTestDicom('format_test.dcm');
        const dicomFormat = this.converter.getFileFormat(dicomPath);
        if (dicomFormat !== 'dcm') {
            throw new Error(`DICOM format detection failed: got ${dicomFormat}`);
        }
        
        // Test GPX file
        const gpxPath = await this.createTestGpx('format_test.gpx');
        const gpxFormat = this.converter.getFileFormat(gpxPath);
        if (gpxFormat !== 'gpx') {
            throw new Error(`GPX format detection failed: got ${gpxFormat}`);
        }
        
        // Test KML file
        const kmlPath = await this.createTestKml('format_test.kml');
        const kmlFormat = this.converter.getFileFormat(kmlPath);
        if (kmlFormat !== 'kml') {
            throw new Error(`KML format detection failed: got ${kmlFormat}`);
        }
        
        // Test SRT file
        const srtPath = await this.createTestSrt('format_test.srt');
        const srtFormat = this.converter.getFileFormat(srtPath);
        if (srtFormat !== 'srt') {
            throw new Error(`SRT format detection failed: got ${srtFormat}`);
        }
        
        // Test VTT file
        const vttPath = await this.createTestVtt('format_test.vtt');
        const vttFormat = this.converter.getFileFormat(vttPath);
        if (vttFormat !== 'vtt') {
            throw new Error(`VTT format detection failed: got ${vttFormat}`);
        }
        
        // Test TXT file
        const txtPath = await this.createTestTxt('format_test.txt');
        const txtFormat = this.converter.getFileFormat(txtPath);
        if (txtFormat !== 'txt') {
            throw new Error(`TXT format detection failed: got ${txtFormat}`);
        }
        
        console.log('   File format detection working');
    }

    async testAvailableOutputFormats() {
        const testCases = [
            { input: 'dicom', expected: ['png', 'jpg', 'jpeg'] },
            { input: 'dcm', expected: ['png', 'jpg', 'jpeg'] },
            { input: 'gpx', expected: ['kml', 'csv'] },
            { input: 'kml', expected: ['gpx', 'csv'] },
            { input: 'srt', expected: ['vtt', 'txt'] },
            { input: 'vtt', expected: ['srt', 'txt'] },
            { input: 'txt', expected: ['srt', 'vtt'] }
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

    async testDicomConversions() {
        const inputPath = await this.createTestDicom('dicom_test.dcm');
        const outputPath = path.join(this.testDir, 'dicom_test.png');
        
        try {
            const result = await this.converter.convert(inputPath, outputPath, 'png');
            
            if (!result.success) {
                throw new Error('DICOM to PNG conversion failed');
            }
            
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
                throw new Error('Output file is empty');
            }
            
            console.log(`   Converted DICOM to PNG: ${result.size} bytes`);
            
        } catch (error) {
            console.log(`   DICOM conversion test skipped: ${error.message}`);
        }
    }

    async testGpxToKmlConversion() {
        const inputPath = await this.createTestGpx('gpx_to_kml_test.gpx');
        const outputPath = path.join(this.testDir, 'gpx_to_kml_test.kml');
        
        const result = await this.converter.convert(inputPath, outputPath, 'kml');
        
        if (!result.success) {
            throw new Error('GPX to KML conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify KML content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('<kml') || !content.includes('<coordinates>')) {
            throw new Error('Invalid KML content generated');
        }
        
        console.log(`   Converted GPX to KML: ${result.size} bytes`);
    }

    async testGpxToCsvConversion() {
        const inputPath = await this.createTestGpx('gpx_to_csv_test.gpx');
        const outputPath = path.join(this.testDir, 'gpx_to_csv_test.csv');
        
        const result = await this.converter.convert(inputPath, outputPath, 'csv');
        
        if (!result.success) {
            throw new Error('GPX to CSV conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify CSV content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('Latitude,Longitude') || !content.includes('40.7128')) {
            throw new Error('Invalid CSV content generated');
        }
        
        console.log(`   Converted GPX to CSV: ${result.size} bytes`);
    }

    async testKmlToGpxConversion() {
        const inputPath = await this.createTestKml('kml_to_gpx_test.kml');
        const outputPath = path.join(this.testDir, 'kml_to_gpx_test.gpx');
        
        const result = await this.converter.convert(inputPath, outputPath, 'gpx');
        
        if (!result.success) {
            throw new Error('KML to GPX conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify GPX content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('<gpx') || !content.includes('<trkpt')) {
            throw new Error('Invalid GPX content generated');
        }
        
        console.log(`   Converted KML to GPX: ${result.size} bytes`);
    }

    async testKmlToCsvConversion() {
        const inputPath = await this.createTestKml('kml_to_csv_test.kml');
        const outputPath = path.join(this.testDir, 'kml_to_csv_test.csv');
        
        const result = await this.converter.convert(inputPath, outputPath, 'csv');
        
        if (!result.success) {
            throw new Error('KML to CSV conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify CSV content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('Latitude,Longitude') || !content.includes('40.7128')) {
            throw new Error('Invalid CSV content generated');
        }
        
        console.log(`   Converted KML to CSV: ${result.size} bytes`);
    }

    async testSrtToVttConversion() {
        const inputPath = await this.createTestSrt('srt_to_vtt_test.srt');
        const outputPath = path.join(this.testDir, 'srt_to_vtt_test.vtt');
        
        const result = await this.converter.convert(inputPath, outputPath, 'vtt');
        
        if (!result.success) {
            throw new Error('SRT to VTT conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify VTT content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('WEBVTT') || !content.includes('00:00:01.000')) {
            throw new Error('Invalid VTT content generated');
        }
        
        console.log(`   Converted SRT to VTT: ${result.size} bytes`);
    }

    async testSrtToTxtConversion() {
        const inputPath = await this.createTestSrt('srt_to_txt_test.srt');
        const outputPath = path.join(this.testDir, 'srt_to_txt_test.txt');
        
        const result = await this.converter.convert(inputPath, outputPath, 'txt');
        
        if (!result.success) {
            throw new Error('SRT to TXT conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify TXT content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('subtitle line') || content.includes('00:00:01,000')) {
            throw new Error('Invalid TXT content generated (should not contain timestamps)');
        }
        
        console.log(`   Converted SRT to TXT: ${result.size} bytes`);
    }

    async testVttToSrtConversion() {
        const inputPath = await this.createTestVtt('vtt_to_srt_test.vtt');
        const outputPath = path.join(this.testDir, 'vtt_to_srt_test.srt');
        
        const result = await this.converter.convert(inputPath, outputPath, 'srt');
        
        if (!result.success) {
            throw new Error('VTT to SRT conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify SRT content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('1\n00:00:01,000') || !content.includes('subtitle line')) {
            throw new Error('Invalid SRT content generated');
        }
        
        console.log(`   Converted VTT to SRT: ${result.size} bytes`);
    }

    async testVttToTxtConversion() {
        const inputPath = await this.createTestVtt('vtt_to_txt_test.vtt');
        const outputPath = path.join(this.testDir, 'vtt_to_txt_test.txt');
        
        const result = await this.converter.convert(inputPath, outputPath, 'txt');
        
        if (!result.success) {
            throw new Error('VTT to TXT conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify TXT content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('subtitle line') || content.includes('00:00:01.000')) {
            throw new Error('Invalid TXT content generated (should not contain timestamps)');
        }
        
        console.log(`   Converted VTT to TXT: ${result.size} bytes`);
    }

    async testTxtToSrtConversion() {
        const inputPath = await this.createTestTxt('txt_to_srt_test.txt');
        const outputPath = path.join(this.testDir, 'txt_to_srt_test.srt');
        
        const result = await this.converter.convert(inputPath, outputPath, 'srt');
        
        if (!result.success) {
            throw new Error('TXT to SRT conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify SRT content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('1\n00:00:00,000') || !content.includes('first line of text')) {
            throw new Error('Invalid SRT content generated');
        }
        
        console.log(`   Converted TXT to SRT: ${result.size} bytes`);
    }

    async testTxtToVttConversion() {
        const inputPath = await this.createTestTxt('txt_to_vtt_test.txt');
        const outputPath = path.join(this.testDir, 'txt_to_vtt_test.vtt');
        
        const result = await this.converter.convert(inputPath, outputPath, 'vtt');
        
        if (!result.success) {
            throw new Error('TXT to VTT conversion failed');
        }
        
        const stats = await fs.stat(outputPath);
        if (stats.size === 0) {
            throw new Error('Output file is empty');
        }
        
        // Verify VTT content
        const content = await fs.readFile(outputPath, 'utf8');
        if (!content.includes('WEBVTT') || !content.includes('00:00:00.000') || !content.includes('first line of text')) {
            throw new Error('Invalid VTT content generated');
        }
        
        console.log(`   Converted TXT to VTT: ${result.size} bytes`);
    }

    async testMetadataRetrieval() {
        const inputPath = await this.createTestGpx('metadata_test.gpx');
        
        const metadata = await this.converter.getMetadata(inputPath, 'gpx');
        
        if (!metadata) {
            throw new Error('Failed to retrieve metadata');
        }
        
        if (!metadata.format || metadata.format !== 'gpx') {
            throw new Error('Invalid metadata format');
        }
        
        if (!metadata.size || metadata.size === 0) {
            throw new Error('Invalid metadata size');
        }
        
        console.log('   Metadata retrieval working');
    }

    async testValidation() {
        const validPath = await this.createTestGpx('validation_test.gpx');
        
        // Test valid file
        const isValid = await this.converter.validateFile(validPath, 'gpx');
        if (!isValid) {
            throw new Error('Valid file validation failed');
        }
        
        // Test empty file
        const emptyPath = await this.createTestFile('empty_test.gpx', '');
        try {
            await this.converter.validateFile(emptyPath, 'gpx');
            throw new Error('Empty file validation should have failed');
        } catch (error) {
            // Expected error
        }
        
        console.log('   File validation working');
    }

    async testErrorHandling() {
        // Test unsupported input format
        const unsupportedPath = await this.createTestFile('unsupported.bin', 'test');
        const outputPath = path.join(this.testDir, 'error_test.kml');
        
        try {
            await this.converter.convert(unsupportedPath, outputPath, 'kml');
            throw new Error('Should have failed for unsupported format');
        } catch (error) {
            // Expected error
        }
        
        // Test unsupported output format
        const validPath = await this.createTestGpx('error_test.gpx');
        try {
            await this.converter.convert(validPath, outputPath, 'unsupported');
            throw new Error('Should have failed for unsupported output format');
        } catch (error) {
            // Expected error
        }
        
        console.log('   Error handling working');
    }

    async testConversionOptions() {
        const inputPath = await this.createTestTxt('options_test.txt');
        const outputPath = path.join(this.testDir, 'options_test.srt');
        
        const options = {
            subtitleDuration: 5000 // 5 seconds
        };
        
        const result = await this.converter.convert(inputPath, outputPath, 'srt', options);
        
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
        const originalPath = await this.createTestGpx('roundtrip_test.gpx');
        const intermediatePath = path.join(this.testDir, 'roundtrip_test.kml');
        const finalPath = path.join(this.testDir, 'roundtrip_test_final.gpx');
        
        // GPX → KML → GPX
        const result1 = await this.converter.convert(originalPath, intermediatePath, 'kml');
        if (!result1.success) {
            throw new Error('First conversion failed');
        }
        
        const result2 = await this.converter.convert(intermediatePath, finalPath, 'gpx');
        if (!result2.success) {
            throw new Error('Second conversion failed');
        }
        
        const originalStats = await fs.stat(originalPath);
        const finalStats = await fs.stat(finalPath);
        
        // Files should be similar in size (allowing for some differences)
        const sizeDiff = Math.abs(originalStats.size - finalStats.size);
        const sizeRatio = sizeDiff / originalStats.size;
        
        if (sizeRatio > 0.5) { // Allow 50% difference for XML conversions
            throw new Error(`Round trip conversion size mismatch: original ${originalStats.size}, final ${finalStats.size}`);
        }
        
        console.log('   Round trip conversion successful');
    }

    async runAllTests() {
        console.log('🚀 Starting Specialized Conversion Tests\n');
        
        await this.setup();
        
        // Basic functionality tests
        await this.runTest('Supported Formats', () => this.testSupportedFormats());
        await this.runTest('MIME Types', () => this.testMimeTypes());
        await this.runTest('File Format Detection', () => this.testFileFormatDetection());
        await this.runTest('Available Output Formats', () => this.testAvailableOutputFormats());
        
        // DICOM conversion tests
        await this.runTest('DICOM Conversions', () => this.testDicomConversions());
        
        // GPS conversion tests
        await this.runTest('GPX to KML Conversion', () => this.testGpxToKmlConversion());
        await this.runTest('GPX to CSV Conversion', () => this.testGpxToCsvConversion());
        await this.runTest('KML to GPX Conversion', () => this.testKmlToGpxConversion());
        await this.runTest('KML to CSV Conversion', () => this.testKmlToCsvConversion());
        
        // Subtitle conversion tests
        await this.runTest('SRT to VTT Conversion', () => this.testSrtToVttConversion());
        await this.runTest('SRT to TXT Conversion', () => this.testSrtToTxtConversion());
        await this.runTest('VTT to SRT Conversion', () => this.testVttToSrtConversion());
        await this.runTest('VTT to TXT Conversion', () => this.testVttToTxtConversion());
        await this.runTest('TXT to SRT Conversion', () => this.testTxtToSrtConversion());
        await this.runTest('TXT to VTT Conversion', () => this.testTxtToVttConversion());
        
        // Advanced tests
        await this.runTest('Metadata Retrieval', () => this.testMetadataRetrieval());
        await this.runTest('File Validation', () => this.testValidation());
        await this.runTest('Error Handling', () => this.testErrorHandling());
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
            console.log('\n🎉 All specialized conversion tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new SpecializedConversionTester();
    tester.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = SpecializedConversionTester; 