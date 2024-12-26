import xss from 'xss';

/**
 * Security service for sanitizing input
 */

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
    return xss(html);
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(input: string): string {
    // Basic URL sanitization
    return input.startsWith('http://') || input.startsWith('https://')
        ? input
        : `https://${input}`;
}

/**
 * Validate file path
 */
export function validatePath(path: string): boolean {
    // Prevent path traversal
    return !path.includes('../') && !path.includes('..\\');
}