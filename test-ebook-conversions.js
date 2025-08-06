/**
 * Test Script for Ebook Conversions
 * Verifies all requested ebook conversions are working
 */

const EbookConverter = require('./src/server/ebookConverter');
const fs = require('fs').promises;
const path = require('path');

class EbookConversionTester {
    constructor() {
        this.ebookConverter = new EbookConverter();
        this.testResults = [];
        this.testDir = './test-ebook-files';
    }

    async runAllTests() {
        console.log('📚 Starting Ebook Conversion Tests...\n');
        await this.createTestDirectory();
        await this.testEpubConversions();
        await this.testMobiConversions();
        await this.testAzw3Conversions();
        await this.testPdfToEbookConversions();
        await this.testDocxToEbookConversions();
        this.generateReport();
    }

    async createTestDirectory() {
        try {
            await fs.mkdir(this.testDir, { recursive: true });
            console.log('✅ Test directory created');
        } catch (error) {
            console.log('Test directory already exists');
        }
    }

    async testEpubConversions() {
        console.log('\n📖 Testing EPUB Conversions...');
        
        const testCases = [
            { from: 'epub', to: 'mobi', description: 'EPUB → MOBI' },
            { from: 'epub', to: 'azw3', description: 'EPUB → AZW3' },
            { from: 'epub', to: 'pdf', description: 'EPUB → PDF' },
            { from: 'epub', to: 'docx', description: 'EPUB → DOCX' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.from, testCase.to, testCase.description);
        }
    }

    async testMobiConversions() {
        console.log('\n📱 Testing MOBI Conversions...');
        
        const testCases = [
            { from: 'mobi', to: 'epub', description: 'MOBI → EPUB' },
            { from: 'mobi', to: 'azw3', description: 'MOBI → AZW3' },
            { from: 'mobi', to: 'pdf', description: 'MOBI → PDF' },
            { from: 'mobi', to: 'docx', description: 'MOBI → DOCX' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.from, testCase.to, testCase.description);
        }
    }

    async testAzw3Conversions() {
        console.log('\n📘 Testing AZW3 Conversions...');
        
        const testCases = [
            { from: 'azw3', to: 'epub', description: 'AZW3 → EPUB' },
            { from: 'azw3', to: 'mobi', description: 'AZW3 → MOBI' },
            { from: 'azw3', to: 'pdf', description: 'AZW3 → PDF' },
            { from: 'azw3', to: 'docx', description: 'AZW3 → DOCX' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.from, testCase.to, testCase.description);
        }
    }

    async testPdfToEbookConversions() {
        console.log('\n📄 Testing PDF to Ebook Conversions...');
        
        const testCases = [
            { from: 'pdf', to: 'epub', description: 'PDF → EPUB' },
            { from: 'pdf', to: 'mobi', description: 'PDF → MOBI' },
            { from: 'pdf', to: 'azw3', description: 'PDF → AZW3' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.from, testCase.to, testCase.description);
        }
    }

    async testDocxToEbookConversions() {
        console.log('\n📝 Testing DOCX to Ebook Conversions...');
        
        const testCases = [
            { from: 'docx', to: 'epub', description: 'DOCX → EPUB' },
            { from: 'docx', to: 'mobi', description: 'DOCX → MOBI' },
            { from: 'docx', to: 'azw3', description: 'DOCX → AZW3' }
        ];

        for (const testCase of testCases) {
            await this.testConversion(testCase.from, testCase.to, testCase.description);
        }
    }

    async testConversion(fromFormat, toFormat, description) {
        try {
            console.log(`  Testing: ${description}`);
            
            // Create sample input file
            const inputPath = await this.createSampleEbookFile(fromFormat);
            
            // Perform conversion
            const result = await this.ebookConverter.convert(inputPath, toFormat);
            
            // Verify result
            const success = await this.verifyEbookConversion(result, toFormat);
            
            this.testResults.push({
                test: description,
                status: success ? 'PASS' : 'FAIL',
                inputFormat: fromFormat,
                outputFormat: toFormat,
                result: result,
                method: result.method || 'unknown'
            });

            console.log(`    ${success ? '✅ PASS' : '❌ FAIL'}: ${description}`);
            
            // Clean up test files
            await this.cleanupTestFiles([inputPath, result.filename]);

        } catch (error) {
            console.log(`    ❌ ERROR: ${description} - ${error.message}`);
            this.testResults.push({
                test: description,
                status: 'ERROR',
                inputFormat: fromFormat,
                outputFormat: toFormat,
                error: error.message
            });
        }
    }

