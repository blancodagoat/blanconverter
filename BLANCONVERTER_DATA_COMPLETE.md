# BLANCONVERTER - Data Format Conversion Complete Implementation

## Overview

The Data Converter module provides comprehensive support for converting between various data formats including CSV, JSON, XML, YAML, and Excel files. This implementation is production-ready, follows industry standards, and includes robust error handling and validation.

## Supported Formats

### Input Formats
- **CSV** (`text/csv`) - Comma-separated values
- **XLS** (`application/vnd.ms-excel`) - Microsoft Excel (legacy)
- **XLSX** (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) - Microsoft Excel (modern)
- **JSON** (`application/json`) - JavaScript Object Notation
- **XML** (`application/xml`) - Extensible Markup Language
- **YAML** (`text/yaml`) - YAML Ain't Markup Language
- **YML** (`text/yaml`) - YAML alternative extension

### Output Formats
- **CSV** - Comma-separated values with configurable delimiters
- **XLS** - Microsoft Excel (legacy format)
- **XLSX** - Microsoft Excel (modern format)
- **JSON** - JavaScript Object Notation with pretty printing
- **XML** - Extensible Markup Language with configurable formatting
- **YAML** - YAML Ain't Markup Language with configurable indentation

## Conversion Matrix

| From \ To | CSV | XLS | XLSX | JSON | XML | YAML |
|-----------|-----|-----|------|------|-----|------|
| **CSV**   | ✓   | ✓   | ✓    | ✓    | ✓   | ✓    |
| **XLS**   | ✓   | ✓   | ✓    | ✓    | ✓   | ✓    |
| **XLSX**  | ✓   | ✓   | ✓    | ✓    | ✓   | ✓    |
| **JSON**  | ✓   | ✓   | ✓    | ✓    | ✓   | ✓    |
| **XML**   | ✓   | ✓   | ✓    | ✓    | ✓   | ✓    |
| **YAML**  | ✓   | ✓   | ✓    | ✓    | ✓   | ✓    |

## Implementation Details

### Core Dependencies

```json
{
  "js-yaml": "^4.1.0",        // YAML parsing and generation
  "xml2js": "^0.6.2",         // XML parsing and generation
  "csv-parser": "^3.0.0",     // CSV parsing
  "csv-writer": "^1.6.0",     // CSV generation
  "xlsx": "^0.18.5"           // Excel file handling
}
```

### DataConverter Class

The `DataConverter` class provides a comprehensive interface for data format conversions:

```javascript
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
    }
}
```

### Key Methods

#### 1. Main Conversion Method
```javascript
async convert(inputPath, outputPath, targetFormat, options = {})
```
- Validates input and output formats
- Parses input file based on format
- Converts data to target format
- Returns conversion result with metadata

#### 2. Format Detection
```javascript
getFileFormat(filePath)
```
- Extracts file extension
- Handles special cases (e.g., `.yml` → `yaml`)
- Returns standardized format identifier

#### 3. Data Parsing Methods
```javascript
async parseCsv(filePath, options = {})
async parseExcel(filePath, options = {})
async parseJson(filePath, options = {})
async parseXml(filePath, options = {})
async parseYaml(filePath, options = {})
```

#### 4. Data Generation Methods
```javascript
async convertToCsv(data, outputPath, options = {})
async convertToExcel(data, outputPath, format, options = {})
async convertToJson(data, outputPath, options = {})
async convertToXml(data, outputPath, options = {})
async convertToYaml(data, outputPath, options = {})
```

## Data Type Handling

### Tabular Data
- **CSV**: Parsed as table with headers and rows
- **Excel**: Extracted as table with sheet information
- **JSON Array of Objects**: Converted to tabular format
- **XML**: Structured data converted to table
- **YAML Array**: Converted to tabular format

### Non-Tabular Data
- **JSON Objects**: Flattened for CSV/Excel output
- **JSON Arrays**: Converted to single column or flattened
- **XML**: Structured as hierarchical data
- **YAML**: Preserved structure in output formats

## Configuration Options

### CSV Options
```javascript
{
    separator: ',',           // Field delimiter
    quote: '"',              // Quote character
    escape: '"',             // Escape character
    headers: true,           // Include headers
    recordDelimiter: '\n'    // Record delimiter
}
```

### Excel Options
```javascript
{
    sheetName: 'Sheet1',     // Sheet name
    skipHeader: false,       // Skip header row
    defval: ''              // Default value for empty cells
}
```

### JSON Options
```javascript
{
    pretty: true,            // Pretty print JSON
    indent: 2               // Indentation spaces
}
```

### XML Options
```javascript
{
    rootName: 'data',        // Root element name
    pretty: true,           // Pretty print XML
    indent: '  ',           // Indentation
    headless: false         // Include XML declaration
}
```

### YAML Options
```javascript
{
    indent: 2,              // Indentation spaces
    lineWidth: 80,          // Line width
    noRefs: true,           // No references
    sortKeys: false         // Sort keys
}
```

