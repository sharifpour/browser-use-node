/**
 * Browser context with enhanced capabilities.
 */

import * as fs from 'node:fs/promises';
import { mkdir } from "node:fs/promises";
import * as path from 'node:path';
import { dirname } from "node:path";
import type { Browser as PlaywrightBrowser, ConsoleMessage, Cookie, Dialog, ElementHandle, FileChooser, Frame, Page, BrowserContext as PlaywrightContext, Request, Response, Route, WebSocket, Worker } from "playwright";
import { v4 as uuidv4 } from 'uuid';
import { DOMService } from "../dom/service";
import type { DOMElementNode } from "../dom/types";
import { logger } from '../utils/logger';
import type { Browser } from "./browser";
import type { BrowserContextConfig } from "./config";
import type { BrowserSession, BrowserState, BrowserStateHistory, TabInfo as BrowserTabInfo } from "./types";

const DEFAULT_CONFIG: BrowserContextConfig = {
	minimumWaitPageLoadTime: 0.5,
	waitForNetworkIdlePageLoadTime: 1.0,
	maximumWaitPageLoadTime: 5.0,
	waitBetweenActions: 1.0,
	disableSecurity: false,
	browserWindowSize: {
		width: 1280,
		height: 1100
	},
	saveScreenshots: false
};

export interface RequestInterceptor {
	urlPattern: string | RegExp;
	handler: (route: Route, request: Request) => Promise<void>;
}

export interface ResponseInterceptor {
	urlPattern: string | RegExp;
	handler: (response: Response) => Promise<void>;
}

export type PageEventType =
	| 'console'
	| 'dialog'
	| 'download'
	| 'filechooser'
	| 'frameattached'
	| 'framedetached'
	| 'framenavigated'
	| 'load'
	| 'pageerror'
	| 'popup'
	| 'request'
	| 'requestfailed'
	| 'requestfinished'
	| 'response'
	| 'websocket'
	| 'worker';

export type PageEventHandler = {
	console: (msg: ConsoleMessage) => Promise<void> | void;
	dialog: (dialog: Dialog) => Promise<void> | void;
	download: (download: { url: string; suggestedFilename: string }) => Promise<void> | void;
	filechooser: (fileChooser: FileChooser) => Promise<void> | void;
	frameattached: (frame: Frame) => Promise<void> | void;
	framedetached: (frame: Frame) => Promise<void> | void;
	framenavigated: (frame: Frame) => Promise<void> | void;
	load: () => Promise<void> | void;
	pageerror: (error: Error) => Promise<void> | void;
	popup: (page: Page) => Promise<void> | void;
	request: (request: Request) => Promise<void> | void;
	requestfailed: (request: Request) => Promise<void> | void;
	requestfinished: (request: Request) => Promise<void> | void;
	response: (response: Response) => Promise<void> | void;
	websocket: (websocket: WebSocket) => Promise<void> | void;
	worker: (worker: Worker) => Promise<void> | void;
};

/**
 * Information about a browser tab
 */
interface TabInfo extends BrowserTabInfo {
	pageId: number;
	url: string;
	title: string;
}

/**
 * Browser session information
 */
interface SessionState {
	cachedState: {
		selectorMap: Record<number, DOMElementNode>;
	};
}

interface SecurityService {
	getBrowserContextConfig: () => { bypassCSP: boolean; ignoreHTTPSErrors: boolean };
	getCookieOptions: () => { secure: boolean; httpOnly: boolean; sameSite: 'Strict' | 'Lax' | 'None' };
}

/**
 * Browser context with enhanced capabilities
 */
export class BrowserContext {
	private readonly contextId: string;
	private readonly config: BrowserContextConfig;
	private browser: Browser;
	private context: PlaywrightContext | null = null;
	private currentPage: Page | null = null;
	private domService: DOMService | null = null;
	private session: SessionState = {
		cachedState: {
			selectorMap: {}
		}
	};
	private requestInterceptors: RequestInterceptor[] = [];
	private responseInterceptors: ResponseInterceptor[] = [];
	private eventHandlers: Partial<Record<PageEventType, PageEventHandler[keyof PageEventHandler][]>> = {};
	private securityService: SecurityService;
	private currentState: BrowserState | null = null;
	private isInitialized = false;
	private isClosing = false;

	constructor(browser: Browser, config: Partial<BrowserContextConfig> = {}) {
		this.contextId = uuidv4();
		logger.debug(`Initializing new browser context with id: ${this.contextId}`);
		this.config = {
			...DEFAULT_CONFIG,
			...config
		};
		this.browser = browser;

		// Initialize security service
		this.securityService = {
			getBrowserContextConfig: () => ({
				bypassCSP: false,
				ignoreHTTPSErrors: false
			}),
			getCookieOptions: () => ({
				secure: true,
				httpOnly: true,
				sameSite: 'Strict' as const
			})
		};
	}

	/**
	 * Async context manager entry
	 */
	async enter(): Promise<this> {
		await this._initializeSession();
		return this;
	}

	/**
	 * Async context manager exit
	 */
	async exit(error?: Error): Promise<void> {
		await this.close();
	}

	/**
	 * Initialize the browser session
	 */
	private async _initializeSession(): Promise<BrowserSession> {
		if (this.isInitialized) {
			return this.session as BrowserSession;
		}

		logger.debug('Initializing browser context');

		const playwrightBrowser = await this.browser.getPlaywrightBrowser();
		const context = await this._createContext(playwrightBrowser);
		const page = await context.newPage();

		// Create initial empty state
		const initialState: BrowserState = {
			url: page.url(),
			title: await page.title(),
			tabs: [],
			domTree: {
				tagName: 'root',
				isVisible: true,
				xpath: '',
				attributes: {},
				children: []
			},
			clickableElements: [],
			selectorMap: {},
			screenshot: undefined
		};

		this.context = context;
		this.currentPage = page;
		this.session = {
			cachedState: {
				selectorMap: {}
			}
		};
		this.currentState = initialState;

		// Add page event listener
		await this._addNewPageListener(context);

		this.isInitialized = true;
		return {
			context,
			state: initialState,
			tabs: await this.getTabs(),
			cachedState: this.session.cachedState
		};
	}

	/**
	 * Get the current session
	 */
	async getSession(): Promise<BrowserSession> {
		if (!this.isInitialized) {
			return this._initializeSession();
		}

		const state = this.currentState || {
			url: this.currentPage?.url(),
			title: await this.currentPage?.title(),
			selectorMap: this.session.cachedState.selectorMap
		};

		return {
			context: this.context as PlaywrightContext,
			state,
			tabs: await this.getTabs(),
			cachedState: this.session.cachedState
		};
	}

