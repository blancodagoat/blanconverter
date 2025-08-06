# File Converter - Free Online File Conversion Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/yourusername/file-converter/workflows/CI/badge.svg)](https://github.com/yourusername/file-converter/actions)
[![Deploy](https://github.com/yourusername/file-converter/workflows/Deploy/badge.svg)](https://github.com/yourusername/file-converter/actions)
[![npm version](https://badge.fury.io/js/file-converter.svg)](https://badge.fury.io/js/file-converter)
[![GitHub stars](https://img.shields.io/github/stars/yourusername/file-converter.svg)](https://github.com/yourusername/file-converter/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/file-converter.svg)](https://github.com/yourusername/file-converter/network)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/file-converter.svg)](https://github.com/yourusername/file-converter/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/file-converter.svg)](https://github.com/yourusername/file-converter/pulls)
[![GitHub contributors](https://img.shields.io/github/contributors/yourusername/file-converter.svg)](https://github.com/yourusername/file-converter/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/file-converter.svg)](https://github.com/yourusername/file-converter/commits/main)
[![GitHub release](https://img.shields.io/github/release/yourusername/file-converter.svg)](https://github.com/yourusername/file-converter/releases)

A modern, free-to-use file conversion website that supports multiple file formats including images, documents, audio, and video files.

## 📋 Table of Contents

- [Features](#-features)
- [Supported Conversions](#-supported-conversions)
- [Quick Start](#-quick-start)
- [Technology Stack](#️-technology-stack)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Known Issues](#-known-issues)
- [Support](#-support)
- [License](#-license)

## 🌟 Features

- **Multiple Format Support**: Convert between various file formats
- **Drag & Drop Interface**: Easy file upload with visual feedback
- **Real-time Progress**: Track conversion progress with live updates
- **Batch Processing**: Convert multiple files at once
- **No Registration Required**: Completely free and anonymous
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Secure**: Files are processed locally and automatically deleted
- **Open Source**: Full source code available on GitHub
- **Community Driven**: Built with contributions from the open source community
- **Continuous Integration**: Automated testing and deployment
- **Security Focused**: Regular security audits and updates

## 📁 Supported Conversions

### Images ✅
- **Any ↔ JPG / PNG / WEBP / GIF** - High-quality image conversion with optimization
- **SVG ↔ PNG / JPG / PDF** - Vector to raster and PDF conversion
- **HEIC ↔ JPG / PNG** - ⚠️ Temporarily disabled (native dependency issues)
- **RAW ↔ JPG / TIFF** - ⚠️ Temporarily disabled (native dependency issues)
- Resize and compress images
- Maintain aspect ratios

### Documents ✅
- **DOCX ↔ PDF / TXT / ODT** - Full bidirectional conversion
- **PDF ↔ JPG / PNG / DOCX / TXT** - PDF to image and document conversion
- **PPT/PPTX ↔ PDF / DOCX** - Basic conversion (text extraction)
- **PPT/PPTX → Images** - ⚠️ Temporarily disabled (native dependency issues)
- **XLS/XLSX ↔ CSV / PDF / XLSX** - Excel format conversion and export
- **ODT ↔ DOCX / PDF / TXT** - OpenDocument Text support

### Ebooks ✅
- **EPUB ↔ MOBI / PDF / AZW3** - Comprehensive ebook conversion
- **PDF ↔ EPUB** - Document to ebook conversion
- **DOCX ↔ EPUB / MOBI** - Document to ebook conversion
- **Device Optimization** - Kindle, Kobo, Nook compatibility

### Archives ✅
- **RAR ↔ ZIP** - Cross-platform archive conversion
- **TAR ↔ ZIP / 7Z** - Unix/Linux archive support
- **Multi-format Support** - ZIP, RAR, TAR, TAR.GZ, TAR.BZ2, 7Z, GZ, BZ2
- **Extract or Compress** - Convert between any supported archive format

### Fonts ✅
- **TTF ↔ OTF / WOFF** - OpenType font conversion
- **Font ↔ Web font formats** - WOFF2, EOT, SVG support
- **Cross-platform compatibility** - Windows, macOS, Linux font formats
- **Web optimization** - Convert to web-optimized formats

### CAD/3D ✅
- **STL ↔ OBJ / STEP / 3DS** - 3D mesh format conversion
- **DWG ↔ DXF / PDF / SVG** - CAD drawing conversion
- **Multi-format support** - STL, OBJ, STEP, 3DS, DWG, DXF, DAE, FBX, PLY, WRL, X3D
- **Industry standards** - Professional CAD/3D file handling

### Vector/Graphics ✅
- **AI ↔ PDF / SVG / PNG / EPS** - Adobe Illustrator format conversion
- **CDR ↔ SVG / PNG / PDF / EPS** - CorelDRAW format conversion
- **Multi-format support** - AI, CDR, EPS, SVG, PDF, PNG, JPG
- **Professional graphics** - Industry-standard vector file handling

### Data Formats ✅
- **CSV ↔ XLS / JSON / XML / YAML** - Comprehensive data format conversion
- **JSON ↔ XML / CSV / YAML** - Structured data interchange
- **Multi-format support** - CSV, XLS, XLSX, JSON, XML, YAML, YML
- **Data validation** - Built-in format validation and preview

### Disk Images ✅
- **ISO ↔ BIN / IMG** - Disk image format conversion
- **DMG ↔ ISO** - Apple disk image conversion
- **Multi-format support** - ISO, BIN, IMG, DMG
- **Industry standards** - Professional disk image handling

### Specialized Formats ✅
- **DICOM ↔ PNG / JPG** - Medical imaging format conversion
- **GPX ↔ KML / CSV** - GPS data format conversion
- **SRT ↔ VTT / TXT** - Subtitle format conversion
- **Professional tools** - Industry-standard specialized format handling

### Audio ⚠️
- **Any Audio Format ↔ MP3 / WAV / FLAC / OGG / M4A** - ⚠️ Temporarily disabled (FFmpeg dependency)
- **Extract Audio from Video** - ⚠️ Temporarily disabled (FFmpeg dependency)
- Adjust quality, bitrate, and sample rate

### Video ⚠️
- **Any Video Format ↔ MP4 / MOV / AVI / MKV / WebM** - ⚠️ Temporarily disabled (FFmpeg dependency)
- **Video ↔ Audio Extraction** - ⚠️ Temporarily disabled (FFmpeg dependency)
- **Video Processing** - ⚠️ Temporarily disabled (FFmpeg dependency)

> **Note**: Some conversions are temporarily disabled due to native dependency issues. These will be re-enabled once stable alternatives are found. See [Known Issues](#known-issues) for more details.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/file-converter.git
cd file-converter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **File Processing**: 
  - **Images**: Sharp, PDF2Pic, SVG2PDF
  - **Documents**: PDF-lib, PDF-parse, Mammoth, DOCX, XLSX, LibreOffice-convert
  - **Archives**: Archiver, Unzipper, Tar, 7zip-bin, node-7z
  - **Fonts**: OpenType.js, FontKit
  - **3D/CAD**: Three.js, SVGO
  - **Data**: js-yaml, xml2js, csv-parser, csv-writer
- **Styling**: Sass/SCSS
- **Build Tools**: Webpack, Sass compiler
- **Security**: Helmet, CORS, Express-rate-limit
- **Development**: Nodemon, Babel

## 📁 Project Structure

```
file-converter/
├── public/                 # Static assets
│   ├── css/               # Compiled CSS
│   ├── js/                # Compiled JavaScript
│   └── index.html         # Main HTML file
├── src/
│   ├── styles/            # SCSS source files
│   ├── scripts/           # JavaScript source files
│   └── server/            # Server-side code
├── uploads/               # Temporary file storage
├── converted/             # Converted file storage
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md              # Project documentation
```

## 🔧 Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads
CONVERTED_PATH=./converted
```

## 🚀 Deployment

### GitHub Pages (Static Version)
For a static version that can be hosted on GitHub Pages:

1. Build the project:
```bash
npm run build
```

2. The `public/` directory contains all static files ready for deployment

3. Enable GitHub Pages in your repository settings

### Vercel/Netlify
The project is ready for deployment on Vercel or Netlify with zero configuration.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information on how to contribute to this project.

### Quick Start for Contributors
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Issue Templates
- [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) for image processing
- [PDF-lib](https://pdf-lib.js.org/) for PDF manipulation
- [Express.js](https://expressjs.com/) for the web framework
- [Mammoth](https://github.com/mwilliamson/mammoth.js) for DOCX processing
- [XLSX](https://github.com/SheetJS/sheetjs) for Excel file handling
- [Archiver](https://github.com/archiverjs/node-archiver) for archive operations
- [Three.js](https://threejs.org/) for 3D file processing
- All contributors and the open source community

## 📊 Project Statistics

![GitHub repo size](https://img.shields.io/github/repo-size/yourusername/file-converter.svg)
![GitHub language count](https://img.shields.io/github/languages/count/yourusername/file-converter.svg)
![GitHub top language](https://img.shields.io/github/languages/top/yourusername/file-converter.svg)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/yourusername/file-converter.svg)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/yourusername/file-converter.svg)

## 🐛 Known Issues

### Temporarily Disabled Conversions
Some conversions are temporarily disabled due to native dependency issues:

- **HEIC conversions**: Requires `heic-convert` with native dependencies
- **RAW image conversions**: Requires `canvas` with native dependencies  
- **Audio/video conversions**: Requires `fluent-ffmpeg` (deprecated)
- **PowerPoint to image conversions**: Requires `puppeteer` (deprecated)

These will be re-enabled once stable alternatives are found. See [Issues](https://github.com/yourusername/file-converter/issues) for updates.

### Security Vulnerabilities
- `xlsx` package has a known high severity vulnerability with no available fix

## 📞 Support

If you encounter any issues or have questions:

- 📋 [Open an Issue](https://github.com/yourusername/file-converter/issues)
- 📖 [Check Documentation](https://github.com/yourusername/file-converter#readme)
- 💬 [Discussion Board](https://github.com/yourusername/file-converter/discussions)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/file-converter&type=Date)](https://star-history.com/#yourusername/file-converter&Date)

---

**Made with ❤️ for the community**

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%23FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/blancodagoat) 