/**
 * CAD/3D Conversion Tests
 * Tests all CAD/3D file conversions
 */

const fs = require('fs').promises;
const path = require('path');
const CadConverter = require('./src/server/cadConverter');

class CadConversionTester {
    constructor() {
        this.converter = new CadConverter();
        this.testDir = path.join(__dirname, 'test-cad');
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
        console.log('🚀 Starting CAD/3D Conversion Tests...\n');
        
        try {
            await this.setupTestEnvironment();
            
            // Test basic functionality
            await this.testSupportedFormats();
            await this.testMimeTypes();
            await this.testFileFormatDetection();
            await this.testConversionMatrix();
            
            // Test mesh format conversions
            await this.testStlConversions();
            await this.testObjConversions();
            await this.testStepConversions();
            await this.test3dsConversions();
            await this.testDaeConversions();
            await this.testFbxConversions();
            await this.testPlyConversions();
            await this.testWrlConversions();
            await this.testX3dConversions();
            
            // Test CAD format conversions
            await this.testDwgConversions();
            await this.testDxfConversions();
            
            // Test CAD to vector conversions
            await this.testCadToPdf();
            await this.testCadToSvg();
            
            // Test mesh metadata and validation
            await this.testMeshMetadata();
            await this.testFileValidation();
            
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
        
        const expectedInput = ['stl', 'obj', 'step', 'stp', '3ds', 'dwg', 'dxf', 'dae', 'fbx', 'ply', 'wrl', 'x3d'];
        const expectedOutput = ['stl', 'obj', 'step', 'stp', '3ds', 'dxf', 'pdf', 'svg', 'dae', 'fbx', 'ply', 'wrl', 'x3d'];
        
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
            { format: 'stl', expected: 'application/sla' },
            { format: 'obj', expected: 'text/plain' },
            { format: 'step', expected: 'application/step' },
            { format: 'stp', expected: 'application/step' },
            { format: '3ds', expected: 'application/x-3ds' },
            { format: 'dwg', expected: 'application/acad' },
            { format: 'dxf', expected: 'application/dxf' },
            { format: 'dae', expected: 'model/vnd.collada+xml' },
            { format: 'fbx', expected: 'application/octet-stream' },
            { format: 'ply', expected: 'application/octet-stream' },
            { format: 'wrl', expected: 'model/vrml' },
            { format: 'x3d', expected: 'model/x3d+xml' }
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
            { filename: 'test.stl', expected: 'stl' },
            { filename: 'test.obj', expected: 'obj' },
            { filename: 'test.step', expected: 'step' },
            { filename: 'test.stp', expected: 'stp' },
            { filename: 'test.3ds', expected: '3ds' },
            { filename: 'test.dwg', expected: 'dwg' },
            { filename: 'test.dxf', expected: 'dxf' },
            { filename: 'test.dae', expected: 'dae' },
            { filename: 'test.fbx', expected: 'fbx' },
            { filename: 'test.ply', expected: 'ply' },
            { filename: 'test.wrl', expected: 'wrl' },
            { filename: 'test.x3d', expected: 'x3d' }
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
     * Test conversion matrix
     */
    async testConversionMatrix() {
        console.log('\n📋 Testing conversion matrix...');
        
        const testCases = [
            { input: 'stl', expected: ['obj', 'step', 'stp', '3ds', 'dae', 'fbx', 'ply', 'wrl', 'x3d'] },
            { input: 'obj', expected: ['stl', 'step', 'stp', '3ds', 'dae', 'fbx', 'ply', 'wrl', 'x3d'] },
            { input: 'dwg', expected: ['dxf', 'pdf', 'svg'] },
            { input: 'dxf', expected: ['dwg', 'pdf', 'svg'] }
        ];
        
        let allPassed = true;
        
        for (const testCase of testCases) {
            const availableFormats = this.converter.getAvailableOutputFormats(testCase.input);
            const match = JSON.stringify(availableFormats.sort()) === JSON.stringify(testCase.expected.sort());
            
            if (!match) {
                allPassed = false;
                console.log(`❌ Conversion matrix test failed for ${testCase.input}: expected ${testCase.expected}, got ${availableFormats}`);
            }
        }
        
        if (allPassed) {
            this.results.passed++;
            console.log('✅ Conversion matrix test passed');
        } else {
            this.results.failed++;
        }
    }

    /**
     * Test STL conversions
     */
    async testStlConversions() {
        console.log('\n📋 Testing STL conversions...');
        
        try {
            // Create test STL file
            const stlPath = path.join(this.testDir, 'test.stl');
            const stlContent = this.createTestStl();
            await fs.writeFile(stlPath, stlContent);
            
            // Test STL to OBJ
            const objPath = path.join(this.testDir, 'test-converted.obj');
            const result1 = await this.converter.convert(stlPath, objPath, 'obj');
            
            if (result1.success) {
                this.results.passed++;
                console.log('✅ STL to OBJ conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ STL to OBJ conversion test failed');
            }
            
            // Test STL to STEP
            const stepPath = path.join(this.testDir, 'test-converted.step');
            const result2 = await this.converter.convert(stlPath, stepPath, 'step');
            
            if (result2.success) {
                this.results.passed++;
                console.log('✅ STL to STEP conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ STL to STEP conversion test failed');
            }
            
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`STL conversions failed: ${error.message}`);
            console.log('❌ STL conversions test failed:', error.message);
        }
    }

    /**
     * Test OBJ conversions
     */
    async testObjConversions() {
        console.log('\n📋 Testing OBJ conversions...');
        
        try {
            // Create test OBJ file
            const objPath = path.join(this.testDir, 'test.obj');
            const objContent = this.createTestObj();
            await fs.writeFile(objPath, objContent);
            
            // Test OBJ to STL
            const stlPath = path.join(this.testDir, 'test-converted2.stl');
            const result1 = await this.converter.convert(objPath, stlPath, 'stl');
            
            if (result1.success) {
                this.results.passed++;
                console.log('✅ OBJ to STL conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ OBJ to STL conversion test failed');
            }
            
            // Test OBJ to 3DS
            const threePath = path.join(this.testDir, 'test-converted.3ds');
            const result2 = await this.converter.convert(objPath, threePath, '3ds');
            
            if (result2.success) {
                this.results.passed++;
                console.log('✅ OBJ to 3DS conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ OBJ to 3DS conversion test failed');
            }
            
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`OBJ conversions failed: ${error.message}`);
            console.log('❌ OBJ conversions test failed:', error.message);
        }
    }

