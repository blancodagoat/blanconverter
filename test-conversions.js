/**
 * Test Script for Document Conversions
 * Verifies all requested conversions are working
 */

const DocumentConverter = require('./src/server/documentConverter');
const fs = require('fs').promises;
const path = require('path');

class ConversionTester {
    constructor() {
        this.converter = new DocumentConverter();
        this.testResults = [];
        this.testDir = './test-files';
    }

    /**
     * Run all conversion tests
     */
    async runAllTests() {
        console.log('🚀 Starting Document Conversion Tests...\n');
        
        // Create test directory
        await this.createTestDirectory();
        
        // Test all requested conversions
        await this.testDocxConversions();
        await this.testPdfConversions();
        await this.testPowerPointConversions();
        await this.testExcelConversions();
        await this.testOdtConversions();
        
        // Generate test report
        this.generateReport();
    }

    /**
     * Create test directory and sample files
     */
    async createTestDirectory() {
        try {
            await fs.mkdir(this.testDir, { recursive: true });
            console.log('✅ Test directory created');
        } catch (error) {
            console.log('⚠️  Test directory already exists');
        }
    }

    /**
     * Test DOCX conversions
     */
    async testDocxConversions() {
        console.log('\n📄 Testing DOCX Conversions...');
        
        const testCases = [
            { from: 'docx', to: 'pdf', description: 'DOCX → PDF' },
            { from: 'docx', to: 'txt', description: 'DOCX → TXT' },
            { from: 'docx', to: 'odt', description: 'DOCX → ODT' }
        ];

        for (const testCase of testCases) {
            await this.runConversionTest(testCase);
        }
    }

    /**
     * Test PDF conversions
     */
    async testPdfConversions() {
        console.log('\n📄 Testing PDF Conversions...');
        
        const testCases = [
            { from: 'pdf', to: 'jpg', description: 'PDF → JPG' },
            { from: 'pdf', to: 'png', description: 'PDF → PNG' },
            { from: 'pdf', to: 'docx', description: 'PDF → DOCX' },
            { from: 'pdf', to: 'txt', description: 'PDF → TXT' }
        ];

        for (const testCase of testCases) {
            await this.runConversionTest(testCase);
        }
    }

    /**
     * Test PowerPoint conversions
     */
    async testPowerPointConversions() {
        console.log('\n📄 Testing PowerPoint Conversions...');
        
        const testCases = [
            { from: 'pptx', to: 'pdf', description: 'PPTX → PDF' },
            { from: 'pptx', to: 'docx', description: 'PPTX → DOCX' },
            { from: 'pptx', to: 'jpg', description: 'PPTX → JPG' },
            { from: 'pptx', to: 'png', description: 'PPTX → PNG' }
        ];

        for (const testCase of testCases) {
            await this.runConversionTest(testCase);
        }
    }

    /**
     * Test Excel conversions
     */
    async testExcelConversions() {
        console.log('\n📄 Testing Excel Conversions...');
        
        const testCases = [
            { from: 'xls', to: 'csv', description: 'XLS → CSV' },
            { from: 'xls', to: 'pdf', description: 'XLS → PDF' },
            { from: 'xls', to: 'xlsx', description: 'XLS → XLSX' }
        ];

        for (const testCase of testCases) {
            await this.runConversionTest(testCase);
        }
    }

    /**
     * Test ODT conversions
     */
    async testOdtConversions() {
        console.log('\n📄 Testing ODT Conversions...');
        
        const testCases = [
            { from: 'odt', to: 'docx', description: 'ODT → DOCX' },
            { from: 'odt', to: 'pdf', description: 'ODT → PDF' },
            { from: 'odt', to: 'txt', description: 'ODT → TXT' }
        ];

        for (const testCase of testCases) {
            await this.runConversionTest(testCase);
        }
    }

    /**
     * Run a single conversion test
     */
    async runConversionTest(testCase) {
        try {
            // Create a sample input file
            const inputPath = await this.createSampleFile(testCase.from);
            
            // Test the conversion
            const result = await this.converter.convert(inputPath, testCase.to);
            
            // Verify the result
            const success = await this.verifyConversion(result, testCase.to);
            
            this.testResults.push({
                test: testCase.description,
                success: success,
                result: result,
                error: null
            });

            console.log(`  ${success ? '✅' : '❌'} ${testCase.description}`);
            
            // Clean up
            await this.cleanupTestFiles(inputPath, result.filename);
            
        } catch (error) {
            this.testResults.push({
                test: testCase.description,
                success: false,
                result: null,
                error: error.message
            });
            
            console.log(`  ❌ ${testCase.description} - Error: ${error.message}`);
        }
    }