	/**
	 * Close the browser context and clean up resources
	 */
	public async close(): Promise<void> {
		if (this.isClosing) {
			return;
		}

		this.isClosing = true;
		logger.debug('Closing browser context');

		try {
			if (!this.isInitialized) {
				return;
			}

			await this.saveCookies();

			if (this.config.tracePath && this.context) {
				try {
					await this.context.tracing.stop({
						path: path.join(this.config.tracePath, `${this.contextId}.zip`)
					});
				} catch (error) {
					logger.debug(`Failed to stop tracing: ${error}`);
				}
			}

			if (this.currentPage) {
				try {
					await this.currentPage.close();
				} catch (error) {
					logger.debug(`Failed to close page: ${error}`);
				}
				this.currentPage = null;
			}

			if (this.context) {
				try {
					await this.context.close();
				} catch (error) {
					logger.debug(`Failed to close context: ${error}`);
				}
				this.context = null;
			}

			this.domService = null;
			this.currentState = null;
			this.session = {
				cachedState: {
					selectorMap: {}
				}
			};
			this.isInitialized = false;
		} catch (error) {
			logger.error('Error closing browser context:', error);
		} finally {
			this.isClosing = false;
		}
	}

	/**
	 * Cleanup when object is destroyed
	 */
	async cleanup(): Promise<void> {
		if (this.isInitialized && !this.isClosing) {
			logger.debug('BrowserContext was not properly closed before destruction');
			try {
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
			} catch (error) {
				logger.warning(`Failed to force close browser context: ${error}`);
			}
		}
	}

	/**
	 * Get all pages in the context
	 */
	public get pages(): Array<[number, Page]> {
		return this.context?.pages().map((page, index) => [index, page]) || [];
	}

	/**
	 * Get the DOM service
	 */
	private async getDOMService(): Promise<DOMService> {
		if (!this.domService) {
			const page = await this.getPage();
			this.domService = new DOMService(page);
		}
		return this.domService;
	}

	/**
	 * Initialize the browser context
	 */
	private async init(): Promise<void> {
		if (this.context) return;

		const playwrightBrowser = await this.browser.getPlaywrightBrowser();

		// Create context with configuration
		this.context = await this.createContext(playwrightBrowser);

		// Load cookies if file exists
		if (this.config.cookiesFile) {
			try {
				const cookieData = await fs.readFile(this.config.cookiesFile, "utf-8");
				const cookies = JSON.parse(cookieData);
				await this.context.addCookies(cookies);
			} catch (error) {
				logger.warn("Failed to load cookies:", error);
			}
		}

		// Start tracing if path provided
		if (this.config.tracePath && this.context) {
				await this.context.tracing.start({
					screenshots: true,
					snapshots: true,
					sources: true
				});
			}
	}

	/**
	 * Create a browser context
	 */
	private async createContext(browser: PlaywrightBrowser): Promise<PlaywrightContext> {
		const browserConfig = await this.browser.getConfig();
		if (browserConfig.chromeInstancePath && browser.contexts().length > 0) {
			// Connect to existing Chrome instance instead of creating new one
			return browser.contexts()[0];
		}

		// Get security configuration
		const securityConfig = this.securityService.getBrowserContextConfig();

		// Create new context with security settings
		const context = await browser.newContext({
			viewport: this.config.browserWindowSize,
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
			javaScriptEnabled: true,
			bypassCSP: securityConfig.bypassCSP,
			ignoreHTTPSErrors: securityConfig.ignoreHTTPSErrors,
			recordVideo: this.config.saveRecordingPath ? { dir: this.config.saveRecordingPath } : undefined
		});

		if (this.config.tracePath) {
			await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
		}

		// Load cookies if they exist
		if (this.config.cookiesFile) {
			try {
				const cookieData = await fs.readFile(this.config.cookiesFile, 'utf-8');
				const cookies = JSON.parse(cookieData) as Cookie[];
				logger.info(`Loaded ${cookies.length} cookies from ${this.config.cookiesFile}`);

				// Apply cookie security options
				const cookieOptions = this.securityService.getCookieOptions();
				const securedCookies = cookies.map(cookie => ({
					...cookie,
					secure: cookieOptions.secure,
					httpOnly: cookieOptions.httpOnly,
					sameSite: cookieOptions.sameSite
				}));

				await context.addCookies(securedCookies);
			} catch (error) {
				logger.warn(`Failed to load cookies: ${error}`);
			}
		}

		// Add anti-detection scripts
		await context.addInitScript(`
			// Webdriver property
			Object.defineProperty(navigator, 'webdriver', {
				get: () => undefined
			});

			// Languages
			Object.defineProperty(navigator, 'languages', {
				get: () => ['en-US', 'en']
			});

			// Plugins
			Object.defineProperty(navigator, 'plugins', {
				get: () => [1, 2, 3, 4, 5]
			});

			// Chrome runtime
			window.chrome = { runtime: {} };

			// Permissions
			const originalQuery = window.navigator.permissions.query;
			window.navigator.permissions.query = (parameters) => (
				parameters.name === 'notifications' ?
					Promise.resolve({ state: Notification.permission }) :
					originalQuery(parameters)
			);
		`);

		return context;
	}

	/**
	 * Save current cookies to file
	 */
	private async saveCookies(): Promise<void> {
		if (this.context && this.config.cookiesFile) {
			try {
				const cookies = await this.context.cookies();
				logger.info(`Saving ${cookies.length} cookies to ${this.config.cookiesFile}`);

				// Apply cookie security options
				const cookieOptions = this.securityService.getCookieOptions();
				const securedCookies = cookies.map(cookie => ({
					...cookie,
					secure: cookieOptions.secure,
					httpOnly: cookieOptions.httpOnly,
					sameSite: cookieOptions.sameSite
				}));

				// Create directory if it doesn't exist
				const cookieDir = path.dirname(this.config.cookiesFile);
				if (cookieDir) {
					await mkdir(cookieDir, { recursive: true });
				}

				await fs.writeFile(
					this.config.cookiesFile,
					JSON.stringify(securedCookies, null, 2),
					'utf-8'
				);
			} catch (error) {
				logger.warn(`Failed to save cookies: ${error}`);
			}
		}
	}

	/**
	 * Get the current state of the browser
	 * @param useVision Whether to include a screenshot in the state
	 */
	public async getState(useVision = false): Promise<BrowserState> {
		await this.waitForPageLoad();
		await this.getSession(); // Ensure session is initialized
		const state = await this.updateState(useVision);

		// Save cookies if a file is specified
		if (this.config.cookiesFile) {
			await this.saveCookies().catch(error =>
				logger.warn('Failed to save cookies:', error)
			);
		}

		return state;
	}

