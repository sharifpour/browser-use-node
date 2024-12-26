/**
 * Security configuration interface
 */
export interface SecurityConfig {
    /**
     * Whether to disable browser security features
     * @default false
     */
    disableSecurity: boolean;

    /**
     * Whether to bypass Content Security Policy
     * @default false
     */
    bypassCSP: boolean;

    /**
     * Whether to ignore HTTPS errors
     * @default false
     */
    ignoreHTTPSErrors: boolean;

    /**
     * Cookie security options
     */
    cookieOptions: {
        /**
         * Whether to enable secure cookies
         * @default true
         */
        secure: boolean;

        /**
         * Whether to enable httpOnly cookies
         * @default true
         */
        httpOnly: boolean;

        /**
         * Cookie same site policy
         * @default 'Lax'
         */
        sameSite: 'Strict' | 'Lax' | 'None';
    };

    /**
     * Rate limiting options
     */
    rateLimit: {
        /**
         * Maximum number of requests per window
         * @default 100
         */
        maxRequests: number;

        /**
         * Time window in milliseconds
         * @default 60000
         */
        windowMs: number;
    };

    /**
     * Request validation options
     */
    requestValidation: {
        /**
         * Whether to validate request headers
         * @default true
         */
        validateHeaders: boolean;

        /**
         * Whether to validate request parameters
         * @default true
         */
        validateParams: boolean;

        /**
         * Whether to validate request body
         * @default true
         */
        validateBody: boolean;
    };

    /**
     * Security headers configuration
     */
    securityHeaders: {
        /**
         * Content Security Policy
         * @default "default-src 'self'"
         */
        contentSecurityPolicy: string;

        /**
         * X-Frame-Options
         * @default "SAMEORIGIN"
         */
        frameOptions: string;

        /**
         * X-Content-Type-Options
         * @default "nosniff"
         */
        contentTypeOptions: string;

        /**
         * X-XSS-Protection
         * @default "1; mode=block"
         */
        xssProtection: string;

        /**
         * Referrer-Policy
         * @default "strict-origin-when-cross-origin"
         */
        referrerPolicy: string;
    };
}

/**
 * Default security configuration
 */
export const defaultSecurityConfig: SecurityConfig = {
    disableSecurity: false,
    bypassCSP: false,
    ignoreHTTPSErrors: false,
    cookieOptions: {
        secure: true,
        httpOnly: true,
        sameSite: 'Lax'
    },
    rateLimit: {
        maxRequests: 100,
        windowMs: 60000
    },
    requestValidation: {
        validateHeaders: true,
        validateParams: true,
        validateBody: true
    },
    securityHeaders: {
        contentSecurityPolicy: "default-src 'self'",
        frameOptions: 'SAMEORIGIN',
        contentTypeOptions: 'nosniff',
        xssProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin'
    }
};