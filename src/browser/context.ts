/**
 * Browser context with enhanced capabilities.
 */

import type { Page, BrowserContext as PlaywrightContext, ElementHandle, FrameLocator, Cookie, Request, Route, Response, ConsoleMessage, Dialog, FileChooser, WebSocket, Worker } from "playwright";
import type { Browser } from "./browser";
import type { BrowserSession, BrowserState, BrowserStateHistory, TabInfo } from "./types";
import type { DOMElementNode } from "../dom/types";
import type { BrowserContextConfig } from "./config";
import { DOMService } from "../dom/service";
import { writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { v4 as uuidv4 } from 'uuid';

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
	frameattached: (frame: any) => Promise<void> | void;
	framedetached: (frame: any) => Promise<void> | void;
	framenavigated: (frame: any) => Promise<void> | void;
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
 * Browser context with enhanced capabilities
 */
export class BrowserContext {
	private readonly contextId: string;
	private readonly config: BrowserContextConfig;
	private browser: Browser;
	private context: PlaywrightContext | null = null;
	private activePage: Page | null = null;
	private domService: DOMService | null = null;
	private session: BrowserSession = {
		cachedState: {
			selectorMap: {}
		}
	};
	private requestInterceptors: RequestInterceptor[] = [];
	private responseInterceptors: ResponseInterceptor[] = [];
	private eventHandlers: Partial<Record<PageEventType, PageEventHandler[keyof PageEventHandler][]>> = {};

	constructor(browser: Browser, config: Partial<BrowserContextConfig> = {}) {
		this.contextId = uuidv4();
		this.config = {
			...DEFAULT_CONFIG,
			...config
		};
		this.browser = browser;
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
		this.context = await playwrightBrowser.newContext({
			viewport: this.config.noViewport ? null : this.config.browserWindowSize,
			recordVideo: this.config.saveRecordingPath ? {
				dir: this.config.saveRecordingPath
			} : undefined,
			ignoreHTTPSErrors: this.config.disableSecurity,
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
			javaScriptEnabled: true,
			bypassCSP: this.config.disableSecurity
		});

		// Add anti-detection scripts
		await this.context.addInitScript(`
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

		// Load cookies if file exists
		if (this.config.cookiesFile) {
			try {
				const fs = await import("node:fs/promises");
				const cookies = JSON.parse(
					await fs.readFile(this.config.cookiesFile, "utf-8")
				);
				await this.context.addCookies(cookies);
			} catch (error) {
				console.warn("Failed to load cookies:", error);
			}
		}

		// Start tracing if path provided
		if (this.config.tracePath) {
			await this.context.tracing.start({
				screenshots: true,
				snapshots: true,
				sources: true
			});
		}
	}

	/**
	 * Click on an element node
	 */
	public async clickElementNode(elementNode: DOMElementNode): Promise<void> {
		const page = await this.getPage();
		const element = await page.locator(elementNode.xpath);
		await element.click();
	}

	/**
	 * Input text into an element node
	 */
	public async inputTextElementNode(elementNode: DOMElementNode, text: string): Promise<void> {
		const page = await this.getPage();
		const element = await page.locator(elementNode.xpath);
		await element.fill(text);
	}

	/**
	 * Remove highlights from the page
	 */
	public async removeHighlights(): Promise<void> {
		const page = await this.getPage();
		await page.evaluate(() => {
			const highlights = document.querySelectorAll('.highlight-element');
			for (const el of Array.from(highlights)) {
				el.remove();
			}
		});
	}

	/**
	 * Get the active page
	 */
	async getPage(): Promise<Page> {
		if (!this.context) {
			await this.init();
		}

		if (!this.activePage) {
			this.activePage = await this.context.newPage();
		}

		return this.activePage;
	}

	/**
	 * Close the browser context
	 */
	async close(): Promise<void> {
		console.debug('Closing browser context');

		try {
			// Check if already closed
			if (!this.context) {
				return;
			}

			// Save cookies if file specified
			if (this.config.cookiesFile) {
				await this.saveCookies();
			}

			// Stop tracing if enabled
			if (this.config.tracePath) {
				try {
					await this.context.tracing.stop({
						path: path.join(this.config.tracePath, `${this.contextId}.zip`)
					});
				} catch (error) {
					console.debug(`Failed to stop tracing: ${error}`);
				}
			}

			// Clear all event listeners
			await this.clearAllEventListeners();

			// Remove DOM highlights
			await this.removeHighlights();

			// Close all pages
			for (const [_, page] of this.pages) {
				try {
					await page.close();
				} catch (error) {
					console.debug(`Failed to close page: ${error}`);
				}
			}

			// Close context
			try {
				await this.context.close();
			} catch (error) {
				console.debug(`Failed to close context: ${error}`);
			}
		} finally {
			// Clear references
			this.context = null;
			this.activePage = null;
			this.domService = null;
			this.session = {
				cachedState: {
					selectorMap: {}
				}
			};
			this.requestInterceptors = [];
			this.responseInterceptors = [];
			this.eventHandlers = {};
		}
	}

	/**
	 * Save current cookies to file
	 */
	private async saveCookies(): Promise<void> {
		if (!this.context || !this.config.cookiesFile) return;

		try {
			const cookies = await this.context.cookies();
			await mkdir(dirname(this.config.cookiesFile), { recursive: true });
			await writeFile(
				this.config.cookiesFile,
				JSON.stringify(cookies, null, 2)
			);
		} catch (error) {
			console.warn("Failed to save cookies:", error);
		}
	}

	/**
	 * Get the current session
	 */
	async getSession(): Promise<BrowserSession> {
		return this.session;
	}

	/**
	 * Get the current state of the browser
	 */
	async getState(): Promise<BrowserState> {
		const domService = await this.getDOMService();
		const state = await domService.getState();
		const [url, title] = await Promise.all([
			this.activePage.url(),
			this.activePage.title()
		]);

		const tabs = await this.getTabs();
		const screenshot = await this.getScreenshot();

		return {
			url,
			title,
			tabs,
			domTree: state.elementTree,
			clickableElements: state.elementTree.children.filter(child =>
				'isInteractive' in child && child.isInteractive
			) as DOMElementNode[],
			selectorMap: state.selectorMap,
			screenshot
		};
	}

	/**
	 * Get the browser state history
	 */
	async getStateHistory(): Promise<BrowserStateHistory> {
		if (!this.activePage) {
			throw new Error("No active page");
		}

		const [url, title] = await Promise.all([
			this.activePage.url(),
			this.activePage.title()
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
		if (!this.activePage || !this.config.saveScreenshots) {
			return undefined;
		}

		const buffer = await this.activePage.screenshot({ type: 'png' });
		return buffer.toString('base64');
	}

	/**
	 * Wait for page to load
	 */
	private async waitForPageLoad(): Promise<void> {
		const page = await this.getPage();

		// Wait minimum time
		await page.waitForTimeout(this.config.minimumWaitPageLoadTime * 1000);

		try {
			// Wait for network idle
			await page.waitForLoadState("networkidle", {
				timeout: this.config.waitForNetworkIdlePageLoadTime * 1000
			});
		} catch {
			// Ignore timeout
		}

		// Wait between actions
		await page.waitForTimeout(this.config.waitBetweenActions * 1000);
	}

	/**
	 * Switch to a specific tab
	 */
	async switchToTab(index: number): Promise<void> {
		if (!this.context) throw new Error("Browser context not initialized");

		const pages = this.context.pages();
		if (index >= 0 && index < pages.length) {
			this.activePage = pages[index];
			await this.activePage.bringToFront();
		} else {
			throw new Error(`Invalid tab index: ${index}`);
		}
	}

	/**
	 * Create a new tab
	 */
	async createNewTab(url?: string): Promise<void> {
		if (!this.context) throw new Error("Browser context not initialized");

		this.activePage = await this.context.newPage();
		if (url) {
			await this.activePage.goto(url);
			await this.waitForPageLoad();
		}
	}

	/**
	 * Check if element is a file uploader
	 */
	async isFileUploader(elementNode: DOMElementNode): Promise<boolean> {
		return elementNode.tagName.toLowerCase() === "input" &&
			(elementNode.attributes.type === "file" ||
				elementNode.attributes.accept !== undefined);
	}

	/**
	 * Navigate forward in history
	 */
	public async goForward(): Promise<void> {
		const page = await this.getPage();

		// Navigate forward
		await page.goForward();

		// Wait for minimum load time
		await page.waitForTimeout(this.config.minimumWaitPageLoadTime * 1000);

		try {
			// Wait for network idle
			await page.waitForLoadState("networkidle", {
				timeout: this.config.waitForNetworkIdlePageLoadTime * 1000
			});
		} catch (error) {
			console.warn('Network idle timeout reached:', error);
		}

		// Wait for all frames to load
		const frames = page.frames();
		await Promise.all(
			frames.map(frame =>
				frame.waitForLoadState('load')
					.catch(error => console.warn(`Frame load error: ${error}`))
			)
		);

		// Wait between actions
		await page.waitForTimeout(this.config.waitBetweenActions * 1000);
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
			this.activePage = pages[newIndex];
			await this.activePage.bringToFront();
		} else {
			// If this was the last tab, create a new blank tab
			this.activePage = await context.newPage();
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
	public async getElementByIndex(index: number): Promise<ElementHandle | null> {
		if (typeof index !== 'number' || index < 0) {
			throw new Error(`Invalid element index: ${index}`);
		}

		const selectorMap = (await this.getSession()).cachedState.selectorMap;
		if (!selectorMap[index]) {
			throw new Error(`No element found at index: ${index}`);
		}

		// Add retry logic for stale elements
		const maxRetries = 3;
		let retryCount = 0;
		let lastError: Error | null = null;

		while (retryCount < maxRetries) {
			try {
				const element = await this.getLocateElement(selectorMap[index]);
				if (element) {
					// Verify element is still attached to DOM
					await element.evaluate(node => node.isConnected)
						.catch(() => { throw new Error('Element is detached from DOM'); });
					return element;
				}
				return null;
			} catch (error) {
				lastError = error as Error;
				retryCount++;
				if (retryCount < maxRetries) {
					await new Promise(resolve => setTimeout(resolve, 100));
					// Refresh selector map if needed
					const session = await this.getSession();
					if (session.cachedState.selectorMap[index]) {
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
			// Validate element still exists in DOM
			const exists = await this.page.evaluate((xpath) => {
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
				delete session.cachedState.selectorMap[index];
				return null;
			}

			return element;
		} catch (error) {
			console.warn(`Error validating element at index ${index}:`, error);
			return null;
		}
	}

	/**
	 * Convert simple XPath to CSS selector when possible
	 */
	private _convertSimpleXPathToCssSelector(xpath: string): string | null {
		// Handle simple XPath patterns
		const idMatch = xpath.match(/\/\/*[@id='([^']*)']$/);
		if (idMatch) return `#${CSS.escape(idMatch[1])}`;

		const classMatch = xpath.match(/\/\/*[@class='([^']*)']$/);
		if (classMatch) return `.${classMatch[1].split(/\s+/).map(c => CSS.escape(c)).join('.')}`;

		const tagMatch = xpath.match(/\/\/(\w+)$/);
		if (tagMatch) return tagMatch[1].toLowerCase();

		const attrMatch = xpath.match(/\/\/*\[@([^=]+)='([^']*)']$/);
		if (attrMatch) return `[${CSS.escape(attrMatch[1])}="${CSS.escape(attrMatch[2])}"]`;

		// Return null for complex XPath that can't be converted
		return null;
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
		let currentFrame: Page | FrameLocator = page;

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
				const wrapperFn = async (...args: any[]) => {
					const handlers = this.eventHandlers[eventType] || [];
					for (const handler of handlers) {
						try {
							const timeoutPromise = new Promise<never>((_, reject) => {
								setTimeout(() => reject(new Error(`Event handler timeout after ${timeout}ms`)), timeout);
							});

							const handlerPromise = Promise.resolve(handler(...args));
							await Promise.race([handlerPromise, timeoutPromise]);

							if (once) {
								this.removeEventListener(eventType, handler);
							}
						} catch (error) {
							console.error(`Error in ${eventType} event handler:`, error);
							// Remove failed handler if it's a one-time handler
							if (once) {
								this.removeEventListener(eventType, handler);
							}
						}
					}
				};

				// Store wrapper function for cleanup
				(page as any).__eventWrappers = (page as any).__eventWrappers || {};
				(page as any).__eventWrappers[eventType] = wrapperFn;

				page.on(eventType as any, wrapperFn);
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
			const wrapper = (page as any).__eventWrappers?.[eventType];

			if (wrapper) {
				page.removeListener(eventType as any, wrapper);
				delete (page as any).__eventWrappers[eventType];
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

			// Remove all event listeners from page
			for (const eventType of Object.keys(this.eventHandlers) as PageEventType[]) {
				const wrapper = (page as any).__eventWrappers?.[eventType];
				if (wrapper) {
					page.removeListener(eventType as any, wrapper);
				}
			}

			// Clear stored wrappers
			(page as any).__eventWrappers = {};

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

	/**
	 * Wait for network to stabilize
	 */
	public async waitForStableNetwork(): Promise<void> {
		const page = await this.getPage();
		await page.waitForLoadState('networkidle', {
			timeout: this.config.waitForNetworkIdlePageLoadTime * 1000
		});
	}
}