	/**
	 * Update and return state
	 * @param useVision Whether to include a screenshot in the state
	 */
	private async updateState(useVision = false): Promise<BrowserState> {
		const page = await this.getPage();

		// Check if current page is still valid, if not switch to another available page
		try {
			await page.evaluate('1');
		} catch (error) {
			logger.debug('Current page is no longer accessible:', error);
			if (this.context) {
				const pages = this.context.pages();
				if (pages.length > 0) {
					this.currentPage = pages[pages.length - 1];
					logger.debug(`Switched to page: ${await this.currentPage.title()}`);
				} else {
					throw new Error('No valid pages available');
				}
			}
		}

		try {
			await this.removeHighlights();
			const page = await this.getPage();
			const domService = new DOMService(page);
			const content = await domService.getClickableElements();

			let screenshotBase64: string | undefined;
			if (useVision) {
				const buffer = await page.screenshot({ type: 'png' });
				screenshotBase64 = buffer.toString('base64');
			}

			const state: BrowserState = {
				url: page.url(),
				title: await page.title(),
				tabs: await this.getTabs(),
				domTree: content[0], // Use first element as root
				clickableElements: content,
				selectorMap: this.session.cachedState.selectorMap,
				screenshot: screenshotBase64
			};

			this.currentState = state;
			return state;
		} catch (error) {
			logger.error('Failed to update state:', error);
			if (this.currentState) {
				return this.currentState;
			}
			throw error;
		}
	}

	/**
	 * Wait for network to become stable
	 */
	private async waitForStableNetwork(): Promise<void> {
		const page = await this.getPage();

		const pendingRequests = new Set<Request>();
		let lastActivity = Date.now() / 1000;

		// Define relevant resource types and content types
		const RELEVANT_RESOURCE_TYPES = new Set([
			'document',
			'stylesheet',
			'image',
			'font',
			'script',
			'iframe'
		]);

		const RELEVANT_CONTENT_TYPES = new Set([
			'text/html',
			'text/css',
			'application/javascript',
			'image/',
			'font/',
			'application/json'
		]);

		// Additional patterns to filter out
		const IGNORED_URL_PATTERNS = new Set([
			// Analytics and tracking
			'analytics',
			'tracking',
			'telemetry',
			'beacon',
			'metrics',
			// Ad-related
			'doubleclick',
			'adsystem',
			'adserver',
			'advertising',
			// Social media widgets
			'facebook.com/plugins',
			'platform.twitter',
			'linkedin.com/embed',
			// Live chat and support
			'livechat',
			'zendesk',
			'intercom',
			'crisp.chat',
			'hotjar',
			// Push notifications
			'push-notifications',
			'onesignal',
			'pushwoosh',
			// Background sync/heartbeat
			'heartbeat',
			'ping',
			'alive',
			// WebRTC and streaming
			'webrtc',
			'rtmp://',
			'wss://',
			// Common CDNs for dynamic content
			'cloudfront.net',
			'fastly.net'
		]);

		const onRequest = async (request: Request) => {
			// Filter by resource type
			if (!RELEVANT_RESOURCE_TYPES.has(request.resourceType())) {
				return;
			}

			// Filter out streaming, websocket, and other real-time requests
			if (['websocket', 'media', 'eventsource', 'manifest', 'other'].includes(request.resourceType())) {
				return;
			}

			// Filter out by URL patterns
			const url = request.url().toLowerCase();
			if ([...IGNORED_URL_PATTERNS].some(pattern => url.includes(pattern))) {
				return;
			}

			// Filter out data URLs and blob URLs
			if (url.startsWith('data:') || url.startsWith('blob:')) {
				return;
			}

			// Filter out requests with certain headers
			const headers = request.headers();
			if (headers['purpose'] === 'prefetch' || headers['sec-fetch-dest'] === 'video' || headers['sec-fetch-dest'] === 'audio') {
				return;
			}

			pendingRequests.add(request);
			lastActivity = Date.now() / 1000;
			logger.debug(`Request started: ${request.url()} (${request.resourceType()})`);
		};

		const onResponse = async (response: Response) => {
			const request = response.request();
			if (!pendingRequests.has(request)) {
				return;
			}

			// Filter by content type if available
			const contentType = response.headers()['content-type']?.toLowerCase() || '';

			// Skip if content type indicates streaming or real-time data
			if ([
				'streaming',
				'video',
				'audio',
				'webm',
				'mp4',
				'event-stream',
				'websocket',
				'protobuf'
			].some(t => contentType.includes(t))) {
				pendingRequests.delete(request);
				return;
			}

			// Only process relevant content types
			if (![...RELEVANT_CONTENT_TYPES].some(ct => contentType.includes(ct))) {
				pendingRequests.delete(request);
				return;
			}

			// Skip if response is too large (likely not essential for page load)
			const contentLength = response.headers()['content-length'];
			if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB
				pendingRequests.delete(request);
				return;
			}

			pendingRequests.delete(request);
			lastActivity = Date.now() / 1000;
			logger.debug(`Request resolved: ${request.url()} (${contentType})`);
		};

		// Attach event listeners
		page.on('request', onRequest);
		page.on('response', onResponse);

		try {
			// Wait for idle time
			const startTime = Date.now() / 1000;
			while (true) {
				await new Promise(resolve => setTimeout(resolve, 100));
				const now = Date.now() / 1000;
				if (
					pendingRequests.size === 0 &&
					(now - lastActivity) >= (this.config.waitForNetworkIdlePageLoadTime || 1.0)
				) {
					break;
				}
				if (now - startTime > (this.config.maximumWaitPageLoadTime || 5.0)) {
					logger.debug(
						`Network timeout after ${this.config.maximumWaitPageLoadTime}s with ${pendingRequests.size} ` +
							`pending requests: ${[...pendingRequests].map(r => r.url())}`
					);
					break;
				}
			}
		} finally {
			// Clean up event listeners
			page.removeListener('request', onRequest);
			page.removeListener('response', onResponse);
		}