    /**
     * Create a sample file for testing
     */
    async createSampleFile(format) {
        const filename = `test-${Date.now()}.${format}`;
        const filepath = path.join(this.testDir, filename);
        
        switch (format) {
            case 'docx':
                await this.createSampleDocx(filepath);
                break;
            case 'pdf':
                await this.createSamplePdf(filepath);
                break;
            case 'pptx':
                await this.createSamplePptx(filepath);
                break;
            case 'xls':
                await this.createSampleXls(filepath);
                break;
            case 'odt':
                await this.createSampleOdt(filepath);
                break;
            default:
                await fs.writeFile(filepath, `Sample ${format} content`);
        }
        
        return filepath;
    }

    /**
     * Create sample DOCX file
     */
    async createSampleDocx(filepath) {
        const { Document, Packer, Paragraph, TextRun } = require('docx');
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Sample Document',
                                bold: true,
                                size: 32
                            })
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'This is a sample document for testing conversions.',
                                size: 24
                            })
                        ]
                    })
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        await fs.writeFile(filepath, buffer);
    }

    /**
     * Create sample PDF file
     */
    async createSamplePdf(filepath) {
        const { PDFDocument, rgb } = require('pdf-lib');
        
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]);
        
        page.drawText('Sample PDF Document', {
            x: 50,
            y: 750,
            size: 20,
            color: rgb(0, 0, 0)
        });
        
        page.drawText('This is a sample PDF for testing conversions.', {
            x: 50,
            y: 720,
            size: 12,
            color: rgb(0, 0, 0)
        });

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(filepath, pdfBytes);
    }

    /**
     * Create sample PPTX file (simplified)
     */
    async createSamplePptx(filepath) {
        // For testing purposes, create a simple file
        await fs.writeFile(filepath, 'Sample PowerPoint content');
    }

    /**
     * Create sample XLS file
     */
    async createSampleXls(filepath) {
        const XLSX = require('xlsx');
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([
            ['Name', 'Age', 'City'],
            ['John', 30, 'New York'],
            ['Jane', 25, 'Los Angeles'],
            ['Bob', 35, 'Chicago']
        ]);
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, filepath);
    }

    /**
     * Create sample ODT file (simplified)
     */
    async createSampleOdt(filepath) {
        // For testing purposes, create a simple file
        await fs.writeFile(filepath, 'Sample ODT content');
    }

    /**
     * Verify conversion result
     */
    async verifyConversion(result, expectedFormat) {
        if (!result || !result.filename) {
            return false;
        }

        // Check if output file exists
        const outputPath = path.join(__dirname, 'converted', result.filename);
        try {
            await fs.access(outputPath);
        } catch (error) {
            return false;
        }

        // Check format
        if (result.format !== expectedFormat) {
            return false;
        }

        // Check file size
        if (result.size <= 0) {
            return false;
        }

        return true;
    }

    /**
     * Clean up test files
     */
    async cleanupTestFiles(inputPath, outputFilename) {
        try {
            await fs.unlink(inputPath);
            
            const outputPath = path.join(__dirname, 'converted', outputFilename);
            await fs.unlink(outputPath);
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    /**
     * Generate test report
     */
    generateReport() {
        console.log('\n📊 Test Results Summary:');
        console.log('=' .repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`  - ${r.test}: ${r.error || 'Unknown error'}`);
                });
        }
        
        console.log('\n🎯 Requested Conversions Status:');
        console.log('=' .repeat(50));
        
        const requestedConversions = [
            'DOCX ↔ PDF / TXT / ODT',
            'PDF ↔ JPG / PNG / DOCX / TXT',
            'PPT ↔ PDF / DOCX / Images',
            'XLS ↔ CSV / PDF / XLSX'
        ];
        
        requestedConversions.forEach(conversion => {
            const relatedTests = this.testResults.filter(r => 
                conversion.includes(r.test.split(' → ')[0].toUpperCase()) ||
                conversion.includes(r.test.split(' → ')[1].toUpperCase())
            );
            
            const allPassed = relatedTests.length > 0 && relatedTests.every(r => r.success);
            console.log(`  ${allPassed ? '✅' : '❌'} ${conversion}`);
        });
        
        console.log('\n' + '=' .repeat(50));
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! The document converter is production-ready.');
        } else {
            console.log('⚠️  Some tests failed. Please review the implementation.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new ConversionTester();
    tester.runAllTests().catch(console.error);
}

module.exports = ConversionTester; 