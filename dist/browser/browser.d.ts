/**
 * Playwright browser on steroids.
 */
import { type Browser as PlaywrightBrowser } from "playwright";
import { BrowserContext, type BrowserContextConfig } from "./context";
export interface ProxySettings {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
}
/**
 * Configuration for the Browser.
 */
export interface BrowserConfig {
    /**
     * Whether to run browser in headless mode
     * @default false
     */
    headless?: boolean;
    /**
     * Disable browser security features
     * @default true
     */
    disableSecurity?: boolean;
    /**
     * Extra arguments to pass to the browser
     * @default []
     */
    extraChromiumArgs?: string[];
    /**
     * Path to a Chrome instance to use to connect to your normal browser
     * e.g. '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
     */
    chromeInstancePath?: string;
    /**
     * Connect to a browser instance via WebSocket
     */
    wssUrl?: string;
    /**
     * Proxy settings
     */
    proxy?: ProxySettings;
    /**
     * Default configuration for new browser contexts
     */
    newContextConfig?: BrowserContextConfig;
    /**
     * Whether to trace browser actions
     */
    trace?: boolean;
    /**
     * Path to save browser traces
     */
    tracePath?: string;
}
/**
 * Playwright browser on steroids.
 *
 * This is a persistent browser factory that can spawn multiple browser contexts.
 * It is recommended to use only one instance of Browser per your application (RAM usage will grow otherwise).
 */
export declare class Browser {
    private config;
    private playwrightBrowser;
    constructor(config?: BrowserConfig);
    /**
     * Create a browser context
     */
    newContext(config?: BrowserContextConfig): Promise<BrowserContext>;
    /**
     * Get a browser context
     */
    getPlaywrightBrowser(): Promise<PlaywrightBrowser>;
    /**
     * Initialize the browser session
     */
    private init;
    /**
     * Sets up and returns a Playwright Browser instance with anti-detection measures.
     */
    private setupBrowser;
    /**
     * Close the browser instance
     */
    close(): Promise<void>;
}