		logger.debug(
			`Network stabilized for ${this.config.waitForNetworkIdlePageLoadTime} seconds`
		);
	}

	/**
	 * Wait for page load with network idle detection
	 * @param timeoutOverwrite Optional timeout override in seconds
	 */
	private async waitForPageLoad(timeoutOverwrite?: number): Promise<void> {
		const startTime = Date.now() / 1000;

		try {
			await this.waitForStableNetwork();
		} catch (error) {
			logger.warning('Page load failed, continuing...', error);
		}

		// Calculate remaining time to meet minimum wait time
		const elapsed = Date.now() / 1000 - startTime;
		const remaining = Math.max(
			(timeoutOverwrite ?? this.config.minimumWaitPageLoadTime || 0.5) - elapsed,
			0
		);

		logger.debug(
			`--Page loaded in ${elapsed.toFixed(2)} seconds, waiting for additional ${remaining.toFixed(2)} seconds`
		);

		// Sleep remaining time if needed
		if (remaining > 0) {
			await new Promise(resolve => setTimeout(resolve, remaining * 1000));
		}
	}

	/**
	 * Get the browser state history
	 */
	async getStateHistory(): Promise<BrowserStateHistory> {
		if (!this.currentPage) {
			throw new Error("No active page");
		}

		const [url, title] = await Promise.all([
			this.currentPage.url(),
			this.currentPage.title()
		]);

		const tabs = await this.getTabs();
		const screenshot = await this.getScreenshot();

		return {
			url,
			title,
			tabs,
			interactedElement: null,
			screenshot,
			toDict: () => ({
				url,
				title,
				tabs,
				interacted_element: null,
				screenshot
			})
		};
	}

	/**
	 * Get the config
	 */
	public getConfig(): BrowserContextConfig {
		return this.config;
	}

	private async getTabs(): Promise<TabInfo[]> {
		const tabs: TabInfo[] = [];
		for (const [id, page] of this.pages) {
			tabs.push({
				url: page.url(),
				title: await page.title(),
				pageId: id
			});
		}
		return tabs;
	}

	private async getScreenshot(): Promise<string | undefined> {
		if (!this.currentPage || !this.config.saveScreenshots) {
			return undefined;
		}

		const buffer = await this.currentPage.screenshot({ type: 'png' });
		return buffer.toString('base64');
	}

	/**
	 * Navigate to a URL
	 */
	public async navigateTo(url: string): Promise<void> {
		const page = await this.getPage();
		await page.goto(url);
		await this.waitForPageLoad();
	}

	/**
	 * Refresh the current page
	 */
	public async refreshPage(): Promise<void> {
		const page = await this.getPage();
		await page.reload();
		await this.waitForPageLoad();
	}

	/**
	 * Navigate back in history
	 */
	public async goBack(): Promise<void> {
		const page = await this.getPage();
		await page.goBack();
		await this.waitForPageLoad();
	}

	/**
	 * Navigate forward in history
	 */
	public async goForward(): Promise<void> {
		const page = await this.getPage();
		await page.goForward();
		await this.waitForPageLoad();
	}

	/**
	 * Switch to a specific tab
	 */
	async switchToTab(index: number): Promise<void> {
		if (!this.context) throw new Error("Browser context not initialized");

		const pages = this.context.pages();
		if (index >= 0 && index < pages.length) {
			this.currentPage = pages[index];
			await this.currentPage.bringToFront();
		} else {
			throw new Error(`Invalid tab index: ${index}`);
		}
	}

	/**
	 * Create a new tab
	 */
	async createNewTab(url?: string): Promise<void> {
		if (!this.context) throw new Error("Browser context not initialized");

		this.currentPage = await this.context.newPage();
		if (url) {
			await this.currentPage.goto(url);
			await this.waitForPageLoad();
		}
	}

	/**
	 * Check if element or its children are file uploaders
	 * @param elementNode The element to check
	 * @param maxDepth Maximum depth to check children
	 * @param currentDepth Current depth in recursion
	 */
	public async isFileUploader(
		elementNode: DOMElementNode,
		maxDepth = 3,
		currentDepth = 0
	): Promise<boolean> {
		if (currentDepth > maxDepth) {
			return false;
		}

		// Check current element
		let isUploader = false;

		if (elementNode.tagName === 'input') {
			isUploader = (
				elementNode.attributes.type === 'file' ||
				elementNode.attributes.accept !== undefined
			);
		}

		if (isUploader) {
			return true;
		}

		// Recursively check children
		if (elementNode.children && currentDepth < maxDepth) {
			for (const child of elementNode.children) {
				if ('tagName' in child) {
					if (await this.isFileUploader(child as DOMElementNode, maxDepth, currentDepth + 1)) {
						return true;
					}
				}
			}
		}

		return false;
	}

	/**
	 * Close the current tab
	 */
	public async closeCurrentTab(): Promise<void> {
		const context = await this.getContext();
		if (!context) throw new Error('Browser context not initialized');

		const page = await this.getPage();

		// Get all pages before closing
		const pages = context.pages();
		const currentIndex = pages.indexOf(page);

		// Close the current page
		await page.close();

		// Update active page
		if (pages.length > 1) {
			// Switch to the next tab if available, otherwise previous
			const newIndex = currentIndex < pages.length - 1 ? currentIndex : currentIndex - 1;
			this.currentPage = pages[newIndex];
			await this.currentPage.bringToFront();
		} else {
			// If this was the last tab, create a new blank tab
			this.currentPage = await context.newPage();
		}

		// Clear any cached state
		this.session = {
			...this.session!,
			cachedState: {
				selectorMap: {}
			}
		};
	}

	/**
	 * Get the current page HTML content with error handling
	 */
	public async getPageHtml(options: {
		timeout?: number;
		waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
	} = {}): Promise<string> {
		const page = await this.getPage();
		const { timeout = 30000, waitUntil = 'networkidle' } = options;

		try {
			// Wait for page to be in desired state
			await page.waitForLoadState(waitUntil, { timeout });

			// Get the HTML content
			const content = await page.content();
			if (!content) {
				throw new Error('Failed to get page content: Empty response');
			}

			return content;
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes('timeout')) {
					throw new Error(`Timeout (${timeout}ms) reached while waiting for page content`);
				}
				throw new Error(`Failed to get page content: ${error.message}`);
			}
			throw error;
		}
	}

	/**
	 * Execute JavaScript code on the page with proper error handling and timeout
	 */
	public async executeJavaScript<T>(
		script: string,
		options: {
			timeout?: number;
			args?: any[];
			returnByValue?: boolean;
		} = {}
	): Promise<T> {
		const page = await this.getPage();
		const { timeout = 30000, args = [], returnByValue = true } = options;

		try {
			// Create a promise that will reject after timeout
			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(() => {
					reject(new Error(`Script execution timed out after ${timeout}ms`));
				}, timeout);
			});

			// Create the evaluation promise
			const evaluationPromise = page.evaluate<T, any[]>(
				(script, ...args) => {
					try {
						// Use Function constructor to create a function from the script
						const scriptFn = new Function('...args', script);
						return scriptFn(...args);
					} catch (error) {
						if (error instanceof Error) {
							throw new Error(`Script execution failed: ${error.message}`);
						}
						throw error;
					}
				},
				script,
				...args
			);

			// Race between timeout and evaluation
			const result = await Promise.race([evaluationPromise, timeoutPromise]);

			// Validate result type if specified in generic parameter
			if (returnByValue) {
				try {
					// Attempt to serialize the result to validate it
					JSON.stringify(result);
				} catch (error) {
					throw new Error('Script result cannot be serialized');
				}
			}

			return result;
		} catch (error) {
			if (error instanceof Error) {
				// Enhance error message with more context
				if (error.message.includes('Script execution failed')) {
					throw error;
				}
				throw new Error(`Failed to execute JavaScript: ${error.message}`);
			}
			throw error;
		}
	}

	/**
	 * Get element by index with retry logic for stale elements
	 */
	public async getElementByIndex(index: number): Promise<ElementHandle<Element> | null> {
		if (typeof index !== 'number' || index < 0) {
			throw new Error(`Invalid element index: ${index}`);
		}

		const selectorMap = this.session.cachedState.selectorMap;
		if (!selectorMap[index]) {
			throw new Error(`No element found at index: ${index}`);
		}

		// Add retry logic for stale elements
		const maxRetries = 3;
		let retryCount = 0;
		let lastError: Error | undefined;

		while (retryCount < maxRetries) {
			try {
				const element = await this.getLocateElement(selectorMap[index]);
				if (element) {
					// Verify element is still attached to DOM
					await element.evaluate((node: Element) => node.isConnected)
						.catch(() => { throw new Error('Element is detached from DOM'); });
					return element;
				}
				return null;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error('Unknown error');
				retryCount++;
				if (retryCount < maxRetries) {
					await new Promise(resolve => setTimeout(resolve, 100));
					// Refresh selector map if needed
					const session = await this.getSession();
					if (session.state.url === await this.currentPage?.url()) {
						selectorMap[index] = session.cachedState.selectorMap[index];
					}
				}
			}
		}

		throw new Error(`Failed to get element at index ${index} after ${maxRetries} retries. Last error: ${lastError?.message}`);
	}

	/**
	 * Get DOM element by index with validation
	 */
	public async getDomElementByIndex(index: number): Promise<DOMElementNode | null> {
		if (typeof index !== 'number' || index < 0) {
			throw new Error(`Invalid element index: ${index}`);
		}

		const session = await this.getSession();
		const element = session.cachedState.selectorMap[index];

		if (!element) {
			return null;
		}

		try {
			const page = await this.getPage();
			// Validate element still exists in DOM
			const exists = await page.evaluate((xpath: string) => {
				const result = document.evaluate(
					xpath,
					document,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
				return !!result.singleNodeValue;
			}, element.xpath);

			if (!exists) {
				// Remove from selector map if element no longer exists
				delete this.session.cachedState.selectorMap[index];
				return null;
			}

			return element;
		} catch (error) {
			logger.warn(`Error validating element at index ${index}:`, error);
			return null;
		}
	}

	/**
	 * Convert simple XPath to CSS selector when possible
	 */
	private _convertSimpleXPathToCssSelector(xpath: string): string | null {
		try {
			// Handle simple XPath patterns
			const idMatch = xpath.match(/\/\/*\[@id='([^']*)']/);
			if (idMatch?.[1]) return `#${CSS.escape(idMatch[1])}`;

			const classMatch = xpath.match(/\/\/*\[@class='([^']*)']/);
			if (classMatch?.[1]) return `.${classMatch[1].split(/\s+/).map(c => CSS.escape(c)).join('.')}`;

			const tagMatch = xpath.match(/\/\/(\w+)$/);
			if (tagMatch?.[1]) return tagMatch[1].toLowerCase();

			const attrMatch = xpath.match(/\/\/*\[@([^=]+)='([^']*)']/);
			if (attrMatch?.[1] && attrMatch?.[2]) return `[${CSS.escape(attrMatch[1])}="${CSS.escape(attrMatch[2])}"]`;

			// Return null for complex XPath that can't be converted
			return null;
		} catch (error) {
			logger.warn('Error converting XPath to CSS:', error);
			return null;
		}
	}

	/**
	 * Enhanced CSS selector for element with shadow DOM support
	 */
	private _enhancedCssSelectorForElement(element: DOMElementNode): string {
		try {
			const safeAttributes = new Set([
				'id', 'class', 'name', 'type', 'value', 'title',
				'alt', 'role', 'data-testid', 'aria-label', 'part'
			]);

			let cssSelector = element.tagName.toLowerCase();
			let specificity = 0;

			// Add ID if present (highest specificity)
			if (element.attributes.id) {
				cssSelector += `#${CSS.escape(element.attributes.id)}`;
				specificity = 100;
				return cssSelector; // ID is unique enough
			}

			// Add classes if present
			const classes = element.attributes.class?.split(/\s+/).filter(Boolean);
			if (classes?.length) {
				cssSelector += classes.map(c => `.${CSS.escape(c)}`).join('');
				specificity += classes.length * 10;
			}

			// Add other attributes based on specificity
			const attributeEntries = Object.entries(element.attributes)
				.filter(([attr]) => safeAttributes.has(attr) && attr !== 'class')
				.sort(([a], [b]) => {
					const aPriority = ['name', 'data-testid', 'role'].includes(a) ? 1 : 0;
					const bPriority = ['name', 'data-testid', 'role'].includes(b) ? 1 : 0;
					return bPriority - aPriority;
				});

			for (const [attribute, value] of attributeEntries) {
				if (!value.trim()) continue;

				const safeAttribute = attribute.replace(':', '\\:');
				if (value === '') {
					cssSelector += `[${safeAttribute}]`;
				} else if (/["'<>`]/.test(value)) {
					const safeValue = value.replace(/"/g, '\\"');
					cssSelector += `[${safeAttribute}*="${safeValue}"]`;
				} else {
					cssSelector += `[${safeAttribute}="${value}"]`;
				}
				specificity += 1;

				// Break if we have enough specificity
				if (specificity >= 20) break;
			}

			// Add structural selectors if needed
			if (specificity < 10 && element.parent) {
				const siblings = element.parent.children.filter(
					child => child.tagName === element.tagName
				);
				if (siblings.length > 1) {
					const index = siblings.indexOf(element) + 1;
					cssSelector += `:nth-of-type(${index})`;
				}
			}

			return cssSelector;
		} catch (error) {
			// Fallback to a basic selector with highlight index
			console.warn('Error creating enhanced selector:', error);
			return `[highlight_index="${element.highlightIndex}"]`;
		}
	}

	/**
	 * Get element handle with enhanced location strategy
	 */
	public async getLocateElement(element: DOMElementNode): Promise<ElementHandle | null> {
		const page = await this.getPage();
		const currentFrame: Page | FrameLocator = page;

		try {
			// Try XPath first if available
			if (element.xpath) {
				const simpleSelector = this._convertSimpleXPathToCssSelector(element.xpath);
				if (simpleSelector) {
					const elementHandle = await page.$(simpleSelector);
					if (elementHandle) {
						await elementHandle.scrollIntoViewIfNeeded();
						return elementHandle;
					}
				}

				// Fallback to XPath if CSS selector fails
				const elementHandle = await page.$(`xpath=${element.xpath}`);
				if (elementHandle) {
					await elementHandle.scrollIntoViewIfNeeded();
					return elementHandle;
				}
			}

			// Build parent chain for shadow DOM traversal
			const parents: DOMElementNode[] = [];
			let current = element;
			while (current.parent) {
				parents.push(current.parent);
				current = current.parent;
			}
			parents.reverse();

			// Handle shadow DOM and iframe traversal
			let context: ElementHandle | Page = page;
			for (const parent of parents) {
				const parentSelector = this._enhancedCssSelectorForElement(parent);

				if (parent.tagName === 'IFRAME') {
					const frameElement = await context.$(parentSelector);
					if (!frameElement) break;

					const frame = await frameElement.contentFrame();
					if (!frame) break;

					context = frame;
				} else {
					const element = await context.$(parentSelector);
					if (!element) break;

					// Check for shadow root
					const shadowRoot = await element.evaluateHandle(el => el.shadowRoot);
					if (shadowRoot.asElement()) {
						context = shadowRoot.asElement()!;
					} else {
						context = element;
					}
				}
			}

			// Find the target element
			const targetSelector = this._enhancedCssSelectorForElement(element);
			const elementHandle = await context.$(targetSelector);

			if (elementHandle) {
				await elementHandle.scrollIntoViewIfNeeded()
					.catch(() => console.warn('Could not scroll element into view'));
				return elementHandle;
			}

			return null;
		} catch (error) {
			console.error('Error locating element:', error);
			return null;
		}
	}

	/**
	 * Take a screenshot of the current page or element
	 * @param options Screenshot options
	 * @returns Path to the saved screenshot
	 */
	public async takeScreenshot(options: {
		element?: DOMElementNode;
		fullPage?: boolean;
		path?: string;
	} = {}): Promise<string> {
		const page = await this.getPage();
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = options.path || `screenshot-${timestamp}.png`;
		const directory = dirname(filename);

		// Ensure directory exists
		await mkdir(directory, { recursive: true });

		if (options.element) {
			const elementHandle = await this.getLocateElement(options.element);
			if (!elementHandle) {
				throw new Error('Element not found for screenshot');
			}
			await elementHandle.screenshot({ path: filename });
		} else {
			await page.screenshot({
				path: filename,
				fullPage: options.fullPage ?? false
			});
		}

		return filename;
	}

	/**
	 * Take a screenshot of a specific element by index
	 * @param index Element index in the selector map
	 * @param path Optional path to save the screenshot
	 * @returns Path to the saved screenshot
	 */
	public async takeElementScreenshot(index: number, path?: string): Promise<string> {
		const element = await this.getDomElementByIndex(index);
		if (!element) {
			throw new Error(`Element with index ${index} not found`);
		}
		return this.takeScreenshot({ element, path });
	}

	/**
	 * Take a full page screenshot
	 * @param path Optional path to save the screenshot
	 * @returns Path to the saved screenshot
	 */
	public async takeFullPageScreenshot(path?: string): Promise<string> {
		return this.takeScreenshot({ fullPage: true, path });
	}

	/**
	 * Validate cookie format
	 */
	private _validateCookie(cookie: Cookie): void {
		if (!cookie.name || typeof cookie.name !== 'string') {
			throw new Error('Cookie must have a valid name string');
		}

		if (cookie.value && typeof cookie.value !== 'string') {
			throw new Error('Cookie value must be a string');
		}

		if (cookie.url && !this._isValidUrl(cookie.url)) {
			throw new Error('Cookie URL must be a valid URL string');
		}

		if (cookie.domain && !this._isValidDomain(cookie.domain)) {
			throw new Error('Cookie domain must be a valid domain string');
		}

		if (cookie.path && typeof cookie.path !== 'string') {
			throw new Error('Cookie path must be a string');
		}

		if (cookie.expires && typeof cookie.expires !== 'number') {
			throw new Error('Cookie expires must be a number');
		}

		if (cookie.httpOnly !== undefined && typeof cookie.httpOnly !== 'boolean') {
			throw new Error('Cookie httpOnly must be a boolean');
		}

		if (cookie.secure !== undefined && typeof cookie.secure !== 'boolean') {
			throw new Error('Cookie secure must be a boolean');
		}

		if (cookie.sameSite && !['Strict', 'Lax', 'None'].includes(cookie.sameSite)) {
			throw new Error('Cookie sameSite must be one of: Strict, Lax, None');
		}
	}

	/**
	 * Validate URL format
	 */
	private _isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Validate domain format
	 */
	private _isValidDomain(domain: string): boolean {
		const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
		return domainRegex.test(domain);
	}

	/**
	 * Get all cookies for the current context
	 */
	public async getCookies(): Promise<Cookie[]> {
		try {
			const context = await this.getContext();
			if (!context) {
				throw new Error('Browser context not initialized');
			}
			return context.cookies();
		} catch (error) {
			throw new Error(`Failed to get cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get cookies for a specific URL
	 */
	public async getCookiesForUrl(url: string): Promise<Cookie[]> {
		if (!this._isValidUrl(url)) {
			throw new Error('Invalid URL provided');
		}

		try {
			const context = await this.getContext();
			if (!context) {
				throw new Error('Browser context not initialized');
			}
			return context.cookies(url);
		} catch (error) {
			throw new Error(`Failed to get cookies for URL ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Set cookies for the current context
	 */
	public async setCookies(cookies: Cookie[]): Promise<void> {
		if (!Array.isArray(cookies)) {
			throw new Error('Cookies must be provided as an array');
		}

		try {
			// Validate all cookies before setting any
			for (const cookie of cookies) {
				this._validateCookie(cookie);
			}

			const context = await this.getContext();
			if (!context) {
				throw new Error('Browser context not initialized');
			}

			await context.addCookies(cookies);
		} catch (error) {
			throw new Error(`Failed to set cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Clear all cookies from the current context
	 */
	public async clearCookies(): Promise<void> {
		try {
			const context = await this.getContext();
			if (!context) {
				throw new Error('Browser context not initialized');
			}
			await context.clearCookies();
		} catch (error) {
			throw new Error(`Failed to clear cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Delete specific cookies by name
	 */
	public async deleteCookies(names: string[]): Promise<void> {
		if (!Array.isArray(names)) {
			throw new Error('Cookie names must be provided as an array');
		}

		if (names.some(name => typeof name !== 'string')) {
			throw new Error('All cookie names must be strings');
		}

		try {
			const context = await this.getContext();
			if (!context) {
				throw new Error('Browser context not initialized');
			}

			const currentCookies = await context.cookies();
			const remainingCookies = currentCookies.filter(cookie => !names.includes(cookie.name));

			await context.clearCookies();
			if (remainingCookies.length > 0) {
				await context.addCookies(remainingCookies);
			}
		} catch (error) {
			throw new Error(`Failed to delete cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Export cookies to a JSON string
	 */
	public async exportCookies(): Promise<string> {
		try {
			const cookies = await this.getCookies();
			return JSON.stringify(cookies, null, 2);
		} catch (error) {
			throw new Error(`Failed to export cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Import cookies from a JSON string
	 */
	public async importCookies(cookiesJson: string): Promise<void> {
		if (typeof cookiesJson !== 'string') {
			throw new Error('Cookie JSON must be a string');
		}

		try {
			const cookies = JSON.parse(cookiesJson) as Cookie[];
			if (!Array.isArray(cookies)) {
				throw new Error('Invalid cookie JSON format');
			}

			await this.setCookies(cookies);
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new Error('Invalid JSON format');
			}
			throw new Error(`Failed to import cookies: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Start intercepting network requests
	 */
	public async startRequestInterception(options: {
		timeout?: number;
		ignoreErrors?: boolean;
	} = {}): Promise<void> {
		const { timeout = 30000, ignoreErrors = false } = options;
		const page = await this.getPage();

		try {
			await page.route('**/*', async (route, request) => {
				const startTime = Date.now();

				try {
					for (const interceptor of this.requestInterceptors) {
						const url = request.url();
						const pattern = interceptor.urlPattern;

						const matches = typeof pattern === 'string'
							? url.includes(pattern)
							: pattern.test(url);

						if (matches) {
							// Check for timeout
							if (Date.now() - startTime > timeout) {
								throw new Error(`Request interceptor timeout after ${timeout}ms`);
							}

							await interceptor.handler(route, request);
							return;
						}
					}

					await route.continue();
				} catch (error) {
					if (!ignoreErrors) {
						console.error('Request interception error:', error);
						if (error instanceof Error && error.message.includes('timeout')) {
							await route.abort('timedout');
						} else {
							await route.abort('failed');
						}
					} else {
						await route.continue();
					}
				}
			});
		} catch (error) {
			throw new Error(`Failed to start request interception: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Add a request interceptor with validation
	 */
	public addRequestInterceptor(interceptor: RequestInterceptor): void {
		if (!interceptor.urlPattern) {
			throw new Error('Request interceptor must have a urlPattern');
		}

		if (typeof interceptor.urlPattern !== 'string' && !(interceptor.urlPattern instanceof RegExp)) {
			throw new Error('urlPattern must be a string or RegExp');
		}

		if (typeof interceptor.handler !== 'function') {
			throw new Error('Request interceptor must have a handler function');
		}

		this.requestInterceptors.push(interceptor);
	}

	/**
	 * Remove a request interceptor
	 */
	public removeRequestInterceptor(urlPattern: string | RegExp): void {
		const initialLength = this.requestInterceptors.length;
		this.requestInterceptors = this.requestInterceptors.filter(
			i => i.urlPattern.toString() !== urlPattern.toString()
		);

		if (this.requestInterceptors.length === initialLength) {
			console.warn('No request interceptor found with the specified pattern:', urlPattern);
		}
	}

	/**
	 * Clear all request interceptors
	 */
	public clearRequestInterceptors(): void {
		const count = this.requestInterceptors.length;
		this.requestInterceptors = [];
		console.debug(`Cleared ${count} request interceptor(s)`);
	}

	/**
	 * Start intercepting network responses
	 */
	public async startResponseInterception(options: {
		timeout?: number;
		ignoreErrors?: boolean;
	} = {}): Promise<void> {
		const { timeout = 30000, ignoreErrors = false } = options;
		const page = await this.getPage();

		try {
			page.on('response', async (response) => {
				const startTime = Date.now();

				try {
					for (const interceptor of this.responseInterceptors) {
						const url = response.url();
						const pattern = interceptor.urlPattern;

						const matches = typeof pattern === 'string'
							? url.includes(pattern)
							: pattern.test(url);

						if (matches) {
							// Check for timeout
							if (Date.now() - startTime > timeout) {
								throw new Error(`Response interceptor timeout after ${timeout}ms`);
							}

							await interceptor.handler(response);
						}
					}
				} catch (error) {
					if (!ignoreErrors) {
						console.error('Response interception error:', error);
					}
				}
			});
		} catch (error) {
			throw new Error(`Failed to start response interception: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Add a response interceptor with validation
	 */
	public addResponseInterceptor(interceptor: ResponseInterceptor): void {
		if (!interceptor.urlPattern) {
			throw new Error('Response interceptor must have a urlPattern');
		}

		if (typeof interceptor.urlPattern !== 'string' && !(interceptor.urlPattern instanceof RegExp)) {
			throw new Error('urlPattern must be a string or RegExp');
		}

		if (typeof interceptor.handler !== 'function') {
			throw new Error('Response interceptor must have a handler function');
		}

		this.responseInterceptors.push(interceptor);
	}

	/**
	 * Remove a response interceptor
	 */
	public removeResponseInterceptor(urlPattern: string | RegExp): void {
		const initialLength = this.responseInterceptors.length;
		this.responseInterceptors = this.responseInterceptors.filter(
			i => i.urlPattern.toString() !== urlPattern.toString()
		);

		if (this.responseInterceptors.length === initialLength) {
			console.warn('No response interceptor found with the specified pattern:', urlPattern);
		}
	}

	/**
	 * Clear all response interceptors
	 */
	public clearResponseInterceptors(): void {
		const count = this.responseInterceptors.length;
		this.responseInterceptors = [];
		console.debug(`Cleared ${count} response interceptor(s)`);
	}

	/**
	 * Block requests matching a URL pattern
	 */
	public async blockRequests(urlPattern: string | RegExp): Promise<void> {
		if (!urlPattern) {
			throw new Error('URL pattern is required');
		}

		this.addRequestInterceptor({
			urlPattern,
			handler: async (route) => {
				try {
					await route.abort();
				} catch (error) {
					console.error(`Failed to block request: ${error instanceof Error ? error.message : 'Unknown error'}`);
					await route.continue();
				}
			}
		});
	}

	/**
	 * Mock a response for requests matching a URL pattern
	 */
	public async mockResponse(urlPattern: string | RegExp, response: {
		status?: number;
		headers?: Record<string, string>;
		body?: string;
	}): Promise<void> {
		if (!urlPattern) {
			throw new Error('URL pattern is required');
		}

		if (response.status && (typeof response.status !== 'number' || response.status < 100 || response.status > 599)) {
			throw new Error('Invalid status code');
		}

		if (response.headers && typeof response.headers !== 'object') {
			throw new Error('Headers must be an object');
		}

		this.addRequestInterceptor({
			urlPattern,
			handler: async (route) => {
				try {
					await route.fulfill({
						status: response.status ?? 200,
						headers: response.headers ?? {},
						body: response.body ?? ''
					});
				} catch (error) {
					console.error(`Failed to mock response: ${error instanceof Error ? error.message : 'Unknown error'}`);
					await route.continue();
				}
			}
		});
	}

	/**
	 * Add an event listener for a specific page event with error handling
	 */
	public async addEventListener<T extends PageEventType>(
		eventType: T,
		handler: PageEventHandler[T],
		options: {
			timeout?: number;
			once?: boolean;
		} = {}
	): Promise<void> {
		const { timeout = 30000, once = false } = options;
		const page = await this.getPage();

		try {
			if (!this.eventHandlers[eventType]) {
				this.eventHandlers[eventType] = [];

				// Create wrapper function to handle timeouts and errors
				const wrapperFn = async (...args: Parameters<PageEventHandler[T]>) => {
					const handlers = this.eventHandlers[eventType] || [];
					for (const handler of handlers) {
						try {
							const timeoutPromise = new Promise<never>((_, reject) => {
								setTimeout(() => reject(new Error(`Event handler timeout after ${timeout}ms`)), timeout);
							});

							const handlerPromise = Promise.resolve((handler as PageEventHandler[T])(...args));
							await Promise.race([handlerPromise, timeoutPromise]);

							if (once) {
								this.removeEventListener(eventType, handler as PageEventHandler[T]);
							}
						} catch (error) {
							logger.error(`Error in ${eventType} event handler:`, error);
							if (once) {
								this.removeEventListener(eventType, handler as PageEventHandler[T]);
							}
						}
					}
				};

				// Store wrapper function for cleanup
				const pageWithWrappers = page as Page & { __eventWrappers?: Record<string, Function> };
				pageWithWrappers.__eventWrappers = pageWithWrappers.__eventWrappers || {};
				pageWithWrappers.__eventWrappers[eventType] = wrapperFn;

				page.on(eventType, wrapperFn);
			}

			this.eventHandlers[eventType]?.push(handler);
		} catch (error) {
			throw new Error(`Failed to add event listener: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Remove an event listener for a specific page event
	 */
	public removeEventListener<T extends PageEventType>(
		eventType: T,
		handler: PageEventHandler[T]
	): void {
		const handlers = this.eventHandlers[eventType];
		if (handlers) {
			const index = handlers.indexOf(handler);
			if (index !== -1) {
				handlers.splice(index, 1);

				// Remove event listener from page if no handlers left
				if (handlers.length === 0) {
					this.removeAllEventListeners(eventType);
				}
			} else {
				console.warn(`No handler found for event type: ${eventType}`);
			}
		}
	}

	/**
	 * Remove all event listeners for a specific event type
	 */
	public async removeAllEventListeners(eventType: PageEventType): Promise<void> {
		try {
			const page = await this.getPage();
			const pageWithWrappers = page as Page & { __eventWrappers?: Record<string, Function> };
			const wrapper = pageWithWrappers.__eventWrappers?.[eventType];

			if (wrapper) {
				page.removeListener(eventType, wrapper);
				delete pageWithWrappers.__eventWrappers?.[eventType];
			}

			this.eventHandlers[eventType] = [];
		} catch (error) {
			console.error(`Error removing event listeners for ${eventType}:`, error);
		}
	}

	/**
	 * Clear all event listeners
	 */
	public async clearAllEventListeners(): Promise<void> {
		try {
			const page = await this.getPage();
			const pageWithWrappers = page as Page & { __eventWrappers?: Record<string, Function> };

			// Remove all event listeners from page
			for (const eventType of Object.keys(this.eventHandlers) as PageEventType[]) {
				const wrapper = pageWithWrappers.__eventWrappers?.[eventType];
				if (wrapper) {
					page.removeListener(eventType, wrapper);
				}
			}

			// Clear stored wrappers
			if (pageWithWrappers.__eventWrappers) {
				pageWithWrappers.__eventWrappers = {};
			}

			// Clear handler arrays
			this.eventHandlers = {};
		} catch (error) {
			console.error('Error clearing event listeners:', error);
		}
	}

	/**
	 * Add a console message listener with error handling
	 */
	public async onConsole(handler: PageEventHandler['console']): Promise<void> {
		await this.addEventListener('console', handler, {
			timeout: 5000, // Console events should be handled quickly
			once: false
		});
	}

	/**
	 * Add a dialog listener with error handling
	 */
	public async onDialog(handler: PageEventHandler['dialog']): Promise<void> {
		await this.addEventListener('dialog', handler, {
			timeout: 30000, // Dialogs might need user interaction
			once: false
		});
	}

	/**
	 * Add a download listener with error handling
	 */
	public async onDownload(handler: PageEventHandler['download']): Promise<void> {
		await this.addEventListener('download', handler, {
			timeout: 60000, // Downloads might take longer
			once: false
		});
	}

	/**
	 * Add a file chooser listener with error handling
	 */
	public async onFileChooser(handler: PageEventHandler['filechooser']): Promise<void> {
		await this.addEventListener('filechooser', handler, {
			timeout: 30000,
			once: false
		});
	}

	/**
	 * Add a page error listener with error handling
	 */
	public async onPageError(handler: PageEventHandler['pageerror']): Promise<void> {
		await this.addEventListener('pageerror', handler, {
			timeout: 5000, // Error handlers should be quick
			once: false
		});
	}

	/**
	 * Add a popup listener with error handling
	 */
	public async onPopup(handler: PageEventHandler['popup']): Promise<void> {
		await this.addEventListener('popup', handler, {
			timeout: 30000,
			once: false
		});
	}

	/**
	 * Add a WebSocket listener with error handling
	 */
	public async onWebSocket(handler: PageEventHandler['websocket']): Promise<void> {
		await this.addEventListener('websocket', handler, {
			timeout: 30000,
			once: false
		});
	}

	/**
	 * Add a worker listener with error handling
	 */
	public async onWorker(handler: PageEventHandler['worker']): Promise<void> {
		await this.addEventListener('worker', handler, {
			timeout: 30000,
			once: false
		});
	}

	/**
	 * Get the browser context
	 */
	private async getContext(): Promise<PlaywrightContext | null> {
		if (!this.context) {
			await this.init();
		}
		return this.context;
	}
}
