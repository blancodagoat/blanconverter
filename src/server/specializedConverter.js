/**
 * Specialized Converter
 * Handles specialized format conversions
 * Supports: DICOM ↔ PNG / JPG, GPX ↔ KML / CSV, SRT ↔ VTT / TXT
 */
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SpecializedConverter {
    constructor() {
        this.supportedFormats = {
            input: ['dicom', 'dcm', 'gpx', 'kml', 'srt', 'vtt', 'txt'],
            output: ['png', 'jpg', 'jpeg', 'gpx', 'kml', 'csv', 'srt', 'vtt', 'txt']
        };
        
        this.mimeTypes = {
            'dicom': 'application/dicom',
            'dcm': 'application/dicom',
            'gpx': 'application/gpx+xml',
            'kml': 'application/vnd.google-earth.kml+xml',
            'srt': 'application/x-subrip',
            'vtt': 'text/vtt',
            'txt': 'text/plain',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'csv': 'text/csv'
        };
        
        this.conversionMatrix = {
            // DICOM conversions
            'dicom': ['png', 'jpg', 'jpeg'],
            'dcm': ['png', 'jpg', 'jpeg'],
            // GPS conversions
            'gpx': ['kml', 'csv'],
            'kml': ['gpx', 'csv'],
            // Subtitle conversions
            'srt': ['vtt', 'txt'],
            'vtt': ['srt', 'txt'],
            'txt': ['srt', 'vtt']
        };
        
        this.requiredTools = {
            'dcmtk': 'DICOM Toolkit - for DICOM operations',
            'gdcm': 'Grassroots DICOM - for DICOM processing',
            'imagemagick': 'ImageMagick - for image conversions',
            'gpsbabel': 'GPSBabel - for GPS format conversions',
            'ffmpeg': 'FFmpeg - for subtitle conversions'
        };
    }

    getSupportedFormats() {
        return this.supportedFormats;
    }

    getMimeType(format) {
        return this.mimeTypes[format.toLowerCase()] || 'application/octet-stream';
    }

    getAvailableOutputFormats(inputFormat) {
        return this.conversionMatrix[inputFormat.toLowerCase()] || [];
    }

    async convert(inputPath, outputPath, targetFormat, options = {}) {
        try {
            const inputFormat = this.getFileFormat(inputPath);
            const outputFormat = targetFormat.toLowerCase();
            
            console.log(`Converting specialized file from ${inputFormat} to ${outputFormat}`);
            
            if (!this.supportedFormats.input.includes(inputFormat)) {
                throw new Error(`Unsupported input format: ${inputFormat}`);
            }
            
            if (!this.supportedFormats.output.includes(outputFormat)) {
                throw new Error(`Unsupported output format: ${outputFormat}`);
            }
            
            const availableFormats = this.getAvailableOutputFormats(inputFormat);
            if (!availableFormats.includes(outputFormat)) {
                throw new Error(`Conversion from ${inputFormat} to ${outputFormat} is not supported`);
            }

            // Validate input file
            await this.validateFile(inputPath, inputFormat);
            
            // Perform conversion
            const result = await this.performConversion(inputPath, outputPath, inputFormat, outputFormat, options);
            
            // Validate output file
            await this.validateFile(outputPath, outputFormat);
            
            // Get file stats
            const stats = await fs.stat(outputPath);
            
            return {
                success: true,
                message: `Successfully converted from ${inputFormat} to ${outputFormat}`,
                filename: path.basename(outputPath),
                size: stats.size,
                mimeType: this.getMimeType(outputFormat),
                metadata: await this.getMetadata(outputPath, outputFormat)
            };
            
        } catch (error) {
            console.error('Specialized conversion error:', error);
            throw new Error(`Specialized conversion failed: ${error.message}`);
        }
    }

    async performConversion(inputPath, outputPath, inputFormat, outputFormat, options = {}) {
        try {
            // Handle same format (copy operation)
            if (inputFormat === outputFormat) {
                await fs.copyFile(inputPath, outputPath);
                return;
            }

            // DICOM conversions
            if (inputFormat === 'dicom' || inputFormat === 'dcm') {
                return await this.convertDicomToImage(inputPath, outputPath, outputFormat, options);
            }

            // GPS conversions
            if (inputFormat === 'gpx') {
                if (outputFormat === 'kml') {
                    return await this.convertGpxToKml(inputPath, outputPath, options);
                } else if (outputFormat === 'csv') {
                    return await this.convertGpxToCsv(inputPath, outputPath, options);
                }
            }

            if (inputFormat === 'kml') {
                if (outputFormat === 'gpx') {
                    return await this.convertKmlToGpx(inputPath, outputPath, options);
                } else if (outputFormat === 'csv') {
                    return await this.convertKmlToCsv(inputPath, outputPath, options);
                }
            }

            // Subtitle conversions
            if (inputFormat === 'srt') {
                if (outputFormat === 'vtt') {
                    return await this.convertSrtToVtt(inputPath, outputPath, options);
                } else if (outputFormat === 'txt') {
                    return await this.convertSrtToTxt(inputPath, outputPath, options);
                }
            }

            if (inputFormat === 'vtt') {
                if (outputFormat === 'srt') {
                    return await this.convertVttToSrt(inputPath, outputPath, options);
                } else if (outputFormat === 'txt') {
                    return await this.convertVttToTxt(inputPath, outputPath, options);
                }
            }

            if (inputFormat === 'txt') {
                if (outputFormat === 'srt') {
                    return await this.convertTxtToSrt(inputPath, outputPath, options);
                } else if (outputFormat === 'vtt') {
                    return await this.convertTxtToVtt(inputPath, outputPath, options);
                }
            }

            throw new Error(`Conversion from ${inputFormat} to ${outputFormat} not implemented`);
            
        } catch (error) {
            throw new Error(`Conversion failed: ${error.message}`);
        }
    }

    // DICOM Conversions
    async convertDicomToImage(inputPath, outputPath, outputFormat, options = {}) {
        try {
            // Try dcmtk first (most reliable)
            try {
                const command = `dcmj2pnm "${inputPath}" "${outputPath}"`;
                const { stdout, stderr } = await execAsync(command);
                
                if (stderr && !stderr.includes('dcmj2pnm')) {
                    throw new Error(`dcmtk conversion failed: ${stderr}`);
                }
                
                console.log('DICOM to image conversion completed (dcmtk)');
                return { success: true };
                
            } catch (dcmtkError) {
                // Fallback to GDCM
                try {
                    const command = `gdcmconv "${inputPath}" "${outputPath}"`;
                    const { stdout, stderr } = await execAsync(command);
                    
                    if (stderr && !stderr.includes('gdcmconv')) {
                        throw new Error(`GDCM conversion failed: ${stderr}`);
                    }
                    
                    console.log('DICOM to image conversion completed (GDCM)');
                    return { success: true };
                    
                } catch (gdcmError) {
                    // Fallback to ImageMagick
                    const command = `convert "${inputPath}" "${outputPath}"`;
                    const { stdout, stderr } = await execAsync(command);
                    
                    if (stderr && !stderr.includes('convert')) {
                        throw new Error(`ImageMagick conversion failed: ${stderr}`);
                    }
                    
                    console.log('DICOM to image conversion completed (ImageMagick)');
                    return { success: true };
                }
            }
            
        } catch (error) {
            throw new Error(`DICOM to image conversion failed: ${error.message}`);
        }
    }

    // GPS Conversions
    async convertGpxToKml(inputPath, outputPath, options = {}) {
        try {
            // Use GPSBabel for conversion
            const command = `gpsbabel -i gpx -f "${inputPath}" -o kml -F "${outputPath}"`;
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('gpsbabel')) {
                throw new Error(`GPSBabel conversion failed: ${stderr}`);
            }
            
            console.log('GPX to KML conversion completed');
            return { success: true };
            
        } catch (error) {
            // Fallback to manual conversion
            return await this.convertGpxToKmlManual(inputPath, outputPath, options);
        }
    }

    async convertGpxToKmlManual(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const kmlContent = this.parseGpxToKml(content, options);
            await fs.writeFile(outputPath, kmlContent, 'utf8');
            
            console.log('GPX to KML conversion completed (manual)');
            return { success: true };
            
        } catch (error) {
            throw new Error(`Manual GPX to KML conversion failed: ${error.message}`);
        }
    }

    async convertGpxToCsv(inputPath, outputPath, options = {}) {
        try {
            // Use GPSBabel for conversion
            const command = `gpsbabel -i gpx -f "${inputPath}" -o csv -F "${outputPath}"`;
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('gpsbabel')) {
                throw new Error(`GPSBabel conversion failed: ${stderr}`);
            }
            
            console.log('GPX to CSV conversion completed');
            return { success: true };
            
        } catch (error) {
            // Fallback to manual conversion
            return await this.convertGpxToCsvManual(inputPath, outputPath, options);
        }
    }

    async convertGpxToCsvManual(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const csvContent = this.parseGpxToCsv(content, options);
            await fs.writeFile(outputPath, csvContent, 'utf8');
            
            console.log('GPX to CSV conversion completed (manual)');
            return { success: true };
            
        } catch (error) {
            throw new Error(`Manual GPX to CSV conversion failed: ${error.message}`);
        }
    }

    async convertKmlToGpx(inputPath, outputPath, options = {}) {
        try {
            // Use GPSBabel for conversion
            const command = `gpsbabel -i kml -f "${inputPath}" -o gpx -F "${outputPath}"`;
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('gpsbabel')) {
                throw new Error(`GPSBabel conversion failed: ${stderr}`);
            }
            
            console.log('KML to GPX conversion completed');
            return { success: true };
            
        } catch (error) {
            // Fallback to manual conversion
            return await this.convertKmlToGpxManual(inputPath, outputPath, options);
        }
    }

    async convertKmlToGpxManual(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const gpxContent = this.parseKmlToGpx(content, options);
            await fs.writeFile(outputPath, gpxContent, 'utf8');
            
            console.log('KML to GPX conversion completed (manual)');
            return { success: true };
            
        } catch (error) {
            throw new Error(`Manual KML to GPX conversion failed: ${error.message}`);
        }
    }

    async convertKmlToCsv(inputPath, outputPath, options = {}) {
        try {
            // Use GPSBabel for conversion
            const command = `gpsbabel -i kml -f "${inputPath}" -o csv -F "${outputPath}"`;
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('gpsbabel')) {
                throw new Error(`GPSBabel conversion failed: ${stderr}`);
            }
            
            console.log('KML to CSV conversion completed');
            return { success: true };
            
        } catch (error) {
            // Fallback to manual conversion
            return await this.convertKmlToCsvManual(inputPath, outputPath, options);
        }
    }

    async convertKmlToCsvManual(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const csvContent = this.parseKmlToCsv(content, options);
            await fs.writeFile(outputPath, csvContent, 'utf8');
            
            console.log('KML to CSV conversion completed (manual)');
            return { success: true };
            
        } catch (error) {
            throw new Error(`Manual KML to CSV conversion failed: ${error.message}`);
        }
    }

    // Subtitle Conversions
    async convertSrtToVtt(inputPath, outputPath, options = {}) {
        try {
            // Use FFmpeg for conversion
            const command = `ffmpeg -i "${inputPath}" "${outputPath}"`;
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('ffmpeg')) {
                throw new Error(`FFmpeg conversion failed: ${stderr}`);
            }
            
            console.log('SRT to VTT conversion completed');
            return { success: true };
            
        } catch (error) {
            // Fallback to manual conversion
            return await this.convertSrtToVttManual(inputPath, outputPath, options);
        }
    }

    async convertSrtToVttManual(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const vttContent = this.parseSrtToVtt(content, options);
            await fs.writeFile(outputPath, vttContent, 'utf8');
            
            console.log('SRT to VTT conversion completed (manual)');
            return { success: true };
            
        } catch (error) {
            throw new Error(`Manual SRT to VTT conversion failed: ${error.message}`);
        }
    }

    async convertSrtToTxt(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const txtContent = this.parseSrtToTxt(content, options);
            await fs.writeFile(outputPath, txtContent, 'utf8');
            
            console.log('SRT to TXT conversion completed');
            return { success: true };
            
        } catch (error) {
            throw new Error(`SRT to TXT conversion failed: ${error.message}`);
        }
    }

    async convertVttToSrt(inputPath, outputPath, options = {}) {
        try {
            // Use FFmpeg for conversion
            const command = `ffmpeg -i "${inputPath}" "${outputPath}"`;
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr && !stderr.includes('ffmpeg')) {
                throw new Error(`FFmpeg conversion failed: ${stderr}`);
            }
            
            console.log('VTT to SRT conversion completed');
            return { success: true };
            
        } catch (error) {
            // Fallback to manual conversion
            return await this.convertVttToSrtManual(inputPath, outputPath, options);
        }
    }

    async convertVttToSrtManual(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const srtContent = this.parseVttToSrt(content, options);
            await fs.writeFile(outputPath, srtContent, 'utf8');
            
            console.log('VTT to SRT conversion completed (manual)');
            return { success: true };
            
        } catch (error) {
            throw new Error(`Manual VTT to SRT conversion failed: ${error.message}`);
        }
    }

    async convertVttToTxt(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const txtContent = this.parseVttToTxt(content, options);
            await fs.writeFile(outputPath, txtContent, 'utf8');
            
            console.log('VTT to TXT conversion completed');
            return { success: true };
            
        } catch (error) {
            throw new Error(`VTT to TXT conversion failed: ${error.message}`);
        }
    }

    async convertTxtToSrt(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const srtContent = this.parseTxtToSrt(content, options);
            await fs.writeFile(outputPath, srtContent, 'utf8');
            
            console.log('TXT to SRT conversion completed');
            return { success: true };
            
        } catch (error) {
            throw new Error(`TXT to SRT conversion failed: ${error.message}`);
        }
    }

    async convertTxtToVtt(inputPath, outputPath, options = {}) {
        try {
            const content = await fs.readFile(inputPath, 'utf8');
            const vttContent = this.parseTxtToVtt(content, options);
            await fs.writeFile(outputPath, vttContent, 'utf8');
            
            console.log('TXT to VTT conversion completed');
            return { success: true };
            
        } catch (error) {
            throw new Error(`TXT to VTT conversion failed: ${error.message}`);
        }
    }

    // Parsing Methods
    parseGpxToKml(gpxContent, options = {}) {
        try {
            // Simple GPX to KML conversion
            const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Converted from GPX</name>
    <Placemark>
      <name>Track</name>
      <LineString>
        <coordinates>`;
            
            const kmlFooter = `
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
            
            // Extract coordinates from GPX (simplified)
            const coordMatches = gpxContent.match(/<trkpt lat="([^"]+)" lon="([^"]+)">/g);
            let coordinates = '';
            
            if (coordMatches) {
                coordinates = coordMatches.map(match => {
                    const latMatch = match.match(/lat="([^"]+)"/);
                    const lonMatch = match.match(/lon="([^"]+)"/);
                    if (latMatch && lonMatch) {
                        return `${lonMatch[1]},${latMatch[1]},0`;
                    }
                    return '';
                }).filter(coord => coord !== '').join(' ');
            }
            
            return kmlHeader + coordinates + kmlFooter;
            
        } catch (error) {
            throw new Error(`GPX to KML parsing failed: ${error.message}`);
        }
    }

    parseGpxToCsv(gpxContent, options = {}) {
        try {
            const csvHeader = 'Latitude,Longitude,Elevation,Time\n';
            
            // Extract track points from GPX
            const trkptMatches = gpxContent.match(/<trkpt lat="([^"]+)" lon="([^"]+)">([\s\S]*?)<\/trkpt>/g);
            let csvRows = [];
            
            if (trkptMatches) {
                csvRows = trkptMatches.map(match => {
                    const latMatch = match.match(/lat="([^"]+)"/);
                    const lonMatch = match.match(/lon="([^"]+)"/);
                    const eleMatch = match.match(/<ele>([^<]+)<\/ele>/);
                    const timeMatch = match.match(/<time>([^<]+)<\/time>/);
                    
                    const lat = latMatch ? latMatch[1] : '';
                    const lon = lonMatch ? lonMatch[1] : '';
                    const ele = eleMatch ? eleMatch[1] : '';
                    const time = timeMatch ? timeMatch[1] : '';
                    
                    return `${lat},${lon},${ele},${time}`;
                });
            }
            
            return csvHeader + csvRows.join('\n');
            
        } catch (error) {
            throw new Error(`GPX to CSV parsing failed: ${error.message}`);
        }
    }

    parseKmlToGpx(kmlContent, options = {}) {
        try {
            const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="File Converter" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Converted from KML</name>
    <trkseg>`;
            
            const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;
            
            // Extract coordinates from KML (simplified)
            const coordMatches = kmlContent.match(/<coordinates>([^<]+)<\/coordinates>/);
            let trkpts = '';
            
            if (coordMatches) {
                const coords = coordMatches[1].trim().split(/\s+/);
                trkpts = coords.map(coord => {
                    const [lon, lat, ele] = coord.split(',');
                    return `      <trkpt lat="${lat}" lon="${lon}">
        <ele>${ele || '0'}</ele>
      </trkpt>`;
                }).join('\n');
            }
            
            return gpxHeader + '\n' + trkpts + '\n' + gpxFooter;
            
        } catch (error) {
            throw new Error(`KML to GPX parsing failed: ${error.message}`);
        }
    }

    parseKmlToCsv(kmlContent, options = {}) {
        try {
            const csvHeader = 'Latitude,Longitude,Elevation,Name,Description\n';
            
            // Extract placemarks from KML
            const placemarkMatches = kmlContent.match(/<Placemark>([\s\S]*?)<\/Placemark>/g);
            let csvRows = [];
            
            if (placemarkMatches) {
                csvRows = placemarkMatches.map(match => {
                    const nameMatch = match.match(/<name>([^<]+)<\/name>/);
                    const descMatch = match.match(/<description>([^<]+)<\/description>/);
                    const coordMatch = match.match(/<coordinates>([^<]+)<\/coordinates>/);
                    
                    const name = nameMatch ? nameMatch[1] : '';
                    const desc = descMatch ? descMatch[1] : '';
                    let lat = '', lon = '', ele = '';
                    
                    if (coordMatch) {
                        const coords = coordMatch[1].trim().split(',');
                        lon = coords[0] || '';
                        lat = coords[1] || '';
                        ele = coords[2] || '';
                    }
                    
                    return `${lat},${lon},${ele},"${name}","${desc}"`;
                });
            }
            
            return csvHeader + csvRows.join('\n');
            
        } catch (error) {
            throw new Error(`KML to CSV parsing failed: ${error.message}`);
        }
    }

    parseSrtToVtt(srtContent, options = {}) {
        try {
            const vttHeader = 'WEBVTT\n\n';
            
            // Parse SRT content
            const srtBlocks = srtContent.trim().split(/\n\s*\n/);
            const vttBlocks = srtBlocks.map(block => {
                const lines = block.split('\n').filter(line => line.trim());
                if (lines.length < 3) return '';
                
                // Skip subtitle number
                const timeLine = lines[1];
                const textLines = lines.slice(2);
                
                // Convert SRT time format to VTT
                const vttTime = timeLine.replace(',', '.');
                
                return `${vttTime}\n${textLines.join('\n')}`;
            }).filter(block => block !== '');
            
            return vttHeader + vttBlocks.join('\n\n');
            
        } catch (error) {
            throw new Error(`SRT to VTT parsing failed: ${error.message}`);
        }
    }

    parseSrtToTxt(srtContent, options = {}) {
        try {
            // Extract only text from SRT, removing timestamps and numbers
            const srtBlocks = srtContent.trim().split(/\n\s*\n/);
            const textLines = srtBlocks.map(block => {
                const lines = block.split('\n').filter(line => line.trim());
                if (lines.length < 3) return '';
                
                // Skip subtitle number and timestamp, keep only text
                return lines.slice(2).join(' ');
            }).filter(line => line !== '');
            
            return textLines.join('\n');
            
        } catch (error) {
            throw new Error(`SRT to TXT parsing failed: ${error.message}`);
        }
    }

    parseVttToSrt(vttContent, options = {}) {
        try {
            // Remove WEBVTT header
            const content = vttContent.replace(/^WEBVTT\s*\n/, '');
            
            // Parse VTT content
            const vttBlocks = content.trim().split(/\n\s*\n/);
            const srtBlocks = vttBlocks.map((block, index) => {
                const lines = block.split('\n').filter(line => line.trim());
                if (lines.length < 2) return '';
                
                const timeLine = lines[0];
                const textLines = lines.slice(1);
                
                // Convert VTT time format to SRT
                const srtTime = timeLine.replace('.', ',');
                
                return `${index + 1}\n${srtTime}\n${textLines.join('\n')}`;
            }).filter(block => block !== '');
            
            return srtBlocks.join('\n\n');
            
        } catch (error) {
            throw new Error(`VTT to SRT parsing failed: ${error.message}`);
        }
    }

    parseVttToTxt(vttContent, options = {}) {
        try {
            // Remove WEBVTT header
            const content = vttContent.replace(/^WEBVTT\s*\n/, '');
            
            // Extract only text from VTT, removing timestamps
            const vttBlocks = content.trim().split(/\n\s*\n/);
            const textLines = vttBlocks.map(block => {
                const lines = block.split('\n').filter(line => line.trim());
                if (lines.length < 2) return '';
                
                // Skip timestamp, keep only text
                return lines.slice(1).join(' ');
            }).filter(line => line !== '');
            
            return textLines.join('\n');
            
        } catch (error) {
            throw new Error(`VTT to TXT parsing failed: ${error.message}`);
        }
    }

    parseTxtToSrt(txtContent, options = {}) {
        try {
            const lines = txtContent.split('\n').filter(line => line.trim());
            const subtitleDuration = options.subtitleDuration || 3000; // 3 seconds default
            const srtBlocks = [];
            
            lines.forEach((line, index) => {
                if (line.trim()) {
                    const startTime = index * subtitleDuration;
                    const endTime = (index + 1) * subtitleDuration;
                    
                    const startTimeStr = this.formatTime(startTime);
                    const endTimeStr = this.formatTime(endTime);
                    
                    srtBlocks.push(`${index + 1}\n${startTimeStr} --> ${endTimeStr}\n${line.trim()}`);
                }
            });
            
            return srtBlocks.join('\n\n');
            
        } catch (error) {
            throw new Error(`TXT to SRT parsing failed: ${error.message}`);
        }
    }

    parseTxtToVtt(txtContent, options = {}) {
        try {
            const lines = txtContent.split('\n').filter(line => line.trim());
            const subtitleDuration = options.subtitleDuration || 3000; // 3 seconds default
            const vttBlocks = [];
            
            lines.forEach((line, index) => {
                if (line.trim()) {
                    const startTime = index * subtitleDuration;
                    const endTime = (index + 1) * subtitleDuration;
                    
                    const startTimeStr = this.formatTime(startTime, true);
                    const endTimeStr = this.formatTime(endTime, true);
                    
                    vttBlocks.push(`${startTimeStr} --> ${endTimeStr}\n${line.trim()}`);
                }
            });
            
            return 'WEBVTT\n\n' + vttBlocks.join('\n\n');
            
        } catch (error) {
            throw new Error(`TXT to VTT parsing failed: ${error.message}`);
        }
    }

    formatTime(milliseconds, isVtt = false) {
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        const ms = milliseconds % 1000;
        
        const separator = isVtt ? '.' : ',';
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}${separator}${ms.toString().padStart(3, '0')}`;
    }

    async validateFile(filePath, format) {
        try {
            const stats = await fs.stat(filePath);
            
            if (stats.size === 0) {
                throw new Error('File is empty');
            }
            
            // Check minimum size for different formats
            const minSizes = {
                'dicom': 128,
                'dcm': 128,
                'gpx': 64,
                'kml': 64,
                'srt': 16,
                'vtt': 16,
                'txt': 1
            };
            
            if (stats.size < minSizes[format]) {
                throw new Error(`File too small for ${format} format`);
            }
            
            return true;
            
        } catch (error) {
            throw new Error(`File validation failed: ${error.message}`);
        }
    }

    async getMetadata(filePath, format) {
        try {
            const stats = await fs.stat(filePath);
            
            const metadata = {
                format: format,
                size: stats.size,
                sizeFormatted: this.formatFileSize(stats.size),
                created: stats.birthtime,
                modified: stats.mtime,
                mimeType: this.getMimeType(format)
            };
            
            // Get additional format-specific metadata
            if (format === 'dicom' || format === 'dcm') {
                metadata.dicomInfo = await this.getDicomMetadata(filePath);
            } else if (format === 'gpx') {
                metadata.gpxInfo = await this.getGpxMetadata(filePath);
            } else if (format === 'kml') {
                metadata.kmlInfo = await this.getKmlMetadata(filePath);
            } else if (format === 'srt' || format === 'vtt') {
                metadata.subtitleInfo = await this.getSubtitleMetadata(filePath, format);
            }
            
            return metadata;
            
        } catch (error) {
            console.warn(`Could not get metadata: ${error.message}`);
            return {
                format: format,
                size: 0,
                sizeFormatted: 'Unknown',
                error: error.message
            };
        }
    }

    async getDicomMetadata(filePath) {
        try {
            const { stdout } = await execAsync(`dcmdump "${filePath}"`);
            
            const metadata = {
                patientName: '',
                studyDate: '',
                modality: '',
                manufacturer: '',
                imageSize: '',
                bitsAllocated: ''
            };
            
            const lines = stdout.split('\n');
            for (const line of lines) {
                if (line.includes('PatientName')) {
                    metadata.patientName = line.split('[')[1]?.split(']')[0] || '';
                } else if (line.includes('StudyDate')) {
                    metadata.studyDate = line.split('[')[1]?.split(']')[0] || '';
                } else if (line.includes('Modality')) {
                    metadata.modality = line.split('[')[1]?.split(']')[0] || '';
                } else if (line.includes('Manufacturer')) {
                    metadata.manufacturer = line.split('[')[1]?.split(']')[0] || '';
                } else if (line.includes('Rows')) {
                    metadata.imageSize = line.split('[')[1]?.split(']')[0] || '';
                } else if (line.includes('BitsAllocated')) {
                    metadata.bitsAllocated = line.split('[')[1]?.split(']')[0] || '';
                }
            }
            
            return metadata;
            
        } catch (error) {
            console.warn(`Could not get DICOM metadata: ${error.message}`);
            return {};
        }
    }

    async getGpxMetadata(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            const metadata = {
                trackCount: 0,
                waypointCount: 0,
                routeCount: 0,
                creator: '',
                version: ''
            };
            
            metadata.trackCount = (content.match(/<trk>/g) || []).length;
            metadata.waypointCount = (content.match(/<wpt/g) || []).length;
            metadata.routeCount = (content.match(/<rte>/g) || []).length;
            
            const creatorMatch = content.match(/creator="([^"]+)"/);
            if (creatorMatch) {
                metadata.creator = creatorMatch[1];
            }
            
            const versionMatch = content.match(/version="([^"]+)"/);
            if (versionMatch) {
                metadata.version = versionMatch[1];
            }
            
            return metadata;
            
        } catch (error) {
            console.warn(`Could not get GPX metadata: ${error.message}`);
            return {};
        }
    }

    async getKmlMetadata(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            const metadata = {
                placemarkCount: 0,
                folderCount: 0,
                documentCount: 0,
                name: '',
                description: ''
            };
            
            metadata.placemarkCount = (content.match(/<Placemark>/g) || []).length;
            metadata.folderCount = (content.match(/<Folder>/g) || []).length;
            metadata.documentCount = (content.match(/<Document>/g) || []).length;
            
            const nameMatch = content.match(/<name>([^<]+)<\/name>/);
            if (nameMatch) {
                metadata.name = nameMatch[1];
            }
            
            const descMatch = content.match(/<description>([^<]+)<\/description>/);
            if (descMatch) {
                metadata.description = descMatch[1];
            }
            
            return metadata;
            
        } catch (error) {
            console.warn(`Could not get KML metadata: ${error.message}`);
            return {};
        }
    }

    async getSubtitleMetadata(filePath, format) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            const metadata = {
                subtitleCount: 0,
                totalDuration: 0,
                averageDuration: 0,
                language: '',
                encoding: ''
            };
            
            if (format === 'srt') {
                const subtitleBlocks = content.trim().split(/\n\s*\n/);
                metadata.subtitleCount = subtitleBlocks.length;
                
                // Calculate duration (simplified)
                const timeMatches = content.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g);
                if (timeMatches) {
                    let totalMs = 0;
                    timeMatches.forEach(match => {
                        const times = match.split(' --> ');
                        const startMs = this.parseTimeToMs(times[0]);
                        const endMs = this.parseTimeToMs(times[1]);
                        totalMs += (endMs - startMs);
                    });
                    metadata.totalDuration = totalMs;
                    metadata.averageDuration = totalMs / timeMatches.length;
                }
            } else if (format === 'vtt') {
                const subtitleBlocks = content.replace(/^WEBVTT\s*\n/, '').trim().split(/\n\s*\n/);
                metadata.subtitleCount = subtitleBlocks.length;
                
                // Calculate duration (simplified)
                const timeMatches = content.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/g);
                if (timeMatches) {
                    let totalMs = 0;
                    timeMatches.forEach(match => {
                        const times = match.split(' --> ');
                        const startMs = this.parseTimeToMs(times[0], true);
                        const endMs = this.parseTimeToMs(times[1], true);
                        totalMs += (endMs - startMs);
                    });
                    metadata.totalDuration = totalMs;
                    metadata.averageDuration = totalMs / timeMatches.length;
                }
            }
            
            return metadata;
            
        } catch (error) {
            console.warn(`Could not get subtitle metadata: ${error.message}`);
            return {};
        }
    }

    parseTimeToMs(timeStr, isVtt = false) {
        const separator = isVtt ? '.' : ',';
        const parts = timeStr.split(separator);
        const timeParts = parts[0].split(':');
        
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const seconds = parseInt(timeParts[2]);
        const ms = parseInt(parts[1]);
        
        return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + ms;
    }

    getFileFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase().substring(1);
        
        // Handle special cases
        if (ext === 'dcm') return 'dcm';
        if (ext === 'dicom') return 'dicom';
        if (ext === 'gpx') return 'gpx';
        if (ext === 'kml') return 'kml';
        if (ext === 'srt') return 'srt';
        if (ext === 'vtt') return 'vtt';
        if (ext === 'txt') return 'txt';
        
        // Try to detect from file content
        return this.detectFormatFromContent(filePath);
    }

    async detectFormatFromContent(filePath) {
        try {
            const { stdout } = await execAsync(`file "${filePath}"`);
            
            if (stdout.includes('DICOM') || stdout.includes('Medical')) {
                return 'dicom';
            } else if (stdout.includes('XML') && stdout.includes('gpx')) {
                return 'gpx';
            } else if (stdout.includes('XML') && stdout.includes('kml')) {
                return 'kml';
            } else if (stdout.includes('SubRip') || stdout.includes('SRT')) {
                return 'srt';
            } else if (stdout.includes('WebVTT') || stdout.includes('VTT')) {
                return 'vtt';
            } else if (stdout.includes('text')) {
                return 'txt';
            } else {
                return 'txt'; // Default fallback
            }
            
        } catch (error) {
            console.warn(`Could not detect format from content: ${error.message}`);
            return 'txt'; // Default fallback
        }
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    async checkRequiredTools() {
        const tools = ['file'];
        const missingTools = [];
        
        for (const tool of tools) {
            try {
                await execAsync(`which ${tool}`);
            } catch (error) {
                missingTools.push(tool);
            }
        }
        
        // Check specialized tools
        try {
            await execAsync('which dcmj2pnm');
        } catch (error) {
            try {
                await execAsync('which gdcmconv');
            } catch (error) {
                try {
                    await execAsync('which convert');
                } catch (error) {
                    missingTools.push('dcmtk, GDCM, or ImageMagick');
                }
            }
        }
        
        try {
            await execAsync('which gpsbabel');
        } catch (error) {
            missingTools.push('gpsbabel');
        }
        
        try {
            await execAsync('which ffmpeg');
        } catch (error) {
            missingTools.push('ffmpeg');
        }
        
        return {
            available: missingTools.length === 0,
            missing: missingTools
        };
    }

    async cleanupDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);
                
                if (stats.isDirectory()) {
                    await this.cleanupDirectory(filePath);
                    await fs.rmdir(filePath);
                } else {
                    await fs.unlink(filePath);
                }
            }
        } catch (error) {
            console.warn(`Cleanup warning: ${error.message}`);
        }
    }
}

module.exports = SpecializedConverter; 