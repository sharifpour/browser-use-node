/**
 * Browser types and interfaces
 */
/**
 * Browser configuration
 */
export interface BrowserConfig {
    /**
     * Browser type
     */
    browserType: "chromium" | "firefox" | "webkit";
    /**
     * Browser launch options
     */
    launchOptions?: {
        headless?: boolean;
        slowMo?: number;
        devtools?: boolean;
        args?: string[];
    };
    /**
     * Browser context options
     */
    contextOptions?: {
        viewport?: {
            width: number;
            height: number;
        };
        userAgent?: string;
        locale?: string;
        timezoneId?: string;
        geolocation?: {
            latitude: number;
            longitude: number;
            accuracy?: number;
        };
        permissions?: string[];
        extraHTTPHeaders?: Record<string, string>;
    };
}
/**
 * DOM element representation
 */
export interface DOMElement {
    /**
     * Element tag name
     */
    tag: string;
    /**
     * Element attributes
     */
    attributes: Record<string, string>;
    /**
     * Element XPath
     */
    xpath?: string;
    /**
     * Element selector
     */
    selector?: string;
    /**
     * Child elements
     */
    children?: DOMElement[];
}
/**
 * Browser state
 */
export interface BrowserState {
    /**
     * Current URL
     */
    url: string;
    /**
     * Page title
     */
    title: string;
    /**
     * Page content
     */
    content: string;
    /**
     * Screenshot (base64)
     */
    screenshot?: string;
    /**
     * DOM tree
     */
    domTree?: DOMElement;
    /**
     * Clickable elements
     */
    clickableElements?: DOMElement[];
}
/**
 * Browser session
 */
export interface BrowserSession {
    /**
     * Cached state
     */
    cachedState: {
        /**
         * Map of element indices to DOM elements
         */
        selectorMap: Record<number, DOMElement>;
    };
}
