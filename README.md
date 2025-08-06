# BlanConverter - Free Online File Conversion Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/blancodagoat/blanconverter/workflows/CI/badge.svg)](https://github.com/blancodagoat/blanconverter/actions)
[![Deploy](https://github.com/blancodagoat/blanconverter/workflows/Deploy/badge.svg)](https://github.com/blancodagoat/blanconverter/actions)
[![GitHub stars](https://img.shields.io/github/stars/blancodagoat/blanconverter.svg)](https://github.com/blancodagoat/blanconverter/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/blancodagoat/blanconverter.svg)](https://github.com/blancodagoat/blanconverter/network)
[![GitHub issues](https://img.shields.io/github/issues/blancodagoat/blanconverter.svg)](https://github.com/blancodagoat/blanconverter/issues)

A modern, free-to-use file conversion website that supports 50+ file formats including documents, images, archives, fonts, CAD/3D files, and more.

## 🌟 Features

- **50+ Format Support** - Convert between various file formats
- **Drag & Drop Interface** - Easy file upload with visual feedback
- **Real-time Progress** - Track conversion progress with live updates
- **Batch Processing** - Convert multiple files at once
- **No Registration Required** - Completely free and anonymous
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Secure** - Files are processed locally and automatically deleted
- **Open Source** - Full source code available on GitHub

## 📁 Supported Conversions

### ✅ **Documents**
- **DOCX ↔ PDF / TXT / ODT** - Full bidirectional conversion
- **PDF ↔ JPG / PNG / DOCX / TXT** - PDF to image and document conversion
- **PPT/PPTX ↔ PDF / DOCX** - Basic conversion (text extraction)
- **XLS/XLSX ↔ CSV / PDF / XLSX** - Excel format conversion and export
- **ODT ↔ DOCX / PDF / TXT** - OpenDocument Text support

### ✅ **Images**
- **Any ↔ JPG / PNG / WEBP / GIF** - High-quality image conversion with optimization
- **SVG ↔ PNG / JPG / PDF** - Vector to raster and PDF conversion
- **HEIC ↔ JPG / PNG** - ⚠️ Temporarily disabled (native dependency issues)
- **RAW ↔ JPG / TIFF** - ⚠️ Temporarily disabled (native dependency issues)

### ✅ **Archives**
- **RAR ↔ ZIP** - Cross-platform archive conversion
- **TAR ↔ ZIP / 7Z** - Unix/Linux archive support
- **Multi-format Support** - ZIP, RAR, TAR, TAR.GZ, TAR.BZ2, 7Z, GZ, BZ2
- **Extract or Compress** - Convert between any supported archive format

### ✅ **Fonts**
- **TTF ↔ OTF / WOFF** - OpenType font conversion
- **Font ↔ Web font formats** - WOFF2, EOT, SVG support
- **Cross-platform compatibility** - Windows, macOS, Linux font formats

### ✅ **CAD/3D**
- **STL ↔ OBJ / STEP / 3DS** - 3D mesh format conversion
- **DWG ↔ DXF / PDF / SVG** - CAD drawing conversion
- **Multi-format support** - STL, OBJ, STEP, 3DS, DWG, DXF, DAE, FBX, PLY, WRL, X3D

### ✅ **Vector/Graphics**
- **AI ↔ PDF / SVG / PNG / EPS** - Adobe Illustrator format conversion
- **CDR ↔ SVG / PNG / PDF / EPS** - CorelDRAW format conversion
- **Multi-format support** - AI, CDR, EPS, SVG, PDF, PNG, JPG

### ✅ **Data Formats**
- **CSV ↔ XLS / JSON / XML / YAML** - Comprehensive data format conversion
- **JSON ↔ XML / CSV / YAML** - Structured data interchange
- **Multi-format support** - CSV, XLS, XLSX, JSON, XML, YAML, YML

### ✅ **Disk Images**
- **ISO ↔ BIN / IMG** - Disk image format conversion
- **DMG ↔ ISO** - Apple disk image conversion
- **Multi-format support** - ISO, BIN, IMG, DMG

### ✅ **Specialized Formats**
- **DICOM ↔ PNG / JPG** - Medical imaging format conversion
- **GPX ↔ KML / CSV** - GPS data format conversion
- **SRT ↔ VTT / TXT** - Subtitle format conversion

### ✅ **Ebooks**
- **EPUB ↔ MOBI / PDF / AZW3** - Comprehensive ebook conversion
- **PDF ↔ EPUB** - Document to ebook conversion
- **DOCX ↔ EPUB / MOBI** - Document to ebook conversion

### ⚠️ **Audio/Video (Temporarily Disabled)**
- **Audio conversions** - ⚠️ Temporarily disabled (FFmpeg dependency)
- **Video conversions** - ⚠️ Temporarily disabled (FFmpeg dependency)
- **PowerPoint to images** - ⚠️ Temporarily disabled (native dependency issues)

> **Note**: Some conversions are temporarily disabled due to native dependency issues. These will be re-enabled once stable alternatives are found.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/blancodagoat/blanconverter.git
cd blanconverter
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

## 📁 Project Structure

```
blanconverter/
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

## 🚀 Deployment

### GitHub Pages (Static Version)
The project is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Vercel/Netlify
The project is ready for deployment on Vercel or Netlify with zero configuration.

### Heroku
```bash
git push heroku main
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for detailed information.

### Quick Start for Contributors
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 🐛 Known Issues

### Temporarily Disabled Conversions
Some conversions are temporarily disabled due to native dependency issues:
- **HEIC conversions**: Requires `heic-convert` with native dependencies
- **RAW image conversions**: Requires `canvas` with native dependencies  
- **Audio/video conversions**: Requires `fluent-ffmpeg` (deprecated)
- **PowerPoint to image conversions**: Requires `puppeteer` (deprecated)

These will be re-enabled once stable alternatives are found.

### Security Vulnerabilities
- `xlsx` package has a known high severity vulnerability with no available fix

## 📞 Support

If you encounter any issues or have questions:

- 📋 [Open an Issue](https://github.com/blancodagoat/blanconverter/issues)
- 📖 [Check Documentation](https://github.com/blancodagoat/blanconverter#readme)
- 💬 [Discussion Board](https://github.com/blancodagoat/blanconverter/discussions)

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

---

**Made with ❤️ for the community**

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-%23FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/blancodagoat) 