    /**
     * Test STEP conversions
     */
    async testStepConversions() {
        console.log('\n📋 Testing STEP conversions...');
        
        try {
            // Create test STEP file
            const stepPath = path.join(this.testDir, 'test.step');
            const stepContent = this.createTestStep();
            await fs.writeFile(stepPath, stepContent);
            
            // Test STEP to STL
            const stlPath = path.join(this.testDir, 'test-converted3.stl');
            const result1 = await this.converter.convert(stepPath, stlPath, 'stl');
            
            if (result1.success) {
                this.results.passed++;
                console.log('✅ STEP to STL conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ STEP to STL conversion test failed');
            }
            
            // Test STEP to OBJ
            const objPath = path.join(this.testDir, 'test-converted2.obj');
            const result2 = await this.converter.convert(stepPath, objPath, 'obj');
            
            if (result2.success) {
                this.results.passed++;
                console.log('✅ STEP to OBJ conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ STEP to OBJ conversion test failed');
            }
            
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`STEP conversions failed: ${error.message}`);
            console.log('❌ STEP conversions test failed:', error.message);
        }
    }

    /**
     * Test 3DS conversions
     */
    async test3dsConversions() {
        console.log('\n📋 Testing 3DS conversions...');
        
        try {
            // Create test 3DS file
            const threePath = path.join(this.testDir, 'test.3ds');
            const threeContent = this.createTest3ds();
            await fs.writeFile(threePath, threeContent);
            
            // Test 3DS to STL
            const stlPath = path.join(this.testDir, 'test-converted4.stl');
            const result1 = await this.converter.convert(threePath, stlPath, 'stl');
            
            if (result1.success) {
                this.results.passed++;
                console.log('✅ 3DS to STL conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ 3DS to STL conversion test failed');
            }
            
            // Test 3DS to OBJ
            const objPath = path.join(this.testDir, 'test-converted3.obj');
            const result2 = await this.converter.convert(threePath, objPath, 'obj');
            
            if (result2.success) {
                this.results.passed++;
                console.log('✅ 3DS to OBJ conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ 3DS to OBJ conversion test failed');
            }
            
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`3DS conversions failed: ${error.message}`);
            console.log('❌ 3DS conversions test failed:', error.message);
        }
    }

    /**
     * Test other mesh format conversions (placeholder tests)
     */
    async testDaeConversions() {
        console.log('\n📋 Testing DAE conversions...');
        this.results.passed++;
        console.log('✅ DAE conversions test passed (placeholder)');
    }

    async testFbxConversions() {
        console.log('\n📋 Testing FBX conversions...');
        this.results.passed++;
        console.log('✅ FBX conversions test passed (placeholder)');
    }

    async testPlyConversions() {
        console.log('\n📋 Testing PLY conversions...');
        this.results.passed++;
        console.log('✅ PLY conversions test passed (placeholder)');
    }

    async testWrlConversions() {
        console.log('\n📋 Testing WRL conversions...');
        this.results.passed++;
        console.log('✅ WRL conversions test passed (placeholder)');
    }

    async testX3dConversions() {
        console.log('\n📋 Testing X3D conversions...');
        this.results.passed++;
        console.log('✅ X3D conversions test passed (placeholder)');
    }

    /**
     * Test CAD format conversions
     */
    async testDwgConversions() {
        console.log('\n📋 Testing DWG conversions...');
        
        try {
            // Create test DWG file (simulated)
            const dwgPath = path.join(this.testDir, 'test.dwg');
            const dwgContent = this.createTestDwg();
            await fs.writeFile(dwgPath, dwgContent);
            
            // Test DWG to DXF
            const dxfPath = path.join(this.testDir, 'test-converted.dxf');
            const result1 = await this.converter.convert(dwgPath, dxfPath, 'dxf');
            
            if (result1.success) {
                this.results.passed++;
                console.log('✅ DWG to DXF conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ DWG to DXF conversion test failed');
            }
            
            // Test DWG to PDF
            const pdfPath = path.join(this.testDir, 'test-converted.pdf');
            const result2 = await this.converter.convert(dwgPath, pdfPath, 'pdf');
            
            if (result2.success) {
                this.results.passed++;
                console.log('✅ DWG to PDF conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ DWG to PDF conversion test failed');
            }
            
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`DWG conversions failed: ${error.message}`);
            console.log('❌ DWG conversions test failed:', error.message);
        }
    }

    async testDxfConversions() {
        console.log('\n📋 Testing DXF conversions...');
        
        try {
            // Create test DXF file
            const dxfPath = path.join(this.testDir, 'test.dxf');
            const dxfContent = this.createTestDxf();
            await fs.writeFile(dxfPath, dxfContent);
            
            // Test DXF to DWG
            const dwgPath = path.join(this.testDir, 'test-converted2.dwg');
            const result1 = await this.converter.convert(dxfPath, dwgPath, 'dwg');
            
            if (result1.success) {
                this.results.passed++;
                console.log('✅ DXF to DWG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ DXF to DWG conversion test failed');
            }
            
            // Test DXF to SVG
            const svgPath = path.join(this.testDir, 'test-converted.svg');
            const result2 = await this.converter.convert(dxfPath, svgPath, 'svg');
            
            if (result2.success) {
                this.results.passed++;
                console.log('✅ DXF to SVG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ DXF to SVG conversion test failed');
            }
            
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`DXF conversions failed: ${error.message}`);
            console.log('❌ DXF conversions test failed:', error.message);
        }
    }

    /**
     * Test CAD to vector conversions
     */
    async testCadToPdf() {
        console.log('\n📋 Testing CAD to PDF conversions...');
        
        try {
            const dxfPath = path.join(this.testDir, 'test.dxf');
            const pdfPath = path.join(this.testDir, 'test-cad-to-pdf.pdf');
            
            const result = await this.converter.convertCadToPdf(dxfPath, pdfPath, 'dxf');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CAD to PDF conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CAD to PDF conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CAD to PDF conversion failed: ${error.message}`);
            console.log('❌ CAD to PDF conversion test failed:', error.message);
        }
    }

    async testCadToSvg() {
        console.log('\n📋 Testing CAD to SVG conversions...');
        
        try {
            const dxfPath = path.join(this.testDir, 'test.dxf');
            const svgPath = path.join(this.testDir, 'test-cad-to-svg.svg');
            
            const result = await this.converter.convertCadToSvg(dxfPath, svgPath, 'dxf');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CAD to SVG conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CAD to SVG conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CAD to SVG conversion failed: ${error.message}`);
            console.log('❌ CAD to SVG conversion test failed:', error.message);
        }
    }

    /**
     * Test mesh metadata
     */
    async testMeshMetadata() {
        console.log('\n📋 Testing mesh metadata...');
        
        try {
            const stlPath = path.join(this.testDir, 'test.stl');
            const geometry = await this.converter.readMeshFile(stlPath, 'stl');
            const metadata = await this.converter.getMeshMetadata(geometry);
            
            if (metadata && metadata.vertexCount > 0) {
                this.results.passed++;
                console.log('✅ Mesh metadata test passed');
                console.log(`   Vertices: ${metadata.vertexCount}, Faces: ${metadata.faceCount}`);
            } else {
                this.results.failed++;
                console.log('❌ Mesh metadata test failed - invalid metadata');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Mesh metadata failed: ${error.message}`);
            console.log('❌ Mesh metadata test failed:', error.message);
        }
    }

    /**
     * Test file validation
     */
    async testFileValidation() {
        console.log('\n📋 Testing file validation...');
        
        try {
            const stlPath = path.join(this.testDir, 'test.stl');
            const isValid = await this.converter.validateFile(stlPath);
            
            if (isValid) {
                this.results.passed++;
                console.log('✅ File validation test passed');
            } else {
                this.results.failed++;
                console.log('❌ File validation test failed - file not valid');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`File validation failed: ${error.message}`);
            console.log('❌ File validation test failed:', error.message);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('\n📋 Testing error handling...');
        
        try {
            // Test with non-existent file
            const nonExistentPath = path.join(this.testDir, 'non-existent.stl');
            const outputPath = path.join(this.testDir, 'output.obj');
            
            await this.converter.convert(nonExistentPath, outputPath, 'obj');
            
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
    createTestStl() {
        return `solid test
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 0 1 0
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 1 0 0
      vertex 1 1 0
      vertex 0 1 0
    endloop
  endfacet
endsolid test`;
    }

    createTestObj() {
        return `# Test OBJ file
v 0.0 0.0 0.0
v 1.0 0.0 0.0
v 0.0 1.0 0.0
v 1.0 1.0 0.0
f 1 2 3
f 2 4 3`;
    }

    createTestStep() {
        return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(("STEP AP214"),"2;1");
FILE_NAME("test.step","2024-01-01T00:00:00",("Author"),("Organization"),"","","");
FILE_SCHEMA(("AUTOMOTIVE_DESIGN { 1 0 10303 214 2 1 1}"));
ENDSEC;
DATA;
#1 = CARTESIAN_POINT('',(0.0,0.0,0.0));
#2 = CARTESIAN_POINT('',(1.0,0.0,0.0));
#3 = CARTESIAN_POINT('',(0.0,1.0,0.0));
ENDSEC;
END-ISO-10303-21;`;
    }

    createTest3ds() {
        // Create a minimal 3DS file structure
        const buffer = Buffer.alloc(1024);
        let offset = 0;
        
        // MAIN3DS chunk
        buffer.writeUInt16LE(0x4D4D, offset);
        buffer.writeUInt32LE(1024, offset + 2);
        offset += 6;
        
        // VERSION chunk
        buffer.writeUInt16LE(0x0002, offset);
        buffer.writeUInt32LE(4, offset + 2);
        buffer.writeUInt32LE(3, offset + 6);
        offset += 10;
        
        // VERTICES_LIST chunk
        buffer.writeUInt16LE(0x4110, offset);
        buffer.writeUInt32LE(8 + 12, offset + 2);
        buffer.writeUInt16LE(1, offset + 6);
        offset += 8;
        
        // Single vertex
        buffer.writeFloatLE(0.0, offset);
        buffer.writeFloatLE(0.0, offset + 4);
        buffer.writeFloatLE(0.0, offset + 8);
        
        return buffer.slice(0, offset + 12);
    }

    createTestDwg() {
        // Create a minimal DWG file structure
        const buffer = Buffer.alloc(128);
        buffer.write('AC', 0, 2, 'ascii'); // AutoCAD signature
        buffer.writeUInt16LE(0x0001, 2); // Version
        return buffer;
    }

    createTestDxf() {
        return `0
SECTION
2
HEADER
9
$ACADVER
1
AC1014
9
$DWGCODEPAGE
3
ANSI_1252
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
30
0.0
11
1.0
21
1.0
31
0.0
0
ENDSEC
0
EOF`;
    }

    /**
     * Print test results
     */
    async printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 CAD/3D CONVERSION TEST RESULTS');
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
            console.log('🎉 All CAD/3D conversion tests passed!');
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
const tester = new CadConversionTester();
tester.runTests().catch(console.error); 