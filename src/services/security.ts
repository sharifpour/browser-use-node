import { SecurityConfig, defaultSecurityConfig } from '../config/security';
import { getLogger } from '../utils/logger';
import { RateLimiter } from 'limiter';
import { sanitize } from 'xss';

const logger = getLogger('SecurityService');

/**
 * Security service for handling security-related functionality
 */
export class SecurityService {
    private static instance: SecurityService;
    private config: SecurityConfig;
    private rateLimiter: RateLimiter;

    private constructor(config: Partial<SecurityConfig> = {}) {
        this.config = { ...defaultSecurityConfig, ...config };
        this.rateLimiter = new RateLimiter({
            tokensPerInterval: this.config.rateLimit.maxRequests,
            interval: this.config.rateLimit.windowMs
        });
    }

    public static getInstance(config?: Partial<SecurityConfig>): SecurityService {
        if (!SecurityService.instance) {
            SecurityService.instance = new SecurityService(config);
        }
        return SecurityService.instance;
    }

    /**
     * Get security configuration for browser context
     */
    public getBrowserContextConfig() {
        return {
            bypassCSP: this.config.bypassCSP,
            ignoreHTTPSErrors: this.config.ignoreHTTPSErrors
        };
    }

    /**
     * Get security headers
     */
    public getSecurityHeaders(): Record<string, string> {
        return {
            'Content-Security-Policy': this.config.securityHeaders.contentSecurityPolicy,
            'X-Frame-Options': this.config.securityHeaders.frameOptions,
            'X-Content-Type-Options': this.config.securityHeaders.contentTypeOptions,
            'X-XSS-Protection': this.config.securityHeaders.xssProtection,
            'Referrer-Policy': this.config.securityHeaders.referrerPolicy
        };
    }

    /**
     * Get cookie options
     */
    public getCookieOptions() {
        return this.config.cookieOptions;
    }

    /**
     * Check rate limit
     */
    public async checkRateLimit(): Promise<boolean> {
        try {
            return await this.rateLimiter.tryRemoveTokens(1);
        } catch (error) {
            logger.error('Rate limit check failed:', error);
            return false;
        }
    }

    /**
     * Validate and sanitize request parameters
     */
    public validateRequest(request: {
        headers?: Record<string, string>;
        params?: Record<string, string>;
        body?: any;
    }): boolean {
        try {
            if (this.config.requestValidation.validateHeaders && request.headers) {
                this.validateHeaders(request.headers);
            }

            if (this.config.requestValidation.validateParams && request.params) {
                this.validateParams(request.params);
            }

            if (this.config.requestValidation.validateBody && request.body) {
                this.validateBody(request.body);
            }

            return true;
        } catch (error) {
            logger.error('Request validation failed:', error);
            return false;
        }
    }

    /**
     * Validate headers
     */
    private validateHeaders(headers: Record<string, string>): void {
        // Check for required headers
        const requiredHeaders = ['user-agent', 'host'];
        for (const header of requiredHeaders) {
            if (!headers[header]) {
                throw new Error(`Missing required header: ${header}`);
            }
        }

        // Check for suspicious headers
        const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
        for (const header of suspiciousHeaders) {
            if (headers[header]) {
                logger.warn(`Suspicious header detected: ${header}`);
            }
        }
    }

    /**
     * Validate parameters
     */
    private validateParams(params: Record<string, string>): void {
        for (const [key, value] of Object.entries(params)) {
            // Check for SQL injection
            if (value.toLowerCase().includes('select') || value.toLowerCase().includes('union')) {
                throw new Error(`Potential SQL injection detected in parameter: ${key}`);
            }

            // Check for XSS
            if (value.includes('<script>') || value.includes('javascript:')) {
                throw new Error(`Potential XSS detected in parameter: ${key}`);
            }

            // Check for path traversal
            if (value.includes('../') || value.includes('..\\')) {
                throw new Error(`Path traversal detected in parameter: ${key}`);
            }
        }
    }

    /**
     * Validate request body
     */
    private validateBody(body: any): void {
        if (typeof body === 'string') {
            body = this.sanitizeInput(body);
        } else if (typeof body === 'object') {
            for (const [key, value] of Object.entries(body)) {
                if (typeof value === 'string') {
                    body[key] = this.sanitizeInput(value);
                }
            }
        }
    }

    /**
     * Sanitize input
     */
    private sanitizeInput(input: string): string {
        // Remove potential XSS
        input = sanitize(input);

        // Remove potential SQL injection
        input = input.replace(/['";]/g, '');

        // Remove potential command injection
        input = input.replace(/[&|;`]/g, '');

        return input;
    }

    /**
     * Update security configuration
     */
    public updateConfig(config: Partial<SecurityConfig>): void {
        this.config = { ...this.config, ...config };
        this.rateLimiter = new RateLimiter({
            tokensPerInterval: this.config.rateLimit.maxRequests,
            interval: this.config.rateLimit.windowMs
        });
    }
}