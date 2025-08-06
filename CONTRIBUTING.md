# Contributing to File Converter

Thank you for your interest in contributing to File Converter! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs
- Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- Include detailed steps to reproduce the issue
- Provide information about your environment (OS, browser, etc.)
- Include any error messages from the browser console

### Suggesting Features
- Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- Describe the problem you're trying to solve
- Explain how the feature would benefit users
- Consider the implementation complexity

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 🛠️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/file-converter.git
cd file-converter

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the project for production
- `npm run build-css` - Compile SCSS to CSS
- `npm run build-js` - Bundle JavaScript with Webpack
- `npm test` - Run all tests
- `npm run test-images` - Run image conversion tests
- `npm run test-audio` - Run audio conversion tests
- `npm run test-video` - Run video conversion tests
- `npm run test-ebooks` - Run ebook conversion tests
- `npm run test-archives` - Run archive conversion tests
- `npm run test-fonts` - Run font conversion tests
- `npm run test-cad` - Run CAD/3D conversion tests
- `npm run test-vectors` - Run vector/graphic conversion tests
- `npm run test-data` - Run data format conversion tests
- `npm run test-disk-images` - Run disk image conversion tests
- `npm run test-specialized` - Run specialized format conversion tests

## 📁 Project Structure

```
file-converter/
├── public/                 # Static assets
│   ├── css/               # Compiled CSS
│   ├── js/                # Compiled JavaScript
│   └── index.html         # Main HTML file
├── src/
│   ├── styles/            # SCSS source files
│   │   └── main.scss      # Main stylesheet
│   ├── scripts/           # JavaScript source files
│   │   └── app.js         # Main frontend logic
│   └── server/            # Server-side code
│       ├── imageConverter.js
│       ├── documentConverter.js
│       ├── audioConverter.js
│       ├── videoConverter.js
│       ├── ebookConverter.js
│       ├── archiveConverter.js
│       ├── fontConverter.js
│       ├── cadConverter.js
│       ├── vectorConverter.js
│       ├── dataConverter.js
│       ├── diskImageConverter.js
│       └── specializedConverter.js
├── uploads/               # Temporary file storage
├── converted/             # Converted file storage
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md              # Project documentation
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test categories
npm run test-images
npm run test-audio
npm run test-video
# ... etc
```

### Writing Tests
- Tests should be comprehensive and cover edge cases
- Include both success and failure scenarios
- Test file validation and error handling
- Ensure proper cleanup of temporary files

### Test Structure
Each test file follows this pattern:
```javascript
const { expect } = require('chai');
const fs = require('fs').promises;
const path = require('path');

describe('Conversion Category', () => {
  // Test setup
  beforeEach(async () => {
    // Setup test environment
  });

  afterEach(async () => {
    // Cleanup test files
  });

  it('should convert format A to format B', async () => {
    // Test implementation
  });
});
```

## 📝 Code Style Guidelines

### JavaScript
- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use async/await for asynchronous operations
- Add JSDoc comments for functions
- Use meaningful variable and function names

### SCSS
- Use BEM methodology for CSS classes
- Organize styles logically
- Use CSS custom properties for theming
- Keep selectors specific and avoid deep nesting

### General
- Write self-documenting code
- Add comments for complex logic
- Follow the existing code style
- Keep functions small and focused

## 🔧 Adding New File Formats

### 1. Update the Converter
Add your conversion logic to the appropriate converter file in `src/server/`.

### 2. Update MIME Types
Add the new MIME types to the `fileFilter` in `server.js`.

### 3. Update Frontend
Add the new formats to the format mappings in `src/scripts/app.js`.

### 4. Add Tests
Create comprehensive tests for the new format in the appropriate test file.

### 5. Update Documentation
Update the README.md and relevant documentation files.

## 🚀 Deployment

### Local Testing
```bash
npm run build
npm start
```

### Production Deployment
The project is configured for deployment on:
- GitHub Pages (static version)
- Vercel
- Netlify
- Heroku

## 📋 Pull Request Checklist

Before submitting a pull request, ensure:

- [ ] Code follows the project's style guidelines
- [ ] All tests pass
- [ ] New functionality is tested
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Code is self-documenting
- [ ] Error handling is implemented
- [ ] Security considerations are addressed

## 🐛 Known Issues

### Temporarily Disabled Conversions
Some conversions are temporarily disabled due to dependency issues:
- HEIC conversions (requires `heic-convert` with native dependencies)
- Audio/video conversions (requires `fluent-ffmpeg`)
- PowerPoint to image conversions (requires `puppeteer`)

These will be re-enabled once stable alternatives are found.

## 📞 Getting Help

- Open an issue for bugs or feature requests
- Check existing issues for similar problems
- Review the documentation in the README
- Join our community discussions

## 📄 License

By contributing to File Converter, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to File Converter! 🎉 