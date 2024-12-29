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
	disable_security?: boolean;

	/**
	 * Extra arguments to pass to the browser
	 * @default []
	 */
	extra_chromium_args?: string[];

	/**
	 * Connect to a browser instance via WebSocket
	 */
	wss_url?: string;

	/**
	 * Path to a Chrome instance to use
	 */
	chrome_instance_path?: string;

	/**
	 * Proxy settings
	 */
	proxy?: {
		server: string;
		username?: string;
		password?: string;
	};

	/**
	 * Browser window size
	 */
	browser_window_size?: {
		width: number;
		height: number;
	};

	/**
	 * Configuration for new browser contexts
	 */
	new_context_config?: BrowserContextConfig;
}

export const defaultConfig: BrowserConfig = {
	headless: false,
	disable_security: true,
	extra_chromium_args: []
};

export interface BrowserContextConfig {
	cookies_file?: string;
	minimum_wait_page_load_time?: number;
	wait_for_network_idle_page_load_time?: number;
	maximum_wait_page_load_time?: number;
	wait_between_actions?: number;
	disable_security?: boolean;
	browser_window_size?: {
		width: number;
		height: number;
	};
	no_viewport?: boolean;
	save_recording_path?: string;
	trace_path?: string;
	page_load_timeout?: number;
	wait_for_network_idle?: boolean;
}