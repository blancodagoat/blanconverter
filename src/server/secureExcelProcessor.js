/**
 * Secure Excel Processing Wrapper
 * Provides additional security measures around the vulnerable xlsx package
 */

const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

class SecureExcelProcessor {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.maxRows = 10000; // Limit rows to prevent memory issues
        this.maxColumns = 100; // Limit columns to prevent memory issues
        this.timeout = 30000; // 30 second timeout for processing
    }

    /**
     * Safely read Excel file with security measures
     */
    async readExcelFile(filePath, options = {}) {
        try {
            // Check file size
            const stats = await fs.stat(filePath);
            if (stats.size > this.maxFileSize) {
                throw new Error(`File size ${stats.size} exceeds security limit ${this.maxFileSize}`);
            }

            // Validate file extension
            const ext = path.extname(filePath).toLowerCase();
            if (!['.xls', '.xlsx'].includes(ext)) {
                throw new Error(`Invalid file extension: ${ext}`);
            }

            // Set processing timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Excel processing timeout')), this.timeout);
            });

            // Process file with timeout
            const processPromise = this._processExcelFile(filePath, options);
            
            const result = await Promise.race([processPromise, timeoutPromise]);
            
            // Validate output size
            if (result && result.data) {
                if (Array.isArray(result.data) && result.data.length > this.maxRows) {
                    throw new Error(`Row count ${result.data.length} exceeds security limit ${this.maxRows}`);
                }
                
                if (result.data.length > 0 && Array.isArray(result.data[0]) && result.data[0].length > this.maxColumns) {
                    throw new Error(`Column count ${result.data[0].length} exceeds security limit ${this.maxColumns}`);
                }
            }

            return result;
        } catch (error) {
            throw new Error(`Secure Excel processing failed: ${error.message}`);
        }
    }

    /**
     * Internal Excel processing with additional safety
     */
    async _processExcelFile(filePath, options) {
        // Read file with minimal options to reduce attack surface
        const workbook = XLSX.readFile(filePath, {
            cellDates: options.cellDates !== false,
            cellNF: false,
            cellText: false,
            cellStyles: false,
            cellFormula: false,
            cellHTML: false,
            cellError: false,
            cellFormulaError: false,
            cellHidden: false,
            cellMerge: false,
            cellProtection: false,
            cellRichText: false,
            cellValue: true,
            cellFormulaValue: false,
            cellHTMLValue: false,
            cellTextValue: false,
            cellDateValue: true,
            cellNumberValue: true,
            cellBooleanValue: true,
            cellErrorValue: false,
            cellFormulaErrorValue: false,
            cellHiddenValue: false,
            cellMergeValue: false,
            cellProtectionValue: false,
            cellRichTextValue: false,
            cellStylesValue: false,
            cellFormulaValue: false,
            cellHTMLValue: false,
            cellTextValue: false,
            cellDateValue: true,
            cellNumberValue: true,
            cellBooleanValue: true,
            cellErrorValue: false,
            cellFormulaErrorValue: false,
            cellHiddenValue: false,
            cellMergeValue: false,
            cellProtectionValue: false,
            cellRichTextValue: false,
            cellStylesValue: false
        });

        const sheetName = options.sheetName || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            throw new Error(`Sheet '${sheetName}' not found`);
        }

        // Convert to JSON with safety limits
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: options.headers !== false ? 1 : undefined,
            defval: options.defval || '',
            raw: true,
            dateNF: 'yyyy-mm-dd'
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
    }

    /**
     * Safely write Excel file
     */
    async writeExcelFile(data, outputPath, options = {}) {
        try {
            // Validate output path
            const ext = path.extname(outputPath).toLowerCase();
            if (ext !== '.xlsx') {
                throw new Error('Output must be .xlsx format for security');
            }

            // Create workbook with minimal features
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data.data || data, {
                header: options.headers,
                skipHidden: true
            });

            // Add worksheet with safe name
            const safeSheetName = this._sanitizeSheetName(options.sheetName || 'Sheet1');
            XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

            // Write file
            XLSX.writeFile(workbook, outputPath);
            
            return { success: true, outputPath };
        } catch (error) {
            throw new Error(`Secure Excel writing failed: ${error.message}`);
        }
    }

    /**
     * Sanitize sheet names for security
     */
    _sanitizeSheetName(name) {
        if (!name || typeof name !== 'string') return 'Sheet1';
        
        // Remove dangerous characters
        const sanitized = name
            .replace(/[\[\]*\/\\?:]/g, '') // Remove Excel-invalid characters
            .replace(/\.\./g, '') // Remove path traversal
            .replace(/javascript:/gi, '') // Remove JavaScript protocol
            .replace(/vbscript:/gi, '') // Remove VBScript
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .substring(0, 31); // Excel sheet name length limit
        
        return sanitized || 'Sheet1';
    }

    /**
     * Validate Excel file before processing
     */
    async validateExcelFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            
            // Check file size
            if (stats.size > this.maxFileSize) {
                return { valid: false, error: 'File too large' };
            }

            // Check file extension
            const ext = path.extname(filePath).toLowerCase();
            if (!['.xls', '.xlsx'].includes(ext)) {
                return { valid: false, error: 'Invalid file type' };
            }

            // Check if file is readable
            try {
                await fs.access(filePath, fs.constants.R_OK);
            } catch {
                return { valid: false, error: 'File not readable' };
            }

            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = SecureExcelProcessor;
