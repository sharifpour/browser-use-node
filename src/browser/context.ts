/**
 * Browser context with enhanced capabilities.
 */

import type { Locator, Page, BrowserContext as PlaywrightContext } from "playwright";
import type { Browser } from "./browser";
import type { BrowserSession, BrowserState, DOMElement } from "./types";
import { writeFile } from 'node:fs/promises';
import { createGif } from '../utils/gif';

interface ElementLocation {
	x: number;
	y: number;
	width: number;
	height: number;
}

type AriaRole =
	| "button"
	| "link"
	| "menuitem"
	| "menuitemcheckbox"
	| "menuitemradio"
	| "option"
	| "radio"
	| "switch"
	| "tab"
	| "treeitem";

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
	 * @default 1.0
	 */
	minimumWaitPageLoadTime?: number;

	/**
	 * Time to wait for network requests to finish before getting page state
	 * @default 3.0
	 */
	waitForNetworkIdlePageLoadTime?: number;

	/**
	 * Maximum time to wait for page load before proceeding anyway
	 * @default 10.0
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
	 * Default browser window size
	 */
	browserWindowSize?: {
		width: number;
		height: number;
	};

	/**
	 * Disable viewport
	 * @default false
	 */
	noViewport?: boolean;

	/**
	 * Path to save video recordings
	 */
	saveRecordingPath?: string;

	/**
	 * Path to save trace files
	 */
	tracePath?: string;

	/**
	 * Whether to enable JavaScript
	 * @default true
	 */
	javascript?: boolean;

	/**
	 * Whether to enable images
	 * @default true
	 */
	images?: boolean;

	/**
	 * User agent string
	 */
	userAgent?: string;

	/**
	 * Viewport size
	 */
	viewport?: {
		width: number;
		height: number;
	};

	/**
	 * Device scale factor
	 */
	deviceScaleFactor?: number;

	/**
	 * Whether the meta viewport tag is taken into account
	 */
	isMobile?: boolean;

	/**
	 * Whether to emulate touch events
	 */
	hasTouch?: boolean;

	/**
	 * Browser locale
	 */
	locale?: string;

	/**
	 * Browser timezone
	 */
	timezoneId?: string;

	/**
	 * Browser geolocation
	 */
	geolocation?: {
		latitude: number;
		longitude: number;
		accuracy?: number;
	};

	/**
	 * Browser permissions
	 */
	permissions?: string[];

	/**
	 * HTTP credentials
	 */
	httpCredentials?: {
		username: string;
		password: string;
	};

	/**
	 * Whether to ignore HTTPS errors
	 */
	ignoreHttpsErrors?: boolean;

	/**
	 * Whether to enable offline mode
	 */
	offline?: boolean;

	/**
	 * Color scheme
	 */
	colorScheme?: "light" | "dark" | "no-preference";

	/**
	 * Whether to record a walkthrough GIF
	 * @default false
	 */
	recordWalkthrough?: boolean;

	/**
	 * Path to save the walkthrough GIF
	 * @default './walkthrough.gif'
	 */
	walkthroughPath?: string;

	/**
	 * Frame delay for walkthrough GIF (ms)
	 * @default 1000
	 */
	walkthroughDelay?: number;
}

const defaultConfig: BrowserContextConfig = {
	minimumWaitPageLoadTime: 0,           // No minimum wait
	waitForNetworkIdlePageLoadTime: 0.1,  // Minimal network idle check
	maximumWaitPageLoadTime: 0.2,         // Very short maximum wait
	waitBetweenActions: 0,                // No delay between actions
	disableSecurity: true,
	browserWindowSize: {
		width: 1280,
		height: 1100,
	},
	javascript: true,
	images: false,  // Keep images disabled for speed
};

/**
 * Browser context with enhanced capabilities
 */
export class BrowserContext {
	private config: BrowserContextConfig;
	private browser: Browser;
	protected context: PlaywrightContext | null = null;
	private activePage: Page | null = null;
	private session: BrowserSession = {
		cachedState: {
			selectorMap: {},
		},
	};
	private screenshots: Buffer[] = [];

	constructor(browser: Browser, config: Partial<BrowserContextConfig> = {}) {
		this.config = {
			...defaultConfig,
			recordWalkthrough: false,
			walkthroughPath: './walkthrough.gif',
			walkthroughDelay: 1000,
			...config
		};
		this.browser = browser;

		// Set longer default timeouts
		if (this.context) {
			this.context.setDefaultNavigationTimeout(10000);  // 10 seconds
			this.context.setDefaultTimeout(5000);            // 5 seconds
		}

		void this.init();
	}

	/**
	 * Initialize the browser context
	 */
	private async init(): Promise<void> {
		if (this.context) return;

		const playwrightBrowser = await this.browser.getPlaywrightBrowser();

		// Create context with minimal settings
		this.context = await playwrightBrowser.newContext({
			viewport: this.config.viewport || this.config.browserWindowSize,
			userAgent: this.config.userAgent,
			deviceScaleFactor: this.config.deviceScaleFactor,
			isMobile: this.config.isMobile,
			hasTouch: this.config.hasTouch,
			javaScriptEnabled: this.config.javascript,
			bypassCSP: true,
			ignoreHTTPSErrors: this.config.ignoreHttpsErrors,
			locale: this.config.locale,
			timezoneId: this.config.timezoneId,
			geolocation: this.config.geolocation,
				permissions: this.config.permissions,
				httpCredentials: this.config.httpCredentials,
				offline: this.config.offline,
				colorScheme: this.config.colorScheme,
				// Speed up context creation
				serviceWorkers: 'block',
		});

		// Configure route handler for images if needed
		if (!this.config.images) {
			await this.context.route("**/*.{png,jpg,jpeg,gif,webp}", (route) =>
				route.abort(),
			);
		}

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

		// Optimize context after creation
		await this.optimizeContext();

		// Capture initial frame if recording enabled
		if (this.config.recordWalkthrough) {
			const page = await this.getPage();
			await page.waitForTimeout(500);
			await this.captureFrame();
		}
	}

	private async optimizeContext(): Promise<void> {
		if (!this.context) return;

		// Set aggressive timeouts
		this.context.setDefaultNavigationTimeout(2000);  // 2 seconds max
		this.context.setDefaultTimeout(1000);           // 1 second max

		// Block all unnecessary resources immediately and in parallel
		await Promise.all([
			this.context.route('**/*.{png,jpg,jpeg,gif,svg,ico,css,scss,less}', route => route.abort()),
			this.context.route('**/*.{woff,woff2,ttf,otf,eot}', route => route.abort()),
			this.context.route('**/analytics.js', route => route.abort()),
			this.context.route('**/gtag.js', route => route.abort()),
			this.context.route('**/ga.js', route => route.abort()),
			this.context.route('**/adsbygoogle.js', route => route.abort()),
			// Add more resource blocking in parallel
			this.context.route('**/*metrics*', route => route.abort()),
			this.context.route('**/*tracking*', route => route.abort()),
			this.context.route('**/*telemetry*', route => route.abort()),
		]);
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
			// Set aggressive page-level timeouts
			await this.activePage.setDefaultTimeout(1000);
			await this.activePage.setDefaultNavigationTimeout(2000);
		}