    async createSampleEbookFile(format) {
        const filename = `sample-${format}-${Date.now()}.${format}`;
        const filepath = path.join(this.testDir, filename);
        
        let content = '';
        
        switch (format) {
            case 'epub':
                content = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>Sample EPUB Book</dc:title>
        <dc:creator>Test Author</dc:creator>
        <dc:language>en</dc:language>
    </metadata>
    <manifest>
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
        <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    </manifest>
    <spine>
        <itemref idref="nav"/>
        <itemref idref="chapter1"/>
    </spine>
</package>`;
                break;
                
            case 'mobi':
                content = 'MOBI format sample content - test conversion';
                break;
                
            case 'azw3':
                content = 'AZW3 format sample content - test conversion';
                break;
                
            case 'pdf':
                content = 'PDF sample content - test conversion';
                break;
                
            case 'docx':
                content = 'DOCX sample content - test conversion';
                break;
                
            default:
                content = `Sample ${format} content for testing`;
        }
        
        await fs.writeFile(filepath, content);
        return filepath;
    }

    async verifyEbookConversion(result, expectedFormat) {
        try {
            // Check if result has required properties
            if (!result || !result.filename || !result.format) {
                return false;
            }

            // Check if format matches expected
            if (result.format.toLowerCase() !== expectedFormat.toLowerCase()) {
                return false;
            }

            // Check if file exists and has content
            const outputPath = path.join(__dirname, 'converted', result.filename);
            const stats = await fs.stat(outputPath);
            
            if (stats.size === 0) {
                return false;
            }

            // Check if MIME type is correct
            const expectedMimeTypes = {
                'epub': 'application/epub+zip',
                'mobi': 'application/x-mobipocket-ebook',
                'azw3': 'application/vnd.amazon.ebook',
                'pdf': 'application/pdf',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            };

            if (result.mimeType !== expectedMimeTypes[expectedFormat]) {
                return false;
            }

            return true;

        } catch (error) {
            console.log(`    Verification error: ${error.message}`);
            return false;
        }
    }

    async cleanupTestFiles(files) {
        for (const file of files) {
            try {
                if (typeof file === 'string') {
                    await fs.unlink(file);
                } else if (file && file.filename) {
                    const outputPath = path.join(__dirname, 'converted', file.filename);
                    await fs.unlink(outputPath);
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 EBOOK CONVERSION TEST REPORT');
        console.log('='.repeat(80));

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
        const errorTests = this.testResults.filter(r => r.status === 'ERROR').length;

        console.log(`\n📈 SUMMARY:`);
        console.log(`  Total Tests: ${totalTests}`);
        console.log(`  Passed: ${passedTests} ✅`);
        console.log(`  Failed: ${failedTests} ❌`);
        console.log(`  Errors: ${errorTests} ⚠️`);
        console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        console.log(`\n📋 DETAILED RESULTS:`);
        this.testResults.forEach((result, index) => {
            const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
            console.log(`  ${index + 1}. ${statusIcon} ${result.test}`);
            if (result.method) {
                console.log(`     Method: ${result.method}`);
            }
            if (result.error) {
                console.log(`     Error: ${result.error}`);
            }
        });

        console.log(`\n🎯 REQUESTED CONVERSIONS STATUS:`);
        
        const requestedConversions = [
            'EPUB ↔ MOBI / PDF / AZW3',
            'PDF ↔ EPUB',
            'DOCX ↔ EPUB / MOBI'
        ];

        requestedConversions.forEach(conversion => {
            const relevantTests = this.testResults.filter(r => 
                r.test.includes(conversion.split('↔')[0].trim()) || 
                r.test.includes(conversion.split('↔')[1].trim())
            );
            
            const allPassed = relevantTests.every(r => r.status === 'PASS');
            const status = allPassed ? '✅ FULLY IMPLEMENTED' : '❌ PARTIALLY IMPLEMENTED';
            
            console.log(`  ${status}: ${conversion}`);
        });

        console.log(`\n🔧 TECHNICAL DETAILS:`);
        console.log(`  - Calibre Available: ${this.ebookConverter.calibreAvailable ? 'Yes' : 'No'}`);
        console.log(`  - Fallback Methods: ${this.ebookConverter.calibreAvailable ? 'Not needed' : 'Active'}`);
        console.log(`  - Production Ready: ${this.isProductionReady() ? 'Yes' : 'No'}`);

        console.log(`\n📝 RECOMMENDATIONS:`);
        if (!this.ebookConverter.calibreAvailable) {
            console.log(`  - Install Calibre for full ebook conversion support`);
            console.log(`  - Current fallback methods provide basic functionality`);
        }
        
        if (failedTests > 0 || errorTests > 0) {
            console.log(`  - Review failed conversions and improve error handling`);
        }

        console.log(`\n${'='.repeat(80)}`);
    }

    isProductionReady() {
        const criticalConversions = [
            'EPUB → MOBI', 'EPUB → AZW3', 'EPUB → PDF',
            'MOBI → EPUB', 'MOBI → AZW3', 'MOBI → PDF',
            'AZW3 → EPUB', 'AZW3 → MOBI', 'AZW3 → PDF',
            'PDF → EPUB', 'DOCX → EPUB', 'DOCX → MOBI'
        ];

        const criticalTests = this.testResults.filter(r => 
            criticalConversions.some(conv => r.test.includes(conv))
        );

        return criticalTests.every(r => r.status === 'PASS');
    }

    async cleanup() {
        try {
            await fs.rmdir(this.testDir, { recursive: true });
            console.log('\n🧹 Test directory cleaned up');
        } catch (error) {
            console.log('\n🧹 Cleanup completed');
        }
    }
}

if (require.main === module) {
    const tester = new EbookConversionTester();
    tester.runAllTests()
        .then(() => tester.cleanup())
        .catch(console.error);
}

module.exports = EbookConversionTester; 