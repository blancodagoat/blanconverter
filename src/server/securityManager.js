/**
 * Security Manager
 * Provides emergency controls and monitoring for security incidents
 */

const fs = require('fs').promises;
const path = require('path');

class SecurityManager {
    constructor() {
        this.securityConfig = {
            excelProcessing: {
                enabled: true,
                maxFileSize: 50 * 1024 * 1024, // 50MB
                maxUploadsPerHour: 5,
                suspiciousPatterns: [
                    /\.\.\//,           // Path traversal
                    /javascript:/i,     // JavaScript protocol
                    /data:text\/html/i, // HTML data URLs
                    /vbscript:/i,       // VBScript
                    /on\w+\s*=/i,       // Event handlers
                    /<script/i,         // Script tags
                    /<iframe/i,         // Iframe tags
                    /<object/i,         // Object tags
                    /<embed/i           // Embed tags
                ]
            },
            monitoring: {
                enabled: true,
                logSuspiciousActivity: true,
                alertThreshold: 3, // Alert after 3 suspicious activities
                cooldownPeriod: 3600000 // 1 hour cooldown
            },
            emergency: {
                killSwitchEnabled: false,
                killSwitchReason: null,
                killSwitchTimestamp: null
            }
        };
        
        this.incidentLog = [];
        this.suspiciousIPs = new Map();
        this.loadSecurityConfig();
    }

    /**
     * Load security configuration
     */
    async loadSecurityConfig() {
        try {
            const configPath = path.join(__dirname, '../../security-config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.securityConfig = { ...this.securityConfig, ...JSON.parse(configData) };
        } catch (error) {
            // Use default config if file doesn't exist
            console.log('Using default security configuration');
        }
    }

    /**
     * Save security configuration
     */
    async saveSecurityConfig() {
        try {
            const configPath = path.join(__dirname, '../../security-config.json');
            await fs.writeFile(configPath, JSON.stringify(this.securityConfig, null, 2));
        } catch (error) {
            console.error('Failed to save security config:', error);
        }
    }

    /**
     * Check if Excel processing is allowed
     */
    isExcelProcessingAllowed() {
        if (this.securityConfig.emergency.killSwitchEnabled) {
            return {
                allowed: false,
                reason: `Excel processing disabled: ${this.securityConfig.emergency.killSwitchReason}`,
                timestamp: this.securityConfig.emergency.killSwitchTimestamp
            };
        }
        return { allowed: true };
    }

    /**
     * Emergency kill switch for Excel processing
     */
    async enableExcelKillSwitch(reason = 'Security incident detected') {
        this.securityConfig.emergency.killSwitchEnabled = true;
        this.securityConfig.emergency.killSwitchReason = reason;
        this.securityConfig.emergency.killSwitchTimestamp = new Date().toISOString();
        
        await this.saveSecurityConfig();
        
        console.error(`🚨 EXCEL PROCESSING DISABLED: ${reason}`);
        console.error(`Timestamp: ${this.securityConfig.emergency.killSwitchTimestamp}`);
        
        return {
            success: true,
            message: 'Excel processing disabled',
            reason,
            timestamp: this.securityConfig.emergency.killSwitchTimestamp
        };
    }

    /**
     * Re-enable Excel processing
     */
    async disableExcelKillSwitch(reason = 'Security threat resolved') {
        this.securityConfig.emergency.killSwitchEnabled = false;
        this.securityConfig.emergency.killSwitchReason = null;
        this.securityConfig.emergency.killSwitchTimestamp = null;
        
        await this.saveSecurityConfig();
        
        console.log(`✅ Excel processing re-enabled: ${reason}`);
        
        return {
            success: true,
            message: 'Excel processing re-enabled',
            reason
        };
    }

    /**
     * Log security incident
     */
    logIncident(type, details) {
        const incident = {
            id: Date.now().toString(),
            type,
            details,
            timestamp: new Date().toISOString(),
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown',
            severity: details.severity || 'medium'
        };

        this.incidentLog.push(incident);
        
        // Keep only last 100 incidents
        if (this.incidentLog.length > 100) {
            this.incidentLog = this.incidentLog.slice(-100);
        }

        // Check if we should trigger kill switch
        if (this.shouldTriggerKillSwitch(incident)) {
            this.enableExcelKillSwitch(`Multiple security incidents detected from IP: ${incident.ip}`);
        }

        // Log to console for monitoring
        console.warn(`🚨 Security Incident [${type}]:`, {
            ip: incident.ip,
            severity: incident.severity,
            details: incident.details,
            timestamp: incident.timestamp
        });

        return incident;
    }

    /**
     * Check if kill switch should be triggered
     */
    shouldTriggerKillSwitch(incident) {
        if (!this.securityConfig.monitoring.enabled) return false;

        const recentIncidents = this.incidentLog.filter(
            i => i.ip === incident.ip && 
                 Date.now() - new Date(i.timestamp).getTime() < this.securityConfig.monitoring.cooldownPeriod
        );

        return recentIncidents.length >= this.securityConfig.monitoring.alertThreshold;
    }

    /**
     * Validate file for security threats
     */
    validateFile(file, req) {
        const validation = {
            valid: true,
            warnings: [],
            errors: []
        };

        // Check if Excel processing is disabled
        const excelStatus = this.isExcelProcessingAllowed();
        if (!excelStatus.allowed) {
            validation.valid = false;
            validation.errors.push(excelStatus.reason);
            return validation;
        }

        // Check file size
        if (file.size > this.securityConfig.excelProcessing.maxFileSize) {
            validation.valid = false;
            validation.errors.push(`File size ${file.size} exceeds limit ${this.securityConfig.excelProcessing.maxFileSize}`);
        }

        // Check for suspicious patterns in filename
        const suspiciousPatterns = this.securityConfig.excelProcessing.suspiciousPatterns;
        if (suspiciousPatterns.some(pattern => pattern.test(file.originalname))) {
            validation.valid = false;
            validation.errors.push('Suspicious filename detected');
            
            // Log incident
            this.logIncident('suspicious_filename', {
                ip: req?.ip || 'unknown',
                userAgent: req?.get('User-Agent') || 'unknown',
                filename: file.originalname,
                severity: 'high'
            });
        }

        // Check IP-based rate limiting
        if (req?.ip) {
            const ipInfo = this.suspiciousIPs.get(req.ip) || { count: 0, lastSeen: 0 };
            const now = Date.now();
            
            if (now - ipInfo.lastSeen < this.securityConfig.monitoring.cooldownPeriod) {
                if (ipInfo.count >= this.securityConfig.excelProcessing.maxUploadsPerHour) {
                    validation.valid = false;
                    validation.errors.push('Upload rate limit exceeded for this IP');
                }
                ipInfo.count++;
            } else {
                ipInfo.count = 1;
            }
            
            ipInfo.lastSeen = now;
            this.suspiciousIPs.set(req.ip, ipInfo);
        }

        return validation;
    }

    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            excelProcessing: this.isExcelProcessingAllowed(),
            monitoring: this.securityConfig.monitoring.enabled,
            recentIncidents: this.incidentLog.slice(-10),
            suspiciousIPs: Array.from(this.suspiciousIPs.entries()).map(([ip, info]) => ({
                ip,
                count: info.count,
                lastSeen: new Date(info.lastSeen).toISOString()
            })),
            config: this.securityConfig
        };
    }

    /**
     * Reset security counters
     */
    resetSecurityCounters() {
        this.incidentLog = [];
        this.suspiciousIPs.clear();
        console.log('Security counters reset');
    }
}

module.exports = SecurityManager;
