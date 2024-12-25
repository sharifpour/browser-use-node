/**
 * Browser context with enhanced capabilities.
 */
import type { Page, BrowserContext as PlaywrightContext } from "playwright";
import type { Browser } from "./browser";
import type { BrowserSession, BrowserState, DOMElement } from "./types";
/**
 * Browser context configuration
 */
export interface BrowserContextConfig {
    /**
     * Path to cookies file for persistence
     */
    cookiesFile?: string;
    /**
     * Minimum time to wait before getting page state for LLM input
     * @default 1.0
     */
    minimumWaitPageLoadTime?: number;
    /**
     * Time to wait for network requests to finish before getting page state
     * @default 3.0
     */
    waitForNetworkIdlePageLoadTime?: number;
    /**
     * Maximum time to wait for page load before proceeding anyway
     * @default 10.0
     */
    maximumWaitPageLoadTime?: number;
    /**
     * Time to wait between multiple per step actions
     * @default 1.0
     */
    waitBetweenActions?: number;
    /**
     * Disable browser security features
     * @default false
     */
    disableSecurity?: boolean;
    /**
     * Default browser window size
     */
    browserWindowSize?: {
        width: number;
        height: number;
    };
    /**
     * Disable viewport
     * @default false
     */
    noViewport?: boolean;
    /**
     * Path to save video recordings
     */
    saveRecordingPath?: string;
    /**
     * Path to save trace files
     */
    tracePath?: string;
    /**
     * Whether to enable JavaScript
     * @default true
     */
    javascript?: boolean;
    /**
     * Whether to enable images
     * @default true
     */
    images?: boolean;
    /**
     * User agent string
     */
    userAgent?: string;
    /**
     * Viewport size
     */
    viewport?: {
        width: number;
        height: number;
    };
    /**
     * Device scale factor
     */
    deviceScaleFactor?: number;
    /**
     * Whether the meta viewport tag is taken into account
     */
    isMobile?: boolean;
    /**
     * Whether to emulate touch events
     */
    hasTouch?: boolean;
    /**
     * Browser locale
     */
    locale?: string;
    /**
     * Browser timezone
     */
    timezoneId?: string;
    /**
     * Browser geolocation
     */
    geolocation?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
    };
    /**
     * Browser permissions
     */
    permissions?: string[];
    /**
     * HTTP credentials
     */
    httpCredentials?: {
        username: string;
        password: string;
    };
    /**
     * Whether to ignore HTTPS errors
     */
    ignoreHttpsErrors?: boolean;
    /**
     * Whether to enable offline mode
     */
    offline?: boolean;
    /**
     * Color scheme
     */
    colorScheme?: "light" | "dark" | "no-preference";
}
/**
 * Browser context with enhanced capabilities
 */
export declare class BrowserContext {
    private config;
    private browser;
    protected context: PlaywrightContext | null;
    private activePage;
    private session;
    constructor(browser: Browser, config?: Partial<BrowserContextConfig>);
    /**
     * Initialize the browser context
     */
    private init;
    private optimizeContext;
    /**
     * Get the active page
     */
    getPage(): Promise<Page>;
    /**
     * Close the browser context
     */
    close(): Promise<void>;
    /**
     * Input text into an element
     */
    inputText(elementNode: DOMElement, text: string): Promise<void>;
    /**
     * Click an element
     */
    clickElement(elementNode: DOMElement): Promise<void>;
    /**
     * Locate an element on the page
     */
    private locateElement;
    /**
     * Navigate forward in history
     */
    goForward(): Promise<void>;
    /**
     * Close the current tab
     */
    closeCurrentTab(): Promise<void>;
    /**
     * Get the current page HTML content
     */
    getPageHtml(): Promise<string>;
    /**
     * Execute JavaScript code on the page
     */
    executeJavaScript<T>(script: string): Promise<T>;
    /**
     * Get the current state of the browser
     */
    getState(useVision?: boolean): Promise<BrowserState>;
    /**
     * Take a screenshot of the current page
     */
    takeScreenshot(fullPage?: boolean): Promise<string>;
    /**
     * Remove highlight overlays and labels
     */
    removeHighlights(): Promise<void>;
    /**
     * Save current cookies to file
     */
    saveCookies(): Promise<void>;
    /**
     * Check if element is a file uploader
     */
    isFileUploader(elementNode: DOMElement): Promise<boolean>;
    /**
     * Wait for page and frames to load
     */
    private waitForPageAndFramesLoad;
    /**
     * Update and return state
     */
    private updateState;
    /**
     * Get all pages in the context
     */
    getPages(): Promise<Page[]>;
    /**
     * Get the current session
     */
    getSession(): Promise<BrowserSession>;
    /**
     * Switch to a specific tab
     */
    switchToTab(tabIndex: number): Promise<void>;
    /**
     * Create a new tab
     */
    createNewTab(url?: string): Promise<void>;
}
