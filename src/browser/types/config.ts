import type { ProxySettings } from './types';

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
	 * Extra arguments to pass to the browser
	 * @default []
	 */
	extra_chromium_args?: string[];

	/**
	 * Path to a Chrome instance to use
	 */
	chrome_instance_path?: string;

	/**
	 * Connect to a browser instance via WebSocket
	 */
	wss_url?: string;

	/**
	 * Proxy settings
	 */
	proxy?: ProxySettings;

	/**
	 * Ignore HTTPS errors
	 */
	ignoreHTTPSErrors?: boolean;
}

export const defaultConfig: BrowserConfig = {
	headless: false,
	extra_chromium_args: []
};