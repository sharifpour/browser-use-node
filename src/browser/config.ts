/**
 * Browser configuration types
 */

/**
 * Browser window size
 */
export interface BrowserContextWindowSize {
	width: number;
	height: number;
}

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
	 * @default 0.5
	 */
	minimumWaitPageLoadTime?: number;

	/**
	 * Time to wait for network requests to finish before getting page state
	 * @default 1.0
	 */
	waitForNetworkIdlePageLoadTime?: number;

	/**
	 * Maximum time to wait for page load before proceeding anyway
	 * @default 5.0
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
	 * Browser window size
	 * @default { width: 1280, height: 1100 }
	 */
	browserWindowSize?: BrowserContextWindowSize;

	/**
	 * Disable viewport
	 */
	noViewport?: boolean;

	/**
	 * Path to save video recordings
	 */
	saveRecordingPath?: string;

	/**
	 * Path to save trace files
	 * It will auto name the file with the TRACE_PATH/{context_id}.zip
	 */
	tracePath?: string;

	/**
	 * Whether to save screenshots
	 * @default false
	 */
	saveScreenshots?: boolean;
}