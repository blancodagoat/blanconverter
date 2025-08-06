# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of File Converter seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [INSERT SECURITY EMAIL].

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

* Type of issue (buffer overflow, SQL injection, cross-site scripting, etc.)
* Full paths of source file(s) related to the vulnerability
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Preferred Languages

We prefer all communications to be in English.

## Policy

File Converter follows the principle of [Responsible Disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure).

## Security Best Practices

### For Users
- Always use the latest version of File Converter
- Keep your Node.js and npm versions updated
- Review the dependencies regularly with `npm audit`
- Report any suspicious behavior immediately

### For Contributors
- Follow secure coding practices
- Validate all user inputs
- Use parameterized queries for database operations
- Implement proper authentication and authorization
- Keep dependencies updated
- Review code for common vulnerabilities (OWASP Top 10)

## Known Security Issues

### Current Vulnerabilities
- `xlsx` package has a known high severity vulnerability with no available fix
- Some native dependencies may have security implications

### Mitigation Strategies
- Regular dependency updates via Dependabot
- Security scanning in CI/CD pipeline
- Code review process for all contributions
- Automated vulnerability scanning

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in the changelog.

## Acknowledgments

We would like to thank all security researchers and contributors who help us maintain the security of File Converter by reporting vulnerabilities responsibly. 