/**
 * Playwright browser on steroids.
 */

import axios from "axios";
import { spawn } from "node:child_process";
import { type Browser as PlaywrightBrowser, chromium } from "playwright";
import { logger } from "../utils/logger";
import type { BrowserContextConfig } from "./config";
import { BrowserContext } from "./context";

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
	extraChromiumArgs: []
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
	 * Get the current configuration
	 */
	async getConfig(): Promise<BrowserConfig> {
		return this.config;
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
			try {
				return await chromium.connect(this.config.wssUrl);
			} catch (error) {
				logger.error(`Failed to connect to browser via WebSocket: ${error}`);
				throw error;
			}
		}

		if (this.config.chromeInstancePath) {
			try {
				// Check if browser is already running
				const response = await axios.get('http://localhost:9222/json/version', {
					timeout: 2000
				});

				if (response.status === 200) {
					logger.info('Reusing existing Chrome instance');
					return await chromium.connectOverCDP({
						endpointURL: 'http://localhost:9222',
						timeout: 20000 // 20 second timeout for connection
					});
				}
			} catch (error) {
				if (axios.isAxiosError(error)) {
					logger.debug('No existing Chrome instance found, starting a new one');
				} else {
					logger.error(`Failed to check Chrome instance: ${error}`);
				}
			}

			try {
				// Start a new Chrome instance
				const chromeProcess = spawn(
					this.config.chromeInstancePath,
					['--remote-debugging-port=9222'],
					{
						stdio: 'ignore',
						detached: true
					}
				);

				chromeProcess.unref();

				// Wait a bit for Chrome to start
				await new Promise(resolve => setTimeout(resolve, 1000));

				// Attempt to connect to the new instance
				try {
					return await chromium.connectOverCDP({
						endpointURL: 'http://localhost:9222',
						timeout: 20000 // 20 second timeout for connection
					});
				} catch (error) {
					logger.error(`Failed to connect to Chrome instance: ${error}`);
					throw new Error(
						'To start Chrome in Debug mode, you need to close all existing Chrome instances and try again otherwise we cannot connect to the instance.'
					);
				}
			} catch (error) {
				logger.error(`Failed to start Chrome instance: ${error}`);
				throw error;
			}
		}

		try {
			const disableSecurityArgs = this.config.disableSecurity
				? [
						"--disable-web-security",
						"--disable-site-isolation-trials",
						"--disable-features=IsolateOrigins,site-per-process",
					]
				: [];

			return await chromium.launch({
				headless: this.config.headless,
				args: [
					"--no-sandbox",
					"--disable-blink-features=AutomationControlled",
					"--disable-infobars",
					"--disable-background-timer-throttling",
					"--disable-popup-blocking",
					"--disable-backgrounding-occluded-windows",
					"--disable-renderer-backgrounding",
					"--disable-window-activation",
					"--disable-focus-on-load",
					"--no-first-run",
					"--no-default-browser-check",
					"--no-startup-window",
					"--window-position=0,0",
					"--window-size=1280,800",
					"--disable-dev-shm-usage",
					"--disable-gpu",
					"--disable-setuid-sandbox",
					"--no-zygote",
					"--single-process",
					...disableSecurityArgs,
					...(this.config.extraChromiumArgs || []),
				],
				proxy: this.config.proxy,
			});
		} catch (error) {
			logger.error(`Failed to launch browser: ${error}`);
			throw error;
		}
	}

	/**
	 * Close the browser instance
	 */
	async close(): Promise<void> {
		try {
			if (this.playwrightBrowser) {
				await this.playwrightBrowser.close();
			}
		} catch (error) {
			logger.debug(`Failed to close browser properly: ${error}`);
		} finally {
			this.playwrightBrowser = null;
		}
	}

	/**
	 * Cleanup when object is destroyed
	 */
	async cleanup(): Promise<void> {
		try {
			if (this.playwrightBrowser) {
				// Try to get running event loop
				let loop: any;
				try {
					loop = (global as any).process._getActiveHandles?.();
				} catch {
					// Ignore error
				}

				if (loop?.length > 0) {
					// Event loop is running, create task
					loop[0].unref();
					await this.close();
				} else {
					// No event loop, run sync
					await this.close();
				}
			}
		} catch (error) {
			logger.debug(`Failed to cleanup browser in destructor: ${error}`);
		}
	}
}
