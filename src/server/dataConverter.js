/**
 * Data Converter
 * Handles data format conversions
 * Supports: CSV ↔ XLS / JSON / XML / YAML, JSON ↔ XML / CSV / YAML
 */

const fs = require('fs').promises;
const path = require('path');
const XLSX = require('xlsx');
const yaml = require('js-yaml');
const xml2js = require('xml2js');
const csvParser = require('csv-parser');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const { createReadStream, createWriteStream } = require('fs');

class DataConverter {
    constructor() {
        this.supportedFormats = {
            input: ['csv', 'xls', 'xlsx', 'json', 'xml', 'yaml', 'yml'],
            output: ['csv', 'xls', 'xlsx', 'json', 'xml', 'yaml', 'yml']
        };
        
        this.mimeTypes = {
            'csv': 'text/csv',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'json': 'application/json',
            'xml': 'application/xml',
            'yaml': 'text/yaml',
            'yml': 'text/yaml'
        };

        this.conversionMatrix = {
            // CSV conversions
            'csv': ['xls', 'xlsx', 'json', 'xml', 'yaml', 'yml'],
            // Excel conversions
            'xls': ['csv', 'xlsx', 'json', 'xml', 'yaml', 'yml'],
            'xlsx': ['csv', 'xls', 'json', 'xml', 'yaml', 'yml'],
            // JSON conversions
            'json': ['csv', 'xls', 'xlsx', 'xml', 'yaml', 'yml'],
            // XML conversions
            'xml': ['csv', 'xls', 'xlsx', 'json', 'yaml', 'yml'],
            // YAML conversions
            'yaml': ['csv', 'xls', 'xlsx', 'json', 'xml'],
            'yml': ['csv', 'xls', 'xlsx', 'json', 'xml']
        };
    }

    /**
     * Get supported formats
     */
    getSupportedFormats() {
        return this.supportedFormats;
    }

    /**
     * Get MIME type for format
     */
    getMimeType(format) {
        return this.mimeTypes[format.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Get available output formats for input format
     */
    getAvailableOutputFormats(inputFormat) {
        return this.conversionMatrix[inputFormat.toLowerCase()] || [];
    }

    /**
     * Convert data file
     */
    async convert(inputPath, outputPath, targetFormat, options = {}) {
        try {
            const inputFormat = this.getFileFormat(inputPath);
            const outputFormat = targetFormat.toLowerCase();

            console.log(`Converting data file from ${inputFormat} to ${outputFormat}`);

            // Validate formats
            if (!this.supportedFormats.input.includes(inputFormat)) {
                throw new Error(`Unsupported input format: ${inputFormat}`);
            }
            if (!this.supportedFormats.output.includes(outputFormat)) {
                throw new Error(`Unsupported output format: ${outputFormat}`);
            }

            // Check if conversion is supported
            const availableFormats = this.getAvailableOutputFormats(inputFormat);
            if (!availableFormats.includes(outputFormat)) {
                throw new Error(`Conversion from ${inputFormat} to ${outputFormat} is not supported`);
            }

            // Parse input data
            const data = await this.parseInputFile(inputPath, inputFormat, options);

            // Convert to target format
            const result = await this.convertToFormat(data, outputPath, outputFormat, options);

            return {
                success: true,
                message: `Successfully converted from ${inputFormat} to ${outputFormat}`,
                outputPath,
                metadata: await this.getDataMetadata(data, inputFormat)
            };

        } catch (error) {
            console.error('Data conversion error:', error);
            throw new Error(`Data conversion failed: ${error.message}`);
        }
    }

    /**
     * Parse input file based on format
     */
    async parseInputFile(filePath, format, options = {}) {
        try {
            switch (format) {
                case 'csv':
                    return await this.parseCsv(filePath, options);
                case 'xls':
                case 'xlsx':
                    return await this.parseExcel(filePath, options);
                case 'json':
                    return await this.parseJson(filePath, options);
                case 'xml':
                    return await this.parseXml(filePath, options);
                case 'yaml':
                case 'yml':
                    return await this.parseYaml(filePath, options);
                default:
                    throw new Error(`Unsupported input format: ${format}`);
            }
        } catch (error) {
            throw new Error(`Failed to parse ${format} file: ${error.message}`);
        }
    }

    /**
     * Parse CSV file
     */
    async parseCsv(filePath, options = {}) {
        return new Promise((resolve, reject) => {
            const results = [];
            const headers = [];
            let isFirstRow = true;

            createReadStream(filePath)
                .pipe(csvParser({
                    separator: options.separator || ',',
                    quote: options.quote || '"',
                    escape: options.escape || '"',
                    headers: options.headers !== false
                }))
                .on('data', (data) => {
                    if (isFirstRow && options.headers !== false) {
                        headers.push(...Object.keys(data));
                        isFirstRow = false;
                    }
                    results.push(data);
                })
                .on('end', () => {
                    resolve({
                        type: 'table',
                        data: results,
                        headers: headers.length > 0 ? headers : Object.keys(results[0] || {}),
                        format: 'csv',
                        rowCount: results.length,
                        columnCount: headers.length || (results[0] ? Object.keys(results[0]).length : 0)
                    });
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    /**
     * Parse Excel file
     */
    async parseExcel(filePath, options = {}) {
        try {
            const workbook = XLSX.readFile(filePath, {
                cellDates: true,
                cellNF: false,
                cellText: false
            });

            const sheetName = options.sheetName || workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            if (!worksheet) {
                throw new Error(`Sheet '${sheetName}' not found`);
            }

            // Convert to JSON with headers
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: options.headers !== false ? 1 : undefined,
                defval: options.defval || ''
            });

            const headers = options.headers !== false ? jsonData[0] : Object.keys(jsonData[0] || {});
            const data = options.headers !== false ? jsonData.slice(1) : jsonData;

            return {
                type: 'table',
                data: data,
                headers: headers,
                format: 'excel',
                sheetName: sheetName,
                rowCount: data.length,
                columnCount: headers.length,
                sheets: workbook.SheetNames
            };
        } catch (error) {
            throw new Error(`Excel parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse JSON file
     */
    async parseJson(filePath, options = {}) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);

            // Determine if it's tabular data
            if (Array.isArray(data)) {
                if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                    const headers = Object.keys(data[0]);
                    return {
                        type: 'table',
                        data: data,
                        headers: headers,
                        format: 'json',
                        rowCount: data.length,
                        columnCount: headers.length
                    };
                } else {
                    return {
                        type: 'array',
                        data: data,
                        format: 'json',
                        length: data.length
                    };
                }
            } else if (typeof data === 'object' && data !== null) {
                return {
                    type: 'object',
                    data: data,
                    format: 'json',
                    keys: Object.keys(data)
                };
            } else {
                return {
                    type: 'primitive',
                    data: data,
                    format: 'json'
                };
            }
        } catch (error) {
            throw new Error(`JSON parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse XML file
     */
    async parseXml(filePath, options = {}) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const parser = new xml2js.Parser({
                explicitArray: options.explicitArray !== false,
                mergeAttrs: options.mergeAttrs !== false,
                explicitRoot: options.explicitRoot !== false
            });

            const result = await parser.parseStringPromise(content);
            return {
                type: 'xml',
                data: result,
                format: 'xml',
                rootElement: Object.keys(result)[0]
            };
        } catch (error) {
            throw new Error(`XML parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse YAML file
     */
    async parseYaml(filePath, options = {}) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = yaml.load(content, {
                onWarning: options.onWarning || (() => {}),
                schema: options.schema || yaml.DEFAULT_SAFE_SCHEMA
            });

            // Determine data type similar to JSON
            if (Array.isArray(data)) {
                if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
                    const headers = Object.keys(data[0]);
                    return {
                        type: 'table',
                        data: data,
                        headers: headers,
                        format: 'yaml',
                        rowCount: data.length,
                        columnCount: headers.length
                    };
                } else {
                    return {
                        type: 'array',
                        data: data,
                        format: 'yaml',
                        length: data.length
                    };
                }
            } else if (typeof data === 'object' && data !== null) {
                return {
                    type: 'object',
                    data: data,
                    format: 'yaml',
                    keys: Object.keys(data)
                };
            } else {
                return {
                    type: 'primitive',
                    data: data,
                    format: 'yaml'
                };
            }
        } catch (error) {
            throw new Error(`YAML parsing failed: ${error.message}`);
        }
    }

    /**
     * Convert data to target format
     */
    async convertToFormat(data, outputPath, format, options = {}) {
        try {
            switch (format) {
                case 'csv':
                    return await this.convertToCsv(data, outputPath, options);
                case 'xls':
                case 'xlsx':
                    return await this.convertToExcel(data, outputPath, format, options);
                case 'json':
                    return await this.convertToJson(data, outputPath, options);
                case 'xml':
                    return await this.convertToXml(data, outputPath, options);
                case 'yaml':
                case 'yml':
                    return await this.convertToYaml(data, outputPath, options);
                default:
                    throw new Error(`Unsupported output format: ${format}`);
            }
        } catch (error) {
            throw new Error(`Failed to convert to ${format}: ${error.message}`);
        }
    }

    /**
     * Convert to CSV
     */
    async convertToCsv(data, outputPath, options = {}) {
        try {
            if (data.type === 'table') {
                const csvWriterInstance = csvWriter({
                    path: outputPath,
                    header: data.headers.map(header => ({ id: header, title: header })),
                    fieldDelimiter: options.separator || ',',
                    recordDelimiter: options.recordDelimiter || '\n'
                });

                await csvWriterInstance.writeRecords(data.data);
            } else {
                // Convert non-tabular data to CSV
                const csvData = this.convertNonTabularToCsv(data, options);
                await fs.writeFile(outputPath, csvData);
            }
        } catch (error) {
            throw new Error(`CSV conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to Excel
     */
    async convertToExcel(data, outputPath, format, options = {}) {
        try {
            let worksheet;
            
            if (data.type === 'table') {
                // Create worksheet from tabular data
                const workbook = XLSX.utils.book_new();
                worksheet = XLSX.utils.json_to_sheet(data.data, {
                    header: data.headers,
                    skipHeader: options.skipHeader || false
                });
                
                XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
                XLSX.writeFile(workbook, outputPath);
            } else {
                // Convert non-tabular data to Excel
                const workbook = XLSX.utils.book_new();
                
                if (data.type === 'array') {
                    worksheet = XLSX.utils.aoa_to_sheet([data.data]);
                } else if (data.type === 'object') {
                    const flatData = this.flattenObject(data.data);
                    worksheet = XLSX.utils.json_to_sheet([flatData]);
                } else {
                    worksheet = XLSX.utils.aoa_to_sheet([[data.data]]);
                }
                
                XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
                XLSX.writeFile(workbook, outputPath);
            }
        } catch (error) {
            throw new Error(`Excel conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to JSON
     */
    async convertToJson(data, outputPath, options = {}) {
        try {
            let jsonData;
            
            if (data.type === 'table') {
                jsonData = data.data;
            } else if (data.type === 'array') {
                jsonData = data.data;
            } else if (data.type === 'object') {
                jsonData = data.data;
            } else {
                jsonData = data.data;
            }

            const jsonString = JSON.stringify(jsonData, null, options.pretty !== false ? 2 : 0);
            await fs.writeFile(outputPath, jsonString, 'utf8');
        } catch (error) {
            throw new Error(`JSON conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to XML
     */
    async convertToXml(data, outputPath, options = {}) {
        try {
            const builder = new xml2js.Builder({
                rootName: options.rootName || 'data',
                headless: options.headless !== false,
                renderOpts: {
                    pretty: options.pretty !== false,
                    indent: options.indent || '  ',
                    newline: options.newline || '\n'
                }
            });

            let xmlData;
            
            if (data.type === 'table') {
                xmlData = {
                    [options.rootName || 'data']: {
                        headers: data.headers,
                        rows: data.data.map(row => ({ row: row }))
                    }
                };
            } else if (data.type === 'array') {
                xmlData = {
                    [options.rootName || 'data']: {
                        items: data.data.map(item => ({ item: item }))
                    }
                };
            } else if (data.type === 'object') {
                xmlData = data.data;
            } else {
                xmlData = { [options.rootName || 'data']: data.data };
            }

            const xmlString = builder.buildObject(xmlData);
            await fs.writeFile(outputPath, xmlString, 'utf8');
        } catch (error) {
            throw new Error(`XML conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert to YAML
     */
    async convertToYaml(data, outputPath, options = {}) {
        try {
            let yamlData;
            
            if (data.type === 'table') {
                yamlData = data.data;
            } else if (data.type === 'array') {
                yamlData = data.data;
            } else if (data.type === 'object') {
                yamlData = data.data;
            } else {
                yamlData = data.data;
            }

            const yamlString = yaml.dump(yamlData, {
                indent: options.indent || 2,
                lineWidth: options.lineWidth || 80,
                noRefs: options.noRefs !== false,
                sortKeys: options.sortKeys || false
            });

            await fs.writeFile(outputPath, yamlString, 'utf8');
        } catch (error) {
            throw new Error(`YAML conversion failed: ${error.message}`);
        }
    }

    /**
     * Convert non-tabular data to CSV
     */
    convertNonTabularToCsv(data, options = {}) {
        const separator = options.separator || ',';
        const quote = options.quote || '"';
        
        if (data.type === 'array') {
            return data.data.map(item => 
                typeof item === 'object' ? 
                    Object.values(item).map(val => `${quote}${val}${quote}`).join(separator) :
                    `${quote}${item}${quote}`
            ).join('\n');
        } else if (data.type === 'object') {
            const flatData = this.flattenObject(data.data);
            const headers = Object.keys(flatData);
            const values = Object.values(flatData);
            return [
                headers.map(h => `${quote}${h}${quote}`).join(separator),
                values.map(v => `${quote}${v}${quote}`).join(separator)
            ].join('\n');
        } else {
            return `${quote}${data.data}${quote}`;
        }
    }

    /**
     * Flatten nested object
     */
    flattenObject(obj, prefix = '') {
        const flattened = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                
                if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                    Object.assign(flattened, this.flattenObject(obj[key], newKey));
                } else {
                    flattened[newKey] = obj[key];
                }
            }
        }
        
        return flattened;
    }

    /**
     * Get file format from path
     */
    getFileFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase().substring(1);
        return ext === 'yml' ? 'yaml' : ext;
    }

    /**
     * Get data metadata
     */
    async getDataMetadata(data, format) {
        return {
            format: format,
            type: data.type,
            rowCount: data.rowCount || 0,
            columnCount: data.columnCount || 0,
            size: data.data ? JSON.stringify(data.data).length : 0,
            hasHeaders: data.headers ? data.headers.length > 0 : false,
            sheets: data.sheets || [],
            rootElement: data.rootElement || null
        };
    }

    /**
     * Validate data file
     */
    async validateDataFile(filePath, format) {
        try {
            await this.parseInputFile(filePath, format);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get data preview (first few rows)
     */
    async getDataPreview(filePath, format, options = {}) {
        try {
            const data = await this.parseInputFile(filePath, format, options);
            const maxRows = options.maxRows || 5;
            
            if (data.type === 'table') {
                return {
                    ...data,
                    data: data.data.slice(0, maxRows),
                    preview: true,
                    totalRows: data.rowCount
                };
            } else {
                return {
                    ...data,
                    preview: true
                };
            }
        } catch (error) {
            throw new Error(`Failed to get data preview: ${error.message}`);
        }
    }
}

module.exports = DataConverter; 