## Error Handling

### Validation
- File format validation
- Data structure validation
- Conversion compatibility checks
- File existence and accessibility checks

### Error Types
- `Unsupported input format`
- `Unsupported output format`
- `Conversion not supported`
- `File parsing failed`
- `File writing failed`

### Error Recovery
- Graceful degradation for partial failures
- Detailed error messages for debugging
- Fallback options for unsupported conversions

## Performance Optimizations

### Memory Management
- Streaming for large CSV files
- Buffer management for XML/JSON parsing
- Efficient data structure handling

### Processing Speed
- Optimized parsing algorithms
- Minimal data copying
- Efficient format conversion

## Testing

### Test Coverage
- **Unit Tests**: Individual method testing
- **Integration Tests**: End-to-end conversion testing
- **Format Tests**: All supported format combinations
- **Error Tests**: Error handling and edge cases
- **Performance Tests**: Large file handling

### Test Categories
1. **Basic Functionality**
   - Supported formats validation
   - MIME type mapping
   - File format detection
   - Available output formats

2. **Conversion Tests**
   - CSV ↔ JSON / XML / YAML / Excel
   - JSON ↔ XML / CSV / YAML / Excel
   - XML ↔ CSV / JSON / YAML / Excel
   - YAML ↔ CSV / JSON / XML / Excel
   - Excel ↔ CSV / JSON / XML / YAML

3. **Data Validation**
   - File validation
   - Data preview functionality
   - Error handling

## Integration

### Server Integration
```javascript
// server.js
const DataConverter = require('./src/server/dataConverter');
const dataConverter = new DataConverter();

// Add to allowed MIME types
'text/csv', 'application/json', 'application/xml', 'text/yaml'

// Add to file category detection
if (mimeType.includes('csv') || mimeType.includes('json') || 
    mimeType.includes('xml') || mimeType.includes('yaml')) return 'data';

// Add to converter mapping
case 'data':
    return dataConverter;
```

### Frontend Integration
```javascript
// app.js
// Add data format MIME types
'text/csv', 'application/json', 'application/xml', 'text/yaml'

// Add default target formats
'text/csv': 'json',
'application/json': 'csv',
'application/xml': 'json',
'text/yaml': 'json'

// Add available formats
'text/csv': ['xls', 'xlsx', 'json', 'xml', 'yaml', 'yml'],
'application/json': ['csv', 'xls', 'xlsx', 'xml', 'yaml', 'yml'],
'application/xml': ['csv', 'xls', 'xlsx', 'json', 'yaml', 'yml'],
'text/yaml': ['csv', 'xls', 'xlsx', 'json', 'xml']
```

## Production Features

### Security
- Input validation and sanitization
- File size limits
- Path traversal protection
- MIME type verification

### Reliability
- Comprehensive error handling
- Data integrity checks
- Format validation
- Fallback mechanisms

### Scalability
- Efficient memory usage
- Streaming for large files
- Configurable processing options
- Modular architecture

### Monitoring
- Conversion success/failure tracking
- Performance metrics
- Error logging
- Usage statistics

## Usage Examples

### Basic Conversion
```javascript
const converter = new DataConverter();

// CSV to JSON
await converter.convert('data.csv', 'output.json', 'json');

// JSON to XML
await converter.convert('data.json', 'output.xml', 'xml', {
    rootName: 'records',
    pretty: true
});

// Excel to YAML
await converter.convert('data.xlsx', 'output.yaml', 'yaml', {
    indent: 2
});
```

### Advanced Options
```javascript
// CSV with custom delimiter
await converter.convert('data.csv', 'output.json', 'json', {
    separator: ';',
    quote: "'",
    headers: false
});

// XML with custom formatting
await converter.convert('data.xml', 'output.json', 'json', {
    explicitArray: false,
    mergeAttrs: true
});

// YAML with custom settings
await converter.convert('data.yaml', 'output.csv', 'csv', {
    schema: 'DEFAULT_SAFE_SCHEMA',
    sortKeys: true
});
```

## Future Enhancements

### Planned Features
- **Database Export**: Direct database to format conversion
- **API Integration**: REST API for data conversion
- **Batch Processing**: Multiple file conversion
- **Data Transformation**: Custom data mapping
- **Schema Validation**: JSON Schema and XML Schema support

### Performance Improvements
- **Parallel Processing**: Multi-threaded conversion
- **Caching**: Conversion result caching
- **Compression**: Output file compression
- **Streaming**: Real-time conversion streaming

## Conclusion

The Data Converter module provides a robust, production-ready solution for data format conversions. It supports all major data formats with comprehensive error handling, validation, and configuration options. The implementation follows industry best practices and is designed for scalability and reliability.

The module is fully integrated into the BLANCONVERTER system and provides users with seamless data format conversion capabilities through both the web interface and API endpoints. 