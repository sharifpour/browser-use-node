/**
 * Playwright browser on steroids.
 */

import { type Browser as PlaywrightBrowser, webkit } from "playwright";
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

const defaultConfig: BrowserConfig = {
	headless: false,
	disableSecurity: true,
	extraChromiumArgs: [],
};

/**
 * Playwright browser on steroids.
 *
 * This is a persistent browser factory that can spawn multiple browser contexts.
 * It is recommended to use only one instance of Browser per your application (RAM usage will grow otherwise).
 */
export class Browser {
	private config: BrowserConfig;
	private playwrightBrowser: PlaywrightBrowser | null = null;

	constructor(config: BrowserConfig = {}) {
		this.config = { ...defaultConfig, ...config };
	}

	/**
	 * Create a browser context
	 */
	async newContext(config: BrowserContextConfig = {}): Promise<BrowserContext> {
    return new BrowserContext(this, config);
	}

	/**
	 * Get a browser context
	 */
	async getPlaywrightBrowser(): Promise<PlaywrightBrowser> {
		if (!this.playwrightBrowser) {
			return this.init();
		}
		return this.playwrightBrowser;
	}

	/**
	 * Initialize the browser session
	 */
	private async init(): Promise<PlaywrightBrowser> {
		this.playwrightBrowser = await this.setupBrowser();
		return this.playwrightBrowser;
	}

	/**
	 * Sets up and returns a Playwright Browser instance with anti-detection measures.
	 */
	private async setupBrowser(): Promise<PlaywrightBrowser> {
		if (this.config.wssUrl) {
      return webkit.connect(this.config.wssUrl);
		}

		if (this.config.chromeInstancePath) {
			// TODO: Implement Chrome instance connection
			throw new Error("Chrome instance connection not implemented yet");
		}

		const disableSecurityArgs = this.config.disableSecurity
			? [
					"--disable-web-security",
					"--disable-site-isolation-trials",
					"--disable-features=IsolateOrigins,site-per-process",
				]
			: [];


    return webkit.launch({
			headless: this.config.headless,
			args: [
				"--no-sandbox",
				"--disable-blink-features=AutomationControlled",
				"--disable-infobars",
				"--disable-background-timer-throttling",
        // "--disable-popup-blocking",
				"--disable-backgrounding-occluded-windows",
				"--disable-renderer-backgrounding",
				"--disable-window-activation",
				"--disable-focus-on-load",
        // "--no-first-run",
				"--no-default-browser-check",
				"--no-startup-window",
				"--window-position=0,0",
        "--window-size=1280,800",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-setuid-sandbox",
        "--no-zygote",
        "--single-process",
        "--disable-dev-shm-usage",
				...disableSecurityArgs,
				...(this.config.extraChromiumArgs || []),
			],
			proxy: this.config.proxy,
		});
	}

	/**
	 * Close the browser instance
	 */
	async close(): Promise<void> {
		if (this.playwrightBrowser) {
			await this.playwrightBrowser.close();
			this.playwrightBrowser = null;
		}
	}
}
