/**
 * Browser types and interfaces
 */

import type { Page, Browser as PlaywrightBrowserType, BrowserContext as PlaywrightContextType } from 'playwright';
import type { DOMElementNode } from "../dom/types";

export type PlaywrightBrowser = PlaywrightBrowserType;
export type PlaywrightBrowserContext = PlaywrightContextType;
export type PlaywrightPage = Page;

/**
 * Tab information
 */
export interface TabInfo {
	/**
	 * Tab URL
	 */
	url: string;

	/**
	 * Tab title
	 */
	title: string;

	/**
	 * Page ID
	 */
	pageId: number;
}

/**
 * Browser session state
 */
export interface BrowserSession {
	context: PlaywrightBrowserContext;
	state: BrowserState;
	tabs: TabInfo[];
	cachedState: {
		selectorMap: Record<number, DOMElementNode>;
	};
}

/**
 * Browser state
 */
export interface BrowserState {
	/**
	 * Current URL
	 */
	url?: string;

	/**
	 * Page title
	 */
	title?: string;

	/**
	 * Open tabs
	 */
	tabs?: TabInfo[];

	/**
	 * DOM tree
	 */
	domTree?: DOMElementNode;

	/**
	 * Clickable elements
	 */
	clickableElements?: DOMElementNode[];

	/**
	 * Selector map
	 */
	selectorMap: Record<number, DOMElementNode>;

	/**
	 * Screenshot (base64)
	 */
	screenshot?: string;
}

/**
 * Browser state history
 */
export interface BrowserStateHistory {
	/**
	 * URL
	 */
	url?: string;

	/**
	 * Page title
	 */
	title?: string;

	/**
	 * Open tabs
	 */
	tabs?: TabInfo[];

	/**
	 * Interacted elements
	 */
	interactedElement?: DOMElementNode | null;

	/**
	 * Screenshot (base64)
	 */
	screenshot?: string;

	/**
	 * Convert to dictionary
	 */
	toDict(): Record<string, unknown>;
}

/**
 * Browser configuration
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
	proxy?: {
		server: string;
		bypass?: string;
		username?: string;
		password?: string;
	};

	/**
	 * Default configuration for new browser contexts
	 */
	newContextConfig?: {
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
		 * Browser window size
		 * @default { width: 1280, height: 1100 }
		 */
		browserWindowSize?: {
			width: number;
			height: number;
		};

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
	};
}

/**
 * Browser error
 */
export class BrowserError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BrowserError";
	}
}
