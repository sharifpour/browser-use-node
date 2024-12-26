import xss from 'xss';

/**
 * Security service for sanitizing input
 */
export class SecurityService {
    /**
     * Sanitize HTML content
     */
    static sanitizeHtml(html: string): string {
        return xss(html);
    }

    /**
     * Sanitize URL
     */
    static sanitizeUrl(url: string): string {
        // Basic URL sanitization
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        return url;
    }

    /**
     * Validate file path
     */
    static validatePath(path: string): boolean {
        // Prevent path traversal
        return !path.includes('../') && !path.includes('..\\');
    }
}