		return this.activePage;
	}

	/**
	 * Close the browser context
	 */
	async close(): Promise<void> {
		try {
			// Save walkthrough with timeout
			await Promise.race([
				this.saveWalkthrough(),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Walkthrough save timed out')), 120000)
				)
			]);
		} catch (error) {
			console.warn('Error during walkthrough save:', error);
		} finally {
			// Always clean up
			this.screenshots = [];
			if (this.context) {
				await this.context.close();
				this.context = null;
				this.activePage = null;
			}
		}
	}

	/**
	 * Input text into an element
	 */
	async inputText(elementNode: DOMElement, text: string): Promise<void> {
		const page = await this.getPage();

		try {
			await this.captureFrame(); // Before
			await this.doInputText(elementNode, text);
			await page.waitForTimeout(500); // Wait for visual changes
			await this.captureFrame(); // After
		} catch (error) {
			console.warn('Failed to capture input text frames:', error);
			throw error;
		}
	}

	/**
	 * Click an element
	 */
	async clickElement(elementNode: DOMElement): Promise<void> {
		const page = await this.getPage();

		try {
			await this.captureFrame(); // Before
			await this.doClickElement(elementNode);
			await page.waitForTimeout(500); // Wait for visual changes
			await this.captureFrame(); // After
		} catch (error) {
			console.warn('Failed to capture click frames:', error);
			throw error;
		}
	}

	/**
	 * Locate an element on the page
	 */
	private async locateElement(elementNode: DOMElement): Promise<Locator | null> {
		const page = await this.getPage();

		const strategies = [
			async (): Promise<Locator | null> => {
				const text = elementNode.attributes?.text || '';
				return text ? page.getByText(text, { exact: true }) : null;
			},
			async (): Promise<Locator | null> => {
				const role = elementNode.attributes?.role as AriaRole || 'button';
				const text = elementNode.attributes?.text || '';
				return text ? page.getByRole(role, { name: text }) : null;
			},
			async (): Promise<Locator | null> => {
				const tag = elementNode.tag || '';
				const placeholder = elementNode.attributes?.placeholder || '';
				return placeholder ? page.locator(`${tag}[placeholder="${placeholder}"]`) : null;
			},
			async (): Promise<Locator | null> => {
				const locationStr = elementNode.attributes?.location;
				if (!locationStr) return null;

				try {
					// First convert to unknown, then to ElementLocation
					const parsed = JSON.parse(locationStr as string) as unknown;
					const location = parsed as ElementLocation;

					// Validate the location object
					if (
						typeof location === 'object' &&
						location !== null &&
						typeof location.x === 'number' &&
						typeof location.y === 'number' &&
						typeof location.width === 'number' &&
						typeof location.height === 'number'
					) {
						return page.locator(`*:near(:root, ${location.x}, ${location.y})`);
					}
				} catch {
					// Invalid location format
				}
				return null;
			}
		];

		for (const strategy of strategies) {
			try {
				const element = await strategy();
				if (element && await element.count() > 0) {
					return element;
				}
			} catch {
				// Failed strategy, try next one
			}
		}

		return null;
	}

	/**
	 * Navigate forward in history
	 */
	async goForward(): Promise<void> {
		const page = await this.getPage();
		await page.goForward();
		await page.waitForLoadState();
	}

	/**
	 * Close the current tab
	 */
	async closeCurrentTab(): Promise<void> {
		const page = await this.getPage();
		await page.close();

		// Switch to the first available tab if any exist
		if (this.context?.pages().length) {
			await this.switchToTab(0);
		}
	}

	/**
	 * Get the current page HTML content
	 */
	async getPageHtml(): Promise<string> {
		const page = await this.getPage();
		return page.content();
	}

	/**
	 * Execute JavaScript code on the page
	 */
	async executeJavaScript<T>(script: string): Promise<T> {
		const page = await this.getPage();
		return page.evaluate(script);
	}

	/**
	 * Get the current state of the browser
	 */
	async getState(useVision = false): Promise<BrowserState> {
		await this.waitForPageAndFramesLoad();
		const state = await this.updateState(useVision);

		// Save cookies if a file is specified
		if (this.config.cookiesFile) {
			await this.saveCookies();
		}

		return state;
	}

	/**
	 * Take a screenshot of the current page
	 */
	async takeScreenshot(fullPage = false): Promise<string> {
		const page = await this.getPage();

		const screenshot = await page.screenshot({
			fullPage,
			animations: "disabled",
		});

		return Buffer.from(screenshot).toString("base64");
	}

	/**
	 * Remove highlight overlays and labels
	 */
	async removeHighlights(): Promise<void> {
		try {
			const page = await this.getPage();
			await page.evaluate(`
				try {
					// Remove the highlight container and all its contents
					const container = document.getElementById('playwright-highlight-container');
					if (container) {
						container.remove();
					}

					// Remove highlight attributes from elements
					const highlightedElements = document.querySelectorAll('[browser-user-highlight-id^="playwright-highlight-"]');
					highlightedElements.forEach(el => {
						el.removeAttribute('browser-user-highlight-id');
					});
				} catch (e) {
					console.error('Failed to remove highlights:', e);
				}
			`);
		} catch (error) {
			// Don't throw error since this is not critical functionality
			console.debug("Failed to remove highlights (this is usually ok):", error);
		}
	}

	/**
	 * Save current cookies to file
	 */
	async saveCookies(): Promise<void> {
		if (this.context && this.config.cookiesFile) {
			try {
				const cookies = await this.context.cookies();
				console.info(
					`Saving ${cookies.length} cookies to ${this.config.cookiesFile}`,
				);

				const fs = await import("node:fs/promises");
				const path = await import("node:path");

				// Create directory if it doesn't exist
				const dirname = path.dirname(this.config.cookiesFile);
				if (dirname) {
					await fs.mkdir(dirname, { recursive: true });
				}

				await fs.writeFile(this.config.cookiesFile, JSON.stringify(cookies));
			} catch (error) {
				console.warn("Failed to save cookies:", error);
			}
		}
	}

	/**
	 * Check if element is a file uploader
	 */
	public async isFileUploader(elementNode: DOMElement): Promise<boolean> {
		if (elementNode.tag === 'input') {
			return elementNode.attributes.type === 'file' ||
				elementNode.attributes.accept !== undefined;
		}

		// Check children recursively
		if (elementNode.children) {
			for (const child of elementNode.children) {
				if (await this.isFileUploader(child)) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Wait for page and frames to load
	 */
	private async waitForPageAndFramesLoad(): Promise<void> {
		const page = await this.getPage();

		try {
			// Wait only for essential events in parallel
			await Promise.all([
				page.waitForLoadState('domcontentloaded'),
				page.waitForLoadState('networkidle', {
					timeout: 100
				}).catch(() => {})
			]);

			// Capture frame after navigation if recording enabled
			if (this.config.recordWalkthrough) {
				await page.waitForTimeout(500); // Wait for visual stability
				await this.captureFrame();
			}
		} catch (error) {
			console.debug("Load state warning:", error.message);
		}
	}

	/**
	 * Update and return state
	 */
	private async updateState(useVision = false): Promise<BrowserState> {
		const page = await this.getPage();

		try {
			await this.removeHighlights();

			// Run all content extraction in parallel
			const [url, title, content, screenshot] = await Promise.all([
				page.url(),
				page.title(),
				// Extract clickable elements and text content in parallel
				page.evaluate(() => {
					const clickableElements = Array.from(document.querySelectorAll('a, button, input, select, [role="button"], [role="link"]'))
						.map(el => {
							const rect = el.getBoundingClientRect();
							return {
								tag: el.tagName.toLowerCase(),
								text: el.textContent?.trim() || '',
								type: (el as HTMLInputElement).type || '',
								href: (el as HTMLAnchorElement).href || '',
								value: (el as HTMLInputElement).value || '',
								placeholder: (el as HTMLInputElement).placeholder || '',
								isVisible: rect.width > 0 && rect.height > 0,
								location: {
									x: rect.x,
									y: rect.y,
									width: rect.width,
									height: rect.height
								}
							};
						})
						.filter(el => el.isVisible);

					// Get main content text
					const mainContent = document.body.innerText
						.split('\n')
						.map(line => line.trim())
						.filter(line => line.length > 0)
						.join('\n');

					return {
						clickableElements,
						mainContent,
						headings: Array.from(document.querySelectorAll('h1, h2, h3'))
							.map(h => h.textContent?.trim())
							.filter(Boolean)
					};
				}),
				// Take screenshot if vision is enabled
				useVision ? this.takeScreenshot() : Promise.resolve(undefined)
			]);

			return {
				url,
				title,
				content: JSON.stringify({
					clickableElements: content.clickableElements,
					mainContent: content.mainContent,
					headings: content.headings
				}),
				screenshot
			};
		} catch (error) {
			console.error("Failed to update state:", error);
			// Fallback to basic content extraction
			return {
				url: page.url(),
				title: await page.title(),
				content: await page.evaluate(() => document.body.innerText),
				screenshot: useVision ? await this.takeScreenshot() : undefined
			};
		}
	}

	/**
	 * Get all pages in the context
	 */
	async getPages(): Promise<Page[]> {
		if (!this.context) {
			throw new Error("Browser context not initialized");
		}
		return this.context.pages();
	}

	/**
	 * Get the current session
	 */
	async getSession(): Promise<BrowserSession> {
		return this.session;
	}

	/**
	 * Switch to a specific tab
	 */
	async switchToTab(tabIndex: number): Promise<void> {
		const pages = this.context.pages();
		const adjustedIndex = tabIndex < 0 ? pages.length + tabIndex : tabIndex;

		if (adjustedIndex >= 0 && adjustedIndex < pages.length) {
			this.activePage = pages[adjustedIndex];
			await this.activePage.bringToFront();
		} else {
			throw new Error(`Invalid tab index: ${tabIndex}`);
		}
	}

	/**
	 * Create a new tab
	 */
	async createNewTab(url?: string): Promise<void> {
		if (!this.context) {
			throw new Error("Browser context not initialized");
		}

		this.activePage = await this.context.newPage();
		if (url) {
			// Navigate and don't wait for full load
			await Promise.all([
				this.activePage.goto(url, {
					waitUntil: 'domcontentloaded',
					timeout: 2000
				}),
				this.activePage.waitForLoadState('networkidle', {
					timeout: 100
				}).catch(() => {})
			]);
		}
	}

	/**
	 * Capture frame
	 */
	private async captureFrame(): Promise<void> {
		if (!this.config.recordWalkthrough) return;

		try {
			const page = await this.getPage();

			// Wait for any animations to settle
			await page.waitForTimeout(100);

			console.log('Capturing frame...');
			const screenshot = await page.screenshot({
				type: 'png',
				fullPage: false,
				animations: 'disabled',
				timeout: 5000
			});

			this.screenshots.push(screenshot);
			console.log(`Screenshot captured (total: ${this.screenshots.length})`);
		} catch (error) {
			console.warn('Failed to capture frame:', error);
		}
	}

	/**
	 * Save walkthrough
	 */
	async saveWalkthrough(): Promise<void> {
		// Early return if no screenshots
		if (!this.config.recordWalkthrough || this.screenshots.length === 0) {
			console.log('No screenshots to process - skipping walkthrough creation');
			return;
		}

		try {
			console.log(`Creating GIF from ${this.screenshots.length} screenshots...`);

			// Create GIF with timeout
			const gifPromise = createGif(this.screenshots, {
				delay: this.config.walkthroughDelay,
				quality: 10,
				repeat: 0,
				timeout: 60000 // 1 minute timeout
			});

			// Add overall timeout
			const timeoutPromise = new Promise<Buffer>((_, reject) =>
				setTimeout(() => reject(new Error('Walkthrough save timed out')), 120000)
			);

			// Race between GIF creation and timeout
			const gif = await Promise.race<Buffer>([gifPromise, timeoutPromise]);

			const path = this.config.walkthroughPath;
			console.log(`Writing GIF to ${path}...`);
			await writeFile(path, gif);
			console.log(`Saved walkthrough GIF to ${path}`);

		} catch (error) {
			console.warn('Error during walkthrough save:', error);
		} finally {
			// Always clean up
			this.screenshots = [];
		}
	}

	/**
	 * Input text into an element
	 */
	private async doInputText(elementNode: DOMElement, text: string): Promise<void> {
		try {
			const page = await this.getPage();
			const element = await this.locateElement(elementNode);

			if (!element) {
				throw new Error(`Element not found: ${JSON.stringify(elementNode)}`);
			}

			// Wait for element to be ready
			await element.waitFor({ state: 'visible', timeout: 5000 });
			await element.scrollIntoViewIfNeeded();

			// Clear and type text
			await element.click();
			await page.keyboard.press('Control+A');
			await page.keyboard.press('Backspace');
			await element.type(text, { delay: 50 });

			// Handle Google search
			if (page.url().includes('google.com')) {
				await page.keyboard.press('Enter');
				await Promise.race([
					page.waitForLoadState('networkidle', { timeout: 5000 }),
					page.waitForSelector('div.g', { timeout: 5000 })
				]).catch(() => undefined);
			}
		} catch (error) {
			throw new Error(`Failed to input text: ${(error as Error).message}`);
		}
	}

	/**
	 * Click an element
	 */
	private async doClickElement(elementNode: DOMElement): Promise<void> {
		const page = await this.getPage();
		const element = await this.locateElement(elementNode);

		if (!element) {
			throw new Error(`Element not found: ${JSON.stringify(elementNode)}`);
		}

		try {
			// Increase timeout for stability
			await element.waitFor({
				state: 'visible',
				timeout: 10000  // Increase to 10 seconds
			});
			await element.scrollIntoViewIfNeeded({ timeout: 5000 });

			// Click strategies with increased timeouts
			const strategies = [
				async (): Promise<void> => {
					await element.click({
						timeout: 5000,  // Increase click timeout
						delay: 100,     // Add small delay before click
						force: true     // Force click if needed
					});
				},
				async (): Promise<void> => {
					const elementHandle = await element.elementHandle();
					if (elementHandle) {
						await page.evaluate(`
							(element) => {
								try {
									element.click();
								} catch {
									element.dispatchEvent(new MouseEvent('click', {
										bubbles: true,
										cancelable: true,
										view: window
									}));
								}
							}
						`, elementHandle);
					}
				},
				async (): Promise<void> => {
					const box = await element.boundingBox();
					if (box) {
						await page.mouse.click(
							box.x + box.width / 2,
							box.y + box.height / 2
						);
					}
				}
			];

			for (const strategy of strategies) {
				try {
					await strategy();
					// Wait longer for navigation/stability
					await page.waitForTimeout(500);
					return;
				} catch {
					// Failed strategy, try next one
				}
			}

			throw new Error('All click strategies failed');
		} catch (error) {
			throw new Error(`Failed to click element: ${(error as Error).message}`);
		}
	}
}
