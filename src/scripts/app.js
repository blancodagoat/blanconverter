/**
 * File Converter - Main Application JavaScript
 * Handles file upload, conversion, and UI interactions
 */

class FileConverter {
    constructor() {
        this.files = [];
        this.conversions = [];
        this.isConverting = false;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeDragAndDrop();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            uploadBtn: document.getElementById('uploadBtn'),
            fileList: document.getElementById('fileList'),
            fileItems: document.getElementById('fileItems'),
            clearAllBtn: document.getElementById('clearAllBtn'),
            convertAllBtn: document.getElementById('convertAllBtn'),
            progressSection: document.getElementById('progressSection'),
            progressList: document.getElementById('progressList'),
            resultsSection: document.getElementById('resultsSection'),
            resultsList: document.getElementById('resultsList'),
            batchSettingsBtn: document.getElementById('batchSettingsBtn'),
            batchSettingsPanel: document.getElementById('batchSettingsPanel'),
            downloadAllBtn: document.getElementById('downloadAllBtn')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // File upload events
        this.elements.uploadBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // File management events
        this.elements.clearAllBtn.addEventListener('click', () => {
            this.clearAllFiles();
        });

        this.elements.convertAllBtn.addEventListener('click', () => {
            this.convertAllFiles();
        });

        // Download all as ZIP
        if (this.elements.downloadAllBtn) {
            this.elements.downloadAllBtn.addEventListener('click', () => {
                this.downloadAllAsZip();
            });
        }

        // Batch settings events
        if (this.elements.batchSettingsBtn) {
            this.elements.batchSettingsBtn.addEventListener('click', () => {
                this.toggleBatchSettings();
            });
        }

        // Batch settings form events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.batch-apply-btn')) {
                this.applyBatchSettings();
            }
        });

        // Navigation events
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.smoothScrollTo(targetId);
            });
        });

        // Mobile navigation
        const navToggle = document.querySelector('.nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
    }

    /**
     * Initialize drag and drop functionality
     */
    initializeDragAndDrop() {
        const uploadArea = this.elements.uploadArea;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        });
    }

    /**
     * Handle file selection from input or drag & drop
     */
    handleFileSelection(files) {
        const validFiles = Array.from(files).filter(file => {
            return this.isValidFile(file);
        });

        if (validFiles.length === 0) {
            this.showNotification('No valid files selected', 'error');
            return;
        }

        validFiles.forEach(file => {
            this.addFile(file);
        });

        this.updateFileList();
        this.showNotification(`${validFiles.length} file(s) added successfully`, 'success');
    }

    /**
     * Check if file is valid for conversion
     */
    isValidFile(file) {
        const maxSize = 100 * 1024 * 1024; // 100MB
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif', 'image/x-raw', 'image/x-canon-cr2', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-adobe-dng',
            // Documents
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/rtf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.oasis.opendocument.text',
            // Ebooks
            'application/epub+zip', 'application/x-mobipocket-ebook', 'application/vnd.amazon.ebook',
            // Archives
            'application/zip', 'application/vnd.rar', 'application/x-tar', 'application/gzip', 'application/x-bzip2', 'application/x-7z-compressed',
            // Fonts
            'font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/vnd.ms-fontobject', 'image/svg+xml',
            // CAD/3D
            'application/sla', 'text/plain', 'application/step', 'application/x-3ds', 'application/acad', 'application/dxf', 'model/vnd.collada+xml', 'model/vrml', 'model/x3d+xml',
            // Vector/Graphics
            'application/postscript', 'application/x-coreldraw',
            // Data formats
            'text/csv', 'application/json', 'application/xml', 'text/yaml',
            // Disk Images
            'application/x-iso9660-image', 'application/x-apple-diskimage',
            // Specialized formats
            'application/dicom', 'application/gpx+xml', 'application/vnd.google-earth.kml+xml',
            'application/x-subrip', 'text/vtt',
            // Audio
            'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/mp4', 'audio/x-ms-wma', 'audio/aiff',
            // Video
            'video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm', 'video/x-flv', 'video/x-ms-wmv', 'video/3gpp'
        ];

        if (file.size > maxSize) {
            this.showNotification(`File ${file.name} is too large (max 100MB)`, 'error');
            return false;
        }

        if (!allowedTypes.includes(file.type) && !file.name.includes('.')) {
            this.showNotification(`File ${file.name} is not a supported format`, 'error');
            return false;
        }

        return true;
    }

    /**
     * Add file to the conversion queue
     */
    addFile(file) {
        const fileId = this.generateId();
        const fileInfo = {
            id: fileId,
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            extension: this.getFileExtension(file.name),
            targetFormat: this.getDefaultTargetFormat(file.type),
            status: 'pending'
        };

        this.files.push(fileInfo);
    }

    /**
     * Get file extension from filename
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    /**
     * Get default target format based on file type
     */
    getDefaultTargetFormat(fileType) {
        const formatMap = {
            // Images
            'image/jpeg': 'png',
            'image/png': 'jpg',
            'image/gif': 'png',
            'image/webp': 'jpg',
            'image/bmp': 'png',
            'image/tiff': 'jpg',
            'image/svg+xml': 'png',
            'image/heic': 'jpg',
            'image/heif': 'jpg',
            'image/x-raw': 'jpg',
            'image/x-canon-cr2': 'jpg',
            'image/x-nikon-nef': 'jpg',
            'image/x-sony-arw': 'jpg',
            'image/x-adobe-dng': 'jpg',
            // Documents
            'application/pdf': 'docx',
            'application/msword': 'pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'pdf',
            'text/plain': 'pdf',
            'application/rtf': 'docx',
            'application/vnd.ms-excel': 'pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'pdf',
            'text/csv': 'json',
            'application/vnd.ms-powerpoint': 'pdf',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pdf',
            'application/vnd.oasis.opendocument.text': 'docx',
            // Data formats
            'application/json': 'csv',
            'application/xml': 'json',
            'text/yaml': 'json',
            // Disk Images
            'application/x-iso9660-image': 'bin',
            'application/x-apple-diskimage': 'iso',
            // Specialized formats
            'application/dicom': 'png',
            'application/gpx+xml': 'kml',
            'application/vnd.google-earth.kml+xml': 'gpx',
            'application/x-subrip': 'vtt',
            'text/vtt': 'srt',
            // Ebooks
            'application/epub+zip': 'mobi',
            'application/x-mobipocket-ebook': 'epub',
            'application/vnd.amazon.ebook': 'epub',
            // Archives
            'application/zip': 'rar',
            'application/vnd.rar': 'zip',
            'application/x-tar': 'zip',
            'application/gzip': 'zip',
            'application/x-bzip2': 'zip',
            'application/x-7z-compressed': 'zip',
            // Fonts
            'font/ttf': 'otf',
            'font/otf': 'ttf',
            'font/woff': 'woff2',
            'font/woff2': 'woff',
            'application/vnd.ms-fontobject': 'ttf',
            'image/svg+xml': 'ttf',
            // CAD/3D
            'application/sla': 'obj',
            'text/plain': 'stl',
            'application/step': 'stl',
            'application/x-3ds': 'obj',
            'application/acad': 'dxf',
            'application/dxf': 'dwg',
            'model/vnd.collada+xml': 'obj',
            'model/vrml': 'obj',
            'model/x3d+xml': 'obj',
            // Vector/Graphics
            'application/postscript': 'svg',
            'application/x-coreldraw': 'svg',
            // Audio
            'audio/mpeg': 'wav',
            'audio/wav': 'mp3',
            'audio/flac': 'mp3',
            'audio/aac': 'mp3',
            'audio/ogg': 'mp3',
            'audio/mp4': 'wav',
            'audio/x-ms-wma': 'mp3',
            'audio/aiff': 'mp3',
            // Video
            'video/mp4': 'avi',
            'video/avi': 'mp4',
            'video/quicktime': 'mp4',
            'video/x-matroska': 'mp4',
            'video/webm': 'gif',
            'video/x-flv': 'mp4',
            'video/x-ms-wmv': 'mp4',
            'video/3gpp': 'mp4'
        };

        return formatMap[fileType] || 'pdf';
    }

    /**
     * Get available target formats for a file type
     */
    getAvailableFormats(fileType) {
        const formatMap = {
            // Images
            'image/jpeg': ['png', 'gif', 'webp', 'bmp', 'tiff'],
            'image/png': ['jpg', 'gif', 'webp', 'bmp', 'tiff'],
            'image/gif': ['png', 'jpg', 'webp'],
            'image/webp': ['png', 'jpg', 'gif'],
            'image/bmp': ['png', 'jpg', 'gif', 'webp'],
            'image/tiff': ['png', 'jpg', 'gif', 'webp'],
            'image/svg+xml': ['png', 'jpg', 'gif', 'webp', 'pdf'],
            'image/heic': ['jpg', 'png', 'webp', 'gif'],
            'image/heif': ['jpg', 'png', 'webp', 'gif'],
            'image/x-raw': ['jpg', 'png', 'tiff', 'webp'],
            'image/x-canon-cr2': ['jpg', 'png', 'tiff', 'webp'],
            'image/x-nikon-nef': ['jpg', 'png', 'tiff', 'webp'],
            'image/x-sony-arw': ['jpg', 'png', 'tiff', 'webp'],
            'image/x-adobe-dng': ['jpg', 'png', 'tiff', 'webp'],
            // Documents
            'application/pdf': ['docx', 'txt', 'rtf', 'jpg', 'png'],
            'application/msword': ['pdf', 'txt', 'rtf', 'docx'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['pdf', 'txt', 'rtf', 'odt'],
            'text/plain': ['pdf', 'docx', 'rtf'],
            'application/rtf': ['pdf', 'docx', 'txt'],
            'application/vnd.ms-excel': ['pdf', 'csv', 'xlsx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['pdf', 'csv'],
            'text/csv': ['xls', 'xlsx', 'json', 'xml', 'yaml', 'yml'],
            'application/vnd.ms-powerpoint': ['pdf', 'docx', 'jpg', 'png'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pdf', 'docx', 'jpg', 'png'],
            'application/vnd.oasis.opendocument.text': ['docx', 'pdf', 'txt'],
            // Data formats
            'application/json': ['csv', 'xls', 'xlsx', 'xml', 'yaml', 'yml'],
            'application/xml': ['csv', 'xls', 'xlsx', 'json', 'yaml', 'yml'],
            'text/yaml': ['csv', 'xls', 'xlsx', 'json', 'xml'],
            // Disk Images
            'application/x-iso9660-image': ['bin', 'img', 'dmg'],
            'application/x-apple-diskimage': ['iso', 'bin', 'img'],
            // Specialized formats
            'application/dicom': ['png', 'jpg', 'jpeg'],
            'application/gpx+xml': ['kml', 'csv'],
            'application/vnd.google-earth.kml+xml': ['gpx', 'csv'],
            'application/x-subrip': ['vtt', 'txt'],
            'text/vtt': ['srt', 'txt'],
            // Ebooks
            'application/epub+zip': ['mobi', 'azw3', 'pdf', 'docx'],
            'application/x-mobipocket-ebook': ['epub', 'azw3', 'pdf', 'docx'],
            'application/vnd.amazon.ebook': ['epub', 'mobi', 'pdf', 'docx'],
            // Archives
            'application/zip': ['rar', 'tar', 'tar.gz', 'tar.bz2', '7z'],
            'application/vnd.rar': ['zip', 'tar', 'tar.gz', 'tar.bz2', '7z'],
            'application/x-tar': ['zip', 'rar', 'tar.gz', 'tar.bz2', '7z'],
            'application/gzip': ['zip', 'rar', 'tar', 'tar.bz2', '7z'],
            'application/x-bzip2': ['zip', 'rar', 'tar', 'tar.gz', '7z'],
            'application/x-7z-compressed': ['zip', 'rar', 'tar', 'tar.gz', 'tar.bz2'],
            // Fonts
            'font/ttf': ['otf', 'woff', 'woff2', 'eot', 'svg'],
            'font/otf': ['ttf', 'woff', 'woff2', 'eot', 'svg'],
            'font/woff': ['ttf', 'otf', 'woff2', 'eot', 'svg'],
            'font/woff2': ['ttf', 'otf', 'woff', 'eot', 'svg'],
            'application/vnd.ms-fontobject': ['ttf', 'otf', 'woff', 'woff2', 'svg'],
            'image/svg+xml': ['ttf', 'otf', 'woff', 'woff2', 'eot'],
            // CAD/3D
            'application/sla': ['obj', 'step', 'stp', '3ds', 'dae', 'fbx', 'ply', 'wrl', 'x3d'],
            'text/plain': ['stl', 'obj', 'step', 'stp', '3ds', 'dae', 'fbx', 'ply', 'wrl', 'x3d'],
            'application/step': ['stl', 'obj', '3ds', 'dae', 'fbx', 'ply', 'wrl', 'x3d'],
            'application/x-3ds': ['stl', 'obj', 'step', 'stp', 'dae', 'fbx', 'ply', 'wrl', 'x3d'],
            'application/acad': ['dxf', 'pdf', 'svg'],
            'application/dxf': ['dwg', 'pdf', 'svg'],
            'model/vnd.collada+xml': ['stl', 'obj', 'step', 'stp', '3ds', 'fbx', 'ply', 'wrl', 'x3d'],
            'model/vrml': ['stl', 'obj', 'step', 'stp', '3ds', 'dae', 'fbx', 'ply', 'x3d'],
            'model/x3d+xml': ['stl', 'obj', 'step', 'stp', '3ds', 'dae', 'fbx', 'ply', 'wrl'],
            // Vector/Graphics
            'application/postscript': ['svg', 'pdf', 'png', 'jpg', 'eps'],
            'application/x-coreldraw': ['svg', 'png', 'pdf', 'eps'],
            // Audio
            'audio/mpeg': ['wav', 'flac', 'aac', 'ogg', 'm4a'],
            'audio/wav': ['mp3', 'flac', 'aac', 'ogg', 'm4a'],
            'audio/flac': ['mp3', 'wav', 'aac', 'ogg', 'm4a'],
            'audio/aac': ['mp3', 'wav', 'flac', 'ogg', 'm4a'],
            'audio/ogg': ['mp3', 'wav', 'flac', 'aac', 'm4a'],
            'audio/mp4': ['wav', 'mp3', 'flac', 'aac', 'ogg'],
            'audio/x-ms-wma': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            'audio/aiff': ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            // Video
            'video/mp4': ['avi', 'mov', 'mkv', 'webm', 'gif', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            'video/avi': ['mp4', 'mov', 'mkv', 'webm', 'gif', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            'video/quicktime': ['mp4', 'avi', 'mkv', 'webm', 'gif', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            'video/x-matroska': ['mp4', 'avi', 'mov', 'webm', 'gif', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            'video/webm': ['mp4', 'avi', 'mov', 'mkv', 'gif', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            'video/x-flv': ['mp4', 'avi', 'mov', 'gif', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            'video/x-ms-wmv': ['mp4', 'avi', 'mov', 'gif', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'],
            'video/3gpp': ['mp4', 'avi', 'mov', 'gif', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']
        };

        return formatMap[fileType] || ['pdf'];
    }

    /**
     * Update the file list display
     */
    updateFileList() {
        if (this.files.length === 0) {
            this.elements.fileList.style.display = 'none';
            return;
        }

        this.elements.fileList.style.display = 'block';
        this.elements.fileItems.innerHTML = '';

        this.files.forEach(fileInfo => {
            const fileElement = this.createFileElement(fileInfo);
            this.elements.fileItems.appendChild(fileElement);
        });
    }

    /**
     * Create file element for display
     */
    createFileElement(fileInfo) {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.dataset.fileId = fileInfo.id;

        const availableFormats = this.getAvailableFormats(fileInfo.type);
        const formatOptions = availableFormats.map(format => 
            `<option value="${format}" ${format === fileInfo.targetFormat ? 'selected' : ''}>${format.toUpperCase()}</option>`
        ).join('');

        // Add quality options for video and image conversions
        const isVideo = fileInfo.type.startsWith('video/');
        const isImage = fileInfo.type.startsWith('image/');
        const isAudio = fileInfo.type.startsWith('audio/');
        
        let qualityOptions = '';
        if (isVideo || isImage || isAudio) {
            qualityOptions = `
                <div class="file-quality-options">
                    <label>Quality:</label>
                    <select class="file-quality-select" data-file-id="${fileInfo.id}">
                        <option value="high" ${(fileInfo.quality || 'high') === 'high' ? 'selected' : ''}>High</option>
                        <option value="medium" ${(fileInfo.quality || 'high') === 'medium' ? 'selected' : ''}>Medium</option>
                        <option value="low" ${(fileInfo.quality || 'high') === 'low' ? 'selected' : ''}>Low</option>
                    </select>
                </div>
            `;
        }

        // Add GIF-specific options for video to GIF conversion
        let gifOptions = '';
        if (isVideo && fileInfo.targetFormat === 'gif') {
            gifOptions = `
                <div class="file-gif-options">
                    <label>FPS:</label>
                    <select class="file-gif-fps-select" data-file-id="${fileInfo.id}">
                        <option value="5" ${(fileInfo.gifFps || 10) === 5 ? 'selected' : ''}>5 FPS</option>
                        <option value="10" ${(fileInfo.gifFps || 10) === 10 ? 'selected' : ''}>10 FPS</option>
                        <option value="15" ${(fileInfo.gifFps || 10) === 15 ? 'selected' : ''}>15 FPS</option>
                        <option value="20" ${(fileInfo.gifFps || 10) === 20 ? 'selected' : ''}>20 FPS</option>
                        <option value="30" ${(fileInfo.gifFps || 10) === 30 ? 'selected' : ''}>30 FPS</option>
                    </select>
                    <label>Scale:</label>
                    <select class="file-gif-scale-select" data-file-id="${fileInfo.id}">
                        <option value="240" ${(fileInfo.gifScale || 320) === 240 ? 'selected' : ''}>240px</option>
                        <option value="320" ${(fileInfo.gifScale || 320) === 320 ? 'selected' : ''}>320px</option>
                        <option value="480" ${(fileInfo.gifScale || 320) === 480 ? 'selected' : ''}>480px</option>
                        <option value="640" ${(fileInfo.gifScale || 320) === 640 ? 'selected' : ''}>640px</option>
                    </select>
                </div>
            `;
        }

        fileElement.innerHTML = `
            <div class="file-icon">
                <i class="${this.getFileIcon(fileInfo.type)}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${fileInfo.name}</div>
                <div class="file-size">${this.formatFileSize(fileInfo.size)}</div>
            </div>
            <div class="file-controls">
                <select class="file-format-select" data-file-id="${fileInfo.id}">
                    ${formatOptions}
                </select>
                ${qualityOptions}
                ${gifOptions}
            </div>
            <button class="file-remove" data-file-id="${fileInfo.id}">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Bind events
        const formatSelect = fileElement.querySelector('.file-format-select');
        formatSelect.addEventListener('change', (e) => {
            this.updateFileTargetFormat(fileInfo.id, e.target.value);
            // Re-render to show/hide GIF options
            this.updateFileList();
        });

        const qualitySelect = fileElement.querySelector('.file-quality-select');
        if (qualitySelect) {
            qualitySelect.addEventListener('change', (e) => {
                this.updateFileQuality(fileInfo.id, e.target.value);
            });
        }

        const gifFpsSelect = fileElement.querySelector('.file-gif-fps-select');
        if (gifFpsSelect) {
            gifFpsSelect.addEventListener('change', (e) => {
                this.updateFileGifFps(fileInfo.id, parseInt(e.target.value));
            });
        }

        const gifScaleSelect = fileElement.querySelector('.file-gif-scale-select');
        if (gifScaleSelect) {
            gifScaleSelect.addEventListener('change', (e) => {
                this.updateFileGifScale(fileInfo.id, parseInt(e.target.value));
            });
        }

        const removeBtn = fileElement.querySelector('.file-remove');
        removeBtn.addEventListener('click', () => {
            this.removeFile(fileInfo.id);
        });

        return fileElement;
    }

    /**
     * Get appropriate icon for file type
     */
    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return 'fas fa-image';
        if (fileType.startsWith('video/')) return 'fas fa-video';
        if (fileType.startsWith('audio/')) return 'fas fa-music';
        if (fileType.includes('pdf')) return 'fas fa-file-pdf';
        if (fileType.includes('word') || fileType.includes('document')) return 'fas fa-file-word';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fas fa-file-excel';
        if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'fas fa-file-powerpoint';
        if (fileType.includes('text') || fileType.includes('plain')) return 'fas fa-file-alt';
        return 'fas fa-file';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Update target format for a file
     */
    updateFileTargetFormat(fileId, targetFormat) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            file.targetFormat = targetFormat;
        }
    }

    /**
     * Update quality for a file
     */
    updateFileQuality(fileId, quality) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            file.quality = quality;
        }
    }

    /**
     * Update GIF FPS for a file
     */
    updateFileGifFps(fileId, fps) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            file.gifFps = fps;
        }
    }

    /**
     * Update GIF Scale for a file
     */
    updateFileGifScale(fileId, scale) {
        const file = this.files.find(f => f.id === fileId);
        if (file) {
            file.gifScale = scale;
        }
    }

    /**
     * Remove file from the list
     */
    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateFileList();
    }

    /**
     * Clear all files
     */
    clearAllFiles() {
        this.files = [];
        this.updateFileList();
        this.hideProgressSection();
        this.hideResultsSection();
    }

    /**
     * Convert all files
     */
    async convertAllFiles() {
        if (this.files.length === 0) {
            this.showNotification('No files to convert', 'warning');
            return;
        }

        if (this.isConverting) {
            this.showNotification('Conversion already in progress', 'warning');
            return;
        }

        this.isConverting = true;
        this.conversions = []; // Reset conversions array
        this.showProgressSection();
        this.hideResultsSection();

        // Initialize progress for each file
        this.files.forEach(file => {
            file.status = 'converting';
            file.progress = 0;
        });

        this.updateProgressDisplay();

        try {
            // Convert files sequentially to avoid overwhelming the server
            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                await this.convertFile(file);
                
                // Add successful conversion to conversions array
                if (file.status === 'completed' && file.convertedFile) {
                    this.conversions.push({
                        originalFile: file,
                        convertedFile: file.convertedFile
                    });
                }
            }

            this.showResultsSection();
            this.showNotification('All files converted successfully!', 'success');
            showSupportAfterConversion(); // Show support modal after successful conversion
        } catch (error) {
            console.error('Conversion error:', error);
            this.showNotification('Some files failed to convert', 'error');
        } finally {
            this.isConverting = false;
            this.hideProgressSection();
        }
    }

    /**
     * Convert a single file
     */
    async convertFile(fileInfo) {
        const formData = new FormData();
        formData.append('file', fileInfo.file);
        formData.append('targetFormat', fileInfo.targetFormat);

        // Add quality options for video, image, and audio conversions
        if (fileInfo.quality) {
            formData.append('quality', fileInfo.quality);
        }

        // Add GIF-specific options for video to GIF conversion
        if (fileInfo.targetFormat === 'gif' && fileInfo.type.startsWith('video/')) {
            if (fileInfo.gifFps) {
                formData.append('gifFps', fileInfo.gifFps);
            }
            if (fileInfo.gifScale) {
                formData.append('gifScale', fileInfo.gifScale);
            }
        }

        try {
            // Simulate conversion progress
            await this.simulateProgress(fileInfo);

            // Real API call to server
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Conversion failed: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Conversion failed');
            }

            // Create converted file object
            const convertedFile = {
                name: result.convertedFile.filename,
                size: result.convertedFile.size,
                url: `/converted/${result.convertedFile.filename}`,
                type: result.convertedFile.mimeType
            };
            
            fileInfo.status = 'completed';
            fileInfo.progress = 100;
            fileInfo.convertedFile = convertedFile;

            this.updateProgressDisplay();
            
            // Add a small delay to show progress
            await this.delay(500);

        } catch (error) {
            fileInfo.status = 'error';
            fileInfo.error = error.message;
            this.updateProgressDisplay();
            throw error;
        }
    }

    /**
     * Simulate conversion progress
     */
    async simulateProgress(fileInfo) {
        const steps = [10, 25, 50, 75, 90, 100];
        
        for (const progress of steps) {
            fileInfo.progress = progress;
            this.updateProgressDisplay();
            await this.delay(300 + Math.random() * 500);
        }
    }

    /**
     * Simulate file conversion (for demo purposes)
     */
    simulateConversion(fileInfo) {
        const originalName = fileInfo.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const newName = `${nameWithoutExt}.${fileInfo.targetFormat}`;
        
        return {
            name: newName,
            size: Math.floor(fileInfo.size * (0.8 + Math.random() * 0.4)), // Simulate size change
            url: `#${newName}`, // In real implementation, this would be a download URL
            type: this.getMimeType(fileInfo.targetFormat)
        };
    }

    /**
     * Get MIME type for file extension
     */
    getMimeType(extension) {
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain',
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'mp4': 'video/mp4',
            'avi': 'video/avi'
        };
        return mimeTypes[extension] || 'application/octet-stream';
    }

    /**
     * Show progress section
     */
    showProgressSection() {
        this.elements.progressSection.style.display = 'block';
        this.elements.progressSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Hide progress section
     */
    hideProgressSection() {
        this.elements.progressSection.style.display = 'none';
    }

    /**
     * Update progress display
     */
    updateProgressDisplay() {
        this.elements.progressList.innerHTML = '';

        this.files.forEach(fileInfo => {
            const progressElement = this.createProgressElement(fileInfo);
            this.elements.progressList.appendChild(progressElement);
        });
    }

    /**
     * Create progress element
     */
    createProgressElement(fileInfo) {
        const progressElement = document.createElement('div');
        progressElement.className = 'progress-item';

        const statusText = fileInfo.status === 'completed' ? 'Completed' : 
                          fileInfo.status === 'error' ? 'Failed' : 
                          `Converting... ${fileInfo.progress}%`;

        progressElement.innerHTML = `
            <div class="progress-info">
                <div class="progress-name">${fileInfo.name}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${fileInfo.progress}%"></div>
                </div>
                <div class="progress-status">
                    <span class="progress-percentage">${statusText}</span>
                </div>
            </div>
        `;

        return progressElement;
    }

    /**
     * Show results section
     */
    showResultsSection() {
        this.elements.resultsSection.style.display = 'block';
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
        this.updateResultsDisplay();
    }

    /**
     * Hide results section
     */
    hideResultsSection() {
        this.elements.resultsSection.style.display = 'none';
    }

    /**
     * Update results display
     */
    updateResultsDisplay() {
        this.elements.resultsList.innerHTML = '';

        this.files.filter(f => f.status === 'completed').forEach(fileInfo => {
            const resultElement = this.createResultElement(fileInfo);
            this.elements.resultsList.appendChild(resultElement);
        });
    }

    /**
     * Create result element
     */
    createResultElement(fileInfo) {
        const resultElement = document.createElement('div');
        resultElement.className = 'result-item';

        resultElement.innerHTML = `
            <div class="result-info">
                <div class="result-name">${fileInfo.convertedFile.name}</div>
                <div class="result-size">${this.formatFileSize(fileInfo.convertedFile.size)}</div>
            </div>
            <button class="result-download" data-file-id="${fileInfo.id}">
                <i class="fas fa-download"></i>
                Download
            </button>
        `;

        // Bind download event
        const downloadBtn = resultElement.querySelector('.result-download');
        downloadBtn.addEventListener('click', () => {
            this.downloadFile(fileInfo);
        });

        return resultElement;
    }

    /**
     * Download converted file
     */
    downloadFile(fileInfo) {
        // In a real implementation, this would trigger the actual download
        // For demo purposes, we'll create a temporary download link
        
        const link = document.createElement('a');
        link.href = fileInfo.convertedFile.url;
        link.download = fileInfo.convertedFile.name;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification(`Downloading ${fileInfo.convertedFile.name}`, 'success');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 400px;
        `;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    /**
     * Remove notification
     */
    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Get notification color
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#6366f1'
        };
        return colors[type] || colors.info;
    }

    /**
     * Smooth scroll to element
     */
    smoothScrollTo(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Utility function for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Toggle batch settings panel
     */
    toggleBatchSettings() {
        const panel = this.elements.batchSettingsPanel;
        if (panel) {
            panel.classList.toggle('show');
            this.updateBatchSettingsOptions();
        }
    }

    /**
     * Update batch settings options based on selected files
     */
    updateBatchSettingsOptions() {
        const panel = this.elements.batchSettingsPanel;
        if (!panel) return;

        // Group files by type
        const fileGroups = this.groupFilesByType();
        
        // Clear existing options
        const container = panel.querySelector('.batch-options-container');
        if (container) {
            container.innerHTML = '';
        }

        // Add options for each file type
        Object.keys(fileGroups).forEach(fileType => {
            const files = fileGroups[fileType];
            if (files.length > 1) {
                this.addBatchOptionForType(container, fileType, files);
            }
        });
    }

    /**
     * Group files by type
     */
    groupFilesByType() {
        const groups = {};
        this.files.forEach(file => {
            const type = this.getFileCategory(file.type);
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(file);
        });
        return groups;
    }

    /**
     * Get file category from MIME type
     */
    getFileCategory(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
        return 'other';
    }

    /**
     * Add batch option for a specific file type
     */
    addBatchOptionForType(container, fileType, files) {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'batch-option-group';
        
        const isVideo = fileType === 'video';
        const isImage = fileType === 'image';
        const isAudio = fileType === 'audio';
        
        let qualityOptions = '';
        if (isVideo || isImage || isAudio) {
            qualityOptions = `
                <div class="batch-quality-option">
                    <label>Quality for ${files.length} ${fileType} files:</label>
                    <select class="batch-quality-select" data-file-type="${fileType}">
                        <option value="">Keep current</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            `;
        }

        let gifOptions = '';
        if (isVideo) {
            gifOptions = `
                <div class="batch-gif-options">
                    <label>GIF Settings (if converting to GIF):</label>
                    <select class="batch-gif-fps-select" data-file-type="${fileType}">
                        <option value="">Keep current</option>
                        <option value="5">5 FPS</option>
                        <option value="10">10 FPS</option>
                        <option value="15">15 FPS</option>
                        <option value="20">20 FPS</option>
                        <option value="30">30 FPS</option>
                    </select>
                    <select class="batch-gif-scale-select" data-file-type="${fileType}">
                        <option value="">Keep current</option>
                        <option value="240">240px</option>
                        <option value="320">320px</option>
                        <option value="480">480px</option>
                        <option value="640">640px</option>
                    </select>
                </div>
            `;
        }

        optionDiv.innerHTML = `
            <h4>${fileType.charAt(0).toUpperCase() + fileType.slice(1)} Files (${files.length})</h4>
            ${qualityOptions}
            ${gifOptions}
            <button class="batch-apply-btn" data-file-type="${fileType}">
                Apply to ${files.length} ${fileType} files
            </button>
        `;

        container.appendChild(optionDiv);
    }

    /**
     * Apply batch settings to files
     */
    applyBatchSettings() {
        const fileType = event.target.dataset.fileType;
        const qualitySelect = document.querySelector(`.batch-quality-select[data-file-type="${fileType}"]`);
        const gifFpsSelect = document.querySelector(`.batch-gif-fps-select[data-file-type="${fileType}"]`);
        const gifScaleSelect = document.querySelector(`.batch-gif-scale-select[data-file-type="${fileType}"]`);

        const quality = qualitySelect ? qualitySelect.value : '';
        const gifFps = gifFpsSelect ? gifFpsSelect.value : '';
        const gifScale = gifScaleSelect ? gifScaleSelect.value : '';

        // Apply settings to all files of this type
        this.files.forEach(file => {
            if (this.getFileCategory(file.type) === fileType) {
                if (quality) file.quality = quality;
                if (gifFps) file.gifFps = parseInt(gifFps);
                if (gifScale) file.gifScale = parseInt(gifScale);
            }
        });

        // Update the file list display
        this.updateFileList();

        // Show confirmation
        this.showNotification(`Applied settings to ${this.files.filter(f => this.getFileCategory(f.type) === fileType).length} ${fileType} files`, 'success');
    }

    /**
     * Download all converted files as ZIP
     */
    async downloadAllAsZip() {
        if (!this.conversions || this.conversions.length === 0) {
            this.showNotification('No converted files to download', 'warning');
            return;
        }

        try {
            // Create a ZIP file using JSZip
            const JSZip = window.JSZip;
            if (!JSZip) {
                // Fallback to individual downloads
                this.conversions.forEach(conversion => {
                    this.downloadFile(conversion);
                });
                return;
            }

            const zip = new JSZip();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

            // Add each converted file to the ZIP
            for (const conversion of this.conversions) {
                if (conversion.convertedFile && conversion.convertedFile.url) {
                    try {
                        const response = await fetch(conversion.convertedFile.url);
                        const blob = await response.blob();
                        zip.file(conversion.convertedFile.name, blob);
                    } catch (error) {
                        console.warn(`Could not add ${conversion.convertedFile.name} to ZIP:`, error);
                    }
                }
            }

            // Generate and download the ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(zipBlob);
            
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `converted-files-${timestamp}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(zipUrl);
            
            this.showNotification('ZIP download started', 'success');
        } catch (error) {
            console.error('ZIP creation failed:', error);
            this.showNotification('ZIP creation failed, downloading files individually', 'warning');
            
            // Fallback to individual downloads
            this.conversions.forEach(conversion => {
                this.downloadFile(conversion);
            });
        }
    }
}

// Font Awesome fallback detection
function checkFontAwesome() {
    const testIcon = document.createElement('i');
    testIcon.className = 'fas fa-heart';
    testIcon.style.position = 'absolute';
    testIcon.style.left = '-9999px';
    document.body.appendChild(testIcon);
    
    const computedStyle = window.getComputedStyle(testIcon, ':before');
    const content = computedStyle.getPropertyValue('content');
    
    document.body.removeChild(testIcon);
    
    // If Font Awesome is not loaded (content is 'none' or empty), add fallback class
    if (!content || content === 'none' || content === 'normal') {
        document.body.classList.add('fa-fallback');
        console.log('Font Awesome not detected, using fallback icons');
    }
}

// Check Font Awesome on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Font Awesome to load
    setTimeout(checkFontAwesome, 1000);
    
    // Check again after 3 seconds as a backup
    setTimeout(checkFontAwesome, 3000);
});

// Support modal functionality
const supportModal = document.getElementById('supportModal');
const supportBtn = document.getElementById('supportBtn');
const supportModalClose = document.getElementById('supportModalClose');
const supportModalSkip = document.getElementById('supportModalSkip');
const supportModalThanks = document.getElementById('supportModalThanks');
const buyPizzaBtn = document.getElementById('buyPizzaBtn');
const shareBtn = document.getElementById('shareBtn');

// Show support modal
function showSupportModal() {
    supportModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Hide support modal
function hideSupportModal() {
    supportModal.classList.remove('show');
    document.body.style.overflow = '';
}

// Support button click
supportBtn.addEventListener('click', showSupportModal);

// Close modal
supportModalClose.addEventListener('click', hideSupportModal);
supportModalSkip.addEventListener('click', hideSupportModal);
supportModalThanks.addEventListener('click', hideSupportModal);

// Close modal when clicking outside
supportModal.addEventListener('click', (e) => {
    if (e.target === supportModal) {
        hideSupportModal();
    }
});

// Buy pizza button
buyPizzaBtn.addEventListener('click', () => {
    // Trigger the Buy Me a Coffee script
    const bmcButton = document.querySelector('[data-name="bmc-button"]');
    if (bmcButton) {
        bmcButton.click();
    }
    hideSupportModal();
});

// Share button
shareBtn.addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: 'BlanConverter - Free Online File Converter',
            text: 'Check out this amazing free file converter! Support for 50+ formats.',
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Link copied to clipboard!');
        });
    }
    hideSupportModal();
});

// Show support modal after successful conversion
function showSupportAfterConversion() {
    // Wait a bit for the results to be visible
    setTimeout(() => {
        showSupportModal();
    }, 2000);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FileConverter();
});

// Add some CSS for notifications
const notificationStyles = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.25rem;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    .nav-menu.active {
        display: flex !important;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .nav-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .nav-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .nav-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet); 