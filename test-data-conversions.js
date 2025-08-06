/**
 * Data Conversion Tests
 * Tests all data format conversions
 */

const fs = require('fs').promises;
const path = require('path');
const DataConverter = require('./src/server/dataConverter');

class DataConversionTester {
    constructor() {
        this.converter = new DataConverter();
        this.testDir = path.join(__dirname, 'test-data');
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
        console.log('🚀 Starting Data Conversion Tests...\n');
        
        try {
            await this.setupTestEnvironment();
            
            // Test basic functionality
            await this.testSupportedFormats();
            await this.testMimeTypes();
            await this.testFileFormatDetection();
            await this.testAvailableOutputFormats();
            
            // Test CSV conversions
            await this.testCsvToJson();
            await this.testCsvToXml();
            await this.testCsvToYaml();
            await this.testCsvToExcel();
            
            // Test JSON conversions
            await this.testJsonToCsv();
            await this.testJsonToXml();
            await this.testJsonToYaml();
            await this.testJsonToExcel();
            
            // Test XML conversions
            await this.testXmlToCsv();
            await this.testXmlToJson();
            await this.testXmlToYaml();
            await this.testXmlToExcel();
            
            // Test YAML conversions
            await this.testYamlToCsv();
            await this.testYamlToJson();
            await this.testYamlToXml();
            await this.testYamlToExcel();
            
            // Test Excel conversions
            await this.testExcelToCsv();
            await this.testExcelToJson();
            await this.testExcelToXml();
            await this.testExcelToYaml();
            
            // Test data validation and preview
            await this.testDataValidation();
            await this.testDataPreview();
            
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
        
        const expectedInput = ['csv', 'xls', 'xlsx', 'json', 'xml', 'yaml', 'yml'];
        const expectedOutput = ['csv', 'xls', 'xlsx', 'json', 'xml', 'yaml', 'yml'];
        
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
            console.log('Actual output:', formats.output);
        }
    }

