/**
 * Browser types and interfaces
 */

import type { Page, Browser as PlaywrightBrowserType, BrowserContext as PlaywrightContextType } from 'playwright';
import type { Cookie } from 'playwright';
import type { DOMElementNode, DOMHistoryElement } from "../dom/types";

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
	 * Browser type
	 */
	browserType?: "chromium" | "firefox" | "webkit";

	/**
	 * Path to cookies file for persistence
	 */
	cookiesFile?: string;

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
 * Browser error
 */
export class BrowserError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BrowserError";
	}
}