    /**
     * Test MIME types
     */
    async testMimeTypes() {
        console.log('\n📋 Testing MIME types...');
        
        const testCases = [
            { format: 'csv', expected: 'text/csv' },
            { format: 'xls', expected: 'application/vnd.ms-excel' },
            { format: 'xlsx', expected: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            { format: 'json', expected: 'application/json' },
            { format: 'xml', expected: 'application/xml' },
            { format: 'yaml', expected: 'text/yaml' },
            { format: 'yml', expected: 'text/yaml' }
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
            { filename: 'test.csv', expected: 'csv' },
            { filename: 'test.xls', expected: 'xls' },
            { filename: 'test.xlsx', expected: 'xlsx' },
            { filename: 'test.json', expected: 'json' },
            { filename: 'test.xml', expected: 'xml' },
            { filename: 'test.yaml', expected: 'yaml' },
            { filename: 'test.yml', expected: 'yaml' }
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
     * Test available output formats
     */
    async testAvailableOutputFormats() {
        console.log('\n📋 Testing available output formats...');
        
        const testCases = [
            {
                input: 'csv',
                expected: ['xls', 'xlsx', 'json', 'xml', 'yaml', 'yml']
            },
            {
                input: 'json',
                expected: ['csv', 'xls', 'xlsx', 'xml', 'yaml', 'yml']
            },
            {
                input: 'xml',
                expected: ['csv', 'xls', 'xlsx', 'json', 'yaml', 'yml']
            },
            {
                input: 'yaml',
                expected: ['csv', 'xls', 'xlsx', 'json', 'xml']
            }
        ];
        
        let allPassed = true;
        
        for (const testCase of testCases) {
            const availableFormats = this.converter.getAvailableOutputFormats(testCase.input);
            const match = JSON.stringify(availableFormats.sort()) === JSON.stringify(testCase.expected.sort());
            
            if (!match) {
                allPassed = false;
                console.log(`❌ Available formats test failed for ${testCase.input}: expected ${testCase.expected}, got ${availableFormats}`);
            }
        }
        
        if (allPassed) {
            this.results.passed++;
            console.log('✅ Available output formats test passed');
        } else {
            this.results.failed++;
        }
    }

    /**
     * Test CSV to JSON conversion
     */
    async testCsvToJson() {
        console.log('\n📋 Testing CSV to JSON conversion...');
        
        try {
            const csvPath = path.join(this.testDir, 'test.csv');
            const jsonPath = path.join(this.testDir, 'test-converted.json');
            
            await this.createTestCsv(csvPath);
            const result = await this.converter.convert(csvPath, jsonPath, 'json');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CSV to JSON conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CSV to JSON conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CSV to JSON conversion failed: ${error.message}`);
            console.log('❌ CSV to JSON conversion test failed:', error.message);
        }
    }

    /**
     * Test CSV to XML conversion
     */
    async testCsvToXml() {
        console.log('\n📋 Testing CSV to XML conversion...');
        
        try {
            const csvPath = path.join(this.testDir, 'test.csv');
            const xmlPath = path.join(this.testDir, 'test-converted.xml');
            
            const result = await this.converter.convert(csvPath, xmlPath, 'xml');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CSV to XML conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CSV to XML conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CSV to XML conversion failed: ${error.message}`);
            console.log('❌ CSV to XML conversion test failed:', error.message);
        }
    }

    /**
     * Test CSV to YAML conversion
     */
    async testCsvToYaml() {
        console.log('\n📋 Testing CSV to YAML conversion...');
        
        try {
            const csvPath = path.join(this.testDir, 'test.csv');
            const yamlPath = path.join(this.testDir, 'test-converted.yaml');
            
            const result = await this.converter.convert(csvPath, yamlPath, 'yaml');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CSV to YAML conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CSV to YAML conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CSV to YAML conversion failed: ${error.message}`);
            console.log('❌ CSV to YAML conversion test failed:', error.message);
        }
    }

    /**
     * Test CSV to Excel conversion
     */
    async testCsvToExcel() {
        console.log('\n📋 Testing CSV to Excel conversion...');
        
        try {
            const csvPath = path.join(this.testDir, 'test.csv');
            const xlsxPath = path.join(this.testDir, 'test-converted.xlsx');
            
            const result = await this.converter.convert(csvPath, xlsxPath, 'xlsx');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ CSV to Excel conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ CSV to Excel conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`CSV to Excel conversion failed: ${error.message}`);
            console.log('❌ CSV to Excel conversion test failed:', error.message);
        }
    }

    /**
     * Test JSON to CSV conversion
     */
    async testJsonToCsv() {
        console.log('\n📋 Testing JSON to CSV conversion...');
        
        try {
            const jsonPath = path.join(this.testDir, 'test.json');
            const csvPath = path.join(this.testDir, 'test-converted2.csv');
            
            await this.createTestJson(jsonPath);
            const result = await this.converter.convert(jsonPath, csvPath, 'csv');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ JSON to CSV conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ JSON to CSV conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`JSON to CSV conversion failed: ${error.message}`);
            console.log('❌ JSON to CSV conversion test failed:', error.message);
        }
    }

    /**
     * Test JSON to XML conversion
     */
    async testJsonToXml() {
        console.log('\n📋 Testing JSON to XML conversion...');
        
        try {
            const jsonPath = path.join(this.testDir, 'test.json');
            const xmlPath = path.join(this.testDir, 'test-converted2.xml');
            
            const result = await this.converter.convert(jsonPath, xmlPath, 'xml');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ JSON to XML conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ JSON to XML conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`JSON to XML conversion failed: ${error.message}`);
            console.log('❌ JSON to XML conversion test failed:', error.message);
        }
    }

    /**
     * Test JSON to YAML conversion
     */
    async testJsonToYaml() {
        console.log('\n📋 Testing JSON to YAML conversion...');
        
        try {
            const jsonPath = path.join(this.testDir, 'test.json');
            const yamlPath = path.join(this.testDir, 'test-converted2.yaml');
            
            const result = await this.converter.convert(jsonPath, yamlPath, 'yaml');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ JSON to YAML conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ JSON to YAML conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`JSON to YAML conversion failed: ${error.message}`);
            console.log('❌ JSON to YAML conversion test failed:', error.message);
        }
    }

    /**
     * Test JSON to Excel conversion
     */
    async testJsonToExcel() {
        console.log('\n📋 Testing JSON to Excel conversion...');
        
        try {
            const jsonPath = path.join(this.testDir, 'test.json');
            const xlsxPath = path.join(this.testDir, 'test-converted2.xlsx');
            
            const result = await this.converter.convert(jsonPath, xlsxPath, 'xlsx');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ JSON to Excel conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ JSON to Excel conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`JSON to Excel conversion failed: ${error.message}`);
            console.log('❌ JSON to Excel conversion test failed:', error.message);
        }
    }

    /**
     * Test XML conversions
     */
    async testXmlToCsv() {
        console.log('\n📋 Testing XML to CSV conversion...');
        
        try {
            const xmlPath = path.join(this.testDir, 'test.xml');
            const csvPath = path.join(this.testDir, 'test-converted3.csv');
            
            await this.createTestXml(xmlPath);
            const result = await this.converter.convert(xmlPath, csvPath, 'csv');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ XML to CSV conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ XML to CSV conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`XML to CSV conversion failed: ${error.message}`);
            console.log('❌ XML to CSV conversion test failed:', error.message);
        }
    }

    async testXmlToJson() {
        console.log('\n📋 Testing XML to JSON conversion...');
        
        try {
            const xmlPath = path.join(this.testDir, 'test.xml');
            const jsonPath = path.join(this.testDir, 'test-converted3.json');
            
            const result = await this.converter.convert(xmlPath, jsonPath, 'json');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ XML to JSON conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ XML to JSON conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`XML to JSON conversion failed: ${error.message}`);
            console.log('❌ XML to JSON conversion test failed:', error.message);
        }
    }

    async testXmlToYaml() {
        console.log('\n📋 Testing XML to YAML conversion...');
        
        try {
            const xmlPath = path.join(this.testDir, 'test.xml');
            const yamlPath = path.join(this.testDir, 'test-converted3.yaml');
            
            const result = await this.converter.convert(xmlPath, yamlPath, 'yaml');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ XML to YAML conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ XML to YAML conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`XML to YAML conversion failed: ${error.message}`);
            console.log('❌ XML to YAML conversion test failed:', error.message);
        }
    }

    async testXmlToExcel() {
        console.log('\n📋 Testing XML to Excel conversion...');
        
        try {
            const xmlPath = path.join(this.testDir, 'test.xml');
            const xlsxPath = path.join(this.testDir, 'test-converted3.xlsx');
            
            const result = await this.converter.convert(xmlPath, xlsxPath, 'xlsx');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ XML to Excel conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ XML to Excel conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`XML to Excel conversion failed: ${error.message}`);
            console.log('❌ XML to Excel conversion test failed:', error.message);
        }
    }

    /**
     * Test YAML conversions
     */
    async testYamlToCsv() {
        console.log('\n📋 Testing YAML to CSV conversion...');
        
        try {
            const yamlPath = path.join(this.testDir, 'test.yaml');
            const csvPath = path.join(this.testDir, 'test-converted4.csv');
            
            await this.createTestYaml(yamlPath);
            const result = await this.converter.convert(yamlPath, csvPath, 'csv');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ YAML to CSV conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ YAML to CSV conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`YAML to CSV conversion failed: ${error.message}`);
            console.log('❌ YAML to CSV conversion test failed:', error.message);
        }
    }

    async testYamlToJson() {
        console.log('\n📋 Testing YAML to JSON conversion...');
        
        try {
            const yamlPath = path.join(this.testDir, 'test.yaml');
            const jsonPath = path.join(this.testDir, 'test-converted4.json');
            
            const result = await this.converter.convert(yamlPath, jsonPath, 'json');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ YAML to JSON conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ YAML to JSON conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`YAML to JSON conversion failed: ${error.message}`);
            console.log('❌ YAML to JSON conversion test failed:', error.message);
        }
    }

    async testYamlToXml() {
        console.log('\n📋 Testing YAML to XML conversion...');
        
        try {
            const yamlPath = path.join(this.testDir, 'test.yaml');
            const xmlPath = path.join(this.testDir, 'test-converted4.xml');
            
            const result = await this.converter.convert(yamlPath, xmlPath, 'xml');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ YAML to XML conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ YAML to XML conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`YAML to XML conversion failed: ${error.message}`);
            console.log('❌ YAML to XML conversion test failed:', error.message);
        }
    }

    async testYamlToExcel() {
        console.log('\n📋 Testing YAML to Excel conversion...');
        
        try {
            const yamlPath = path.join(this.testDir, 'test.yaml');
            const xlsxPath = path.join(this.testDir, 'test-converted4.xlsx');
            
            const result = await this.converter.convert(yamlPath, xlsxPath, 'xlsx');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ YAML to Excel conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ YAML to Excel conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`YAML to Excel conversion failed: ${error.message}`);
            console.log('❌ YAML to Excel conversion test failed:', error.message);
        }
    }

    /**
     * Test Excel conversions
     */
    async testExcelToCsv() {
        console.log('\n📋 Testing Excel to CSV conversion...');
        
        try {
            const xlsxPath = path.join(this.testDir, 'test.xlsx');
            const csvPath = path.join(this.testDir, 'test-converted5.csv');
            
            await this.createTestExcel(xlsxPath);
            const result = await this.converter.convert(xlsxPath, csvPath, 'csv');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ Excel to CSV conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ Excel to CSV conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Excel to CSV conversion failed: ${error.message}`);
            console.log('❌ Excel to CSV conversion test failed:', error.message);
        }
    }

    async testExcelToJson() {
        console.log('\n📋 Testing Excel to JSON conversion...');
        
        try {
            const xlsxPath = path.join(this.testDir, 'test.xlsx');
            const jsonPath = path.join(this.testDir, 'test-converted5.json');
            
            const result = await this.converter.convert(xlsxPath, jsonPath, 'json');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ Excel to JSON conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ Excel to JSON conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Excel to JSON conversion failed: ${error.message}`);
            console.log('❌ Excel to JSON conversion test failed:', error.message);
        }
    }

    async testExcelToXml() {
        console.log('\n📋 Testing Excel to XML conversion...');
        
        try {
            const xlsxPath = path.join(this.testDir, 'test.xlsx');
            const xmlPath = path.join(this.testDir, 'test-converted5.xml');
            
            const result = await this.converter.convert(xlsxPath, xmlPath, 'xml');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ Excel to XML conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ Excel to XML conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Excel to XML conversion failed: ${error.message}`);
            console.log('❌ Excel to XML conversion test failed:', error.message);
        }
    }

    async testExcelToYaml() {
        console.log('\n📋 Testing Excel to YAML conversion...');
        
        try {
            const xlsxPath = path.join(this.testDir, 'test.xlsx');
            const yamlPath = path.join(this.testDir, 'test-converted5.yaml');
            
            const result = await this.converter.convert(xlsxPath, yamlPath, 'yaml');
            
            if (result.success) {
                this.results.passed++;
                console.log('✅ Excel to YAML conversion test passed');
            } else {
                this.results.failed++;
                console.log('❌ Excel to YAML conversion test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Excel to YAML conversion failed: ${error.message}`);
            console.log('❌ Excel to YAML conversion test failed:', error.message);
        }
    }

    /**
     * Test data validation
     */
    async testDataValidation() {
        console.log('\n📋 Testing data validation...');
        
        try {
            const csvPath = path.join(this.testDir, 'test.csv');
            const isValid = await this.converter.validateDataFile(csvPath, 'csv');
            
            if (isValid) {
                this.results.passed++;
                console.log('✅ Data validation test passed');
            } else {
                this.results.failed++;
                console.log('❌ Data validation test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Data validation failed: ${error.message}`);
            console.log('❌ Data validation test failed:', error.message);
        }
    }

    /**
     * Test data preview
     */
    async testDataPreview() {
        console.log('\n📋 Testing data preview...');
        
        try {
            const csvPath = path.join(this.testDir, 'test.csv');
            const preview = await this.converter.getDataPreview(csvPath, 'csv', { maxRows: 3 });
            
            if (preview && preview.preview && preview.data.length <= 3) {
                this.results.passed++;
                console.log('✅ Data preview test passed');
            } else {
                this.results.failed++;
                console.log('❌ Data preview test failed');
            }
        } catch (error) {
            this.results.failed++;
            this.results.errors.push(`Data preview failed: ${error.message}`);
            console.log('❌ Data preview test failed:', error.message);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('\n📋 Testing error handling...');
        
        try {
            // Test with non-existent file
            const nonExistentPath = path.join(this.testDir, 'non-existent.csv');
            const outputPath = path.join(this.testDir, 'output.csv');
            
            await this.converter.convert(nonExistentPath, outputPath, 'json');
            
            this.results.failed++;
            console.log('❌ Error handling test failed - should have thrown error');
        } catch (error) {
            this.results.passed++;
            console.log('✅ Error handling test passed - error properly caught');
        }
    }

    /**
     * Create test CSV file
     */
    async createTestCsv(filePath) {
        const csvContent = `Name,Age,City,Email
John Doe,30,New York,john@example.com
Jane Smith,25,Los Angeles,jane@example.com
Bob Johnson,35,Chicago,bob@example.com
Alice Brown,28,Boston,alice@example.com`;
        
        await fs.writeFile(filePath, csvContent, 'utf8');
    }

    /**
     * Create test JSON file
     */
    async createTestJson(filePath) {
        const jsonContent = [
            { name: 'John Doe', age: 30, city: 'New York', email: 'john@example.com' },
            { name: 'Jane Smith', age: 25, city: 'Los Angeles', email: 'jane@example.com' },
            { name: 'Bob Johnson', age: 35, city: 'Chicago', email: 'bob@example.com' },
            { name: 'Alice Brown', age: 28, city: 'Boston', email: 'alice@example.com' }
        ];
        
        await fs.writeFile(filePath, JSON.stringify(jsonContent, null, 2), 'utf8');
    }

    /**
     * Create test XML file
     */
    async createTestXml(filePath) {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <person>
    <name>John Doe</name>
    <age>30</age>
    <city>New York</city>
    <email>john@example.com</email>
  </person>
  <person>
    <name>Jane Smith</name>
    <age>25</age>
    <city>Los Angeles</city>
    <email>jane@example.com</email>
  </person>
  <person>
    <name>Bob Johnson</name>
    <age>35</age>
    <city>Chicago</city>
    <email>bob@example.com</email>
  </person>
  <person>
    <name>Alice Brown</name>
    <age>28</age>
    <city>Boston</city>
    <email>alice@example.com</email>
  </person>
</data>`;
        
        await fs.writeFile(filePath, xmlContent, 'utf8');
    }

    /**
     * Create test YAML file
     */
    async createTestYaml(filePath) {
        const yamlContent = `- name: John Doe
  age: 30
  city: New York
  email: john@example.com
- name: Jane Smith
  age: 25
  city: Los Angeles
  email: jane@example.com
- name: Bob Johnson
  age: 35
  city: Chicago
  email: bob@example.com
- name: Alice Brown
  age: 28
  city: Boston
  email: alice@example.com`;
        
        await fs.writeFile(filePath, yamlContent, 'utf8');
    }

    /**
     * Create test Excel file
     */
    async createTestExcel(filePath) {
        const XLSX = require('xlsx');
        
        const data = [
            ['Name', 'Age', 'City', 'Email'],
            ['John Doe', 30, 'New York', 'john@example.com'],
            ['Jane Smith', 25, 'Los Angeles', 'jane@example.com'],
            ['Bob Johnson', 35, 'Chicago', 'bob@example.com'],
            ['Alice Brown', 28, 'Boston', 'alice@example.com']
        ];
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, filePath);
    }

    /**
     * Print test results
     */
    async printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 DATA CONVERSION TEST RESULTS');
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
            console.log('🎉 All data conversion tests passed!');
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
const tester = new DataConversionTester();
tester.runTests().catch(console.error); 