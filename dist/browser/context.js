"use strict";
/**
 * Browser context with enhanced capabilities.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserContext = void 0;
const defaultConfig = {
    minimumWaitPageLoadTime: 0, // No minimum wait
    waitForNetworkIdlePageLoadTime: 0.1, // Minimal network idle check
    maximumWaitPageLoadTime: 0.2, // Very short maximum wait
    waitBetweenActions: 0, // No delay between actions
    disableSecurity: true,
    browserWindowSize: {
        width: 1280,
        height: 1100,
    },
    javascript: true,
    images: false, // Keep images disabled for speed
};
/**
 * Browser context with enhanced capabilities
 */
class BrowserContext {
    constructor(browser, config = {}) {
        this.context = null;
        this.activePage = null;
        this.session = {
            cachedState: {
                selectorMap: {},
            },
        };
        this.config = { ...defaultConfig, ...config };
        this.browser = browser;
        // Initialize immediately without waiting
        void this.init();
    }
    /**
     * Initialize the browser context
     */
    async init() {
        if (this.context)
            return;
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
            await this.context.route("**/*.{png,jpg,jpeg,gif,webp}", (route) => route.abort());
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
    }
    async optimizeContext() {
        if (!this.context)
            return;
        // Set aggressive timeouts
        this.context.setDefaultNavigationTimeout(2000); // 2 seconds max
        this.context.setDefaultTimeout(1000); // 1 second max
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
    async getPage() {
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
    async close() {
        if (this.context) {
            await this.context.close();
            this.context = null;
            this.activePage = null;
        }
    }
    /**
     * Input text into an element
     */
    async inputText(elementNode, text) {
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
        }
        catch (error) {
            throw new Error(`Failed to input text: ${error.message}`);
        }
    }
    /**
     * Click an element
     */
    async clickElement(elementNode) {
        const page = await this.getPage();
        const element = await this.locateElement(elementNode);
        if (!element) {
            throw new Error(`Element not found: ${JSON.stringify(elementNode)}`);
        }
        try {
            // Wait for element to be ready
            await element.waitFor({ state: 'visible', timeout: 5000 });
            await element.scrollIntoViewIfNeeded();
            // Click strategies
            const strategies = [
                // Normal click
                async () => {
                    await element.click({ timeout: 5000 });
                },
                // JavaScript click via evaluate
                async () => {
                    const elementHandle = await element.elementHandle();
                    if (elementHandle) {
                        await page.evaluate(`
							(element) => {
								try {
									// Try native click first
									element.click();
								} catch {
									// Fallback to event dispatch
									const event = new MouseEvent('click', {
										bubbles: true,
										cancelable: true,
										view: window
									});
									element.dispatchEvent(event);
								}
							}
						`, elementHandle);
                    }
                },
                // Mouse click at coordinates
                async () => {
                    const box = await element.boundingBox();
                    if (box) {
                        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                    }
                }
            ];
            let lastError;
            for (const strategy of strategies) {
                try {
                    await strategy();
                    await page.waitForTimeout(100);
                    return;
                }
                catch (e) {
                    lastError = e;
                }
            }
            if (lastError) {
                throw lastError;
            }
        }
        catch (error) {
            throw new Error(`Failed to click element: ${error.message}`);
        }
    }
    /**
     * Locate an element on the page
     */
    async locateElement(elementNode) {
        const page = await this.getPage();
        const strategies = [
            async () => {
                const text = elementNode.attributes?.text || '';
                return text ? page.getByText(text, { exact: true }) : null;
            },
            async () => {
                const role = elementNode.attributes?.role || 'button';
                const text = elementNode.attributes?.text || '';
                return text ? page.getByRole(role, { name: text }) : null;
            },
            async () => {
                const tag = elementNode.tag || '';
                const placeholder = elementNode.attributes?.placeholder || '';
                return placeholder ? page.locator(`${tag}[placeholder="${placeholder}"]`) : null;
            },
            async () => {
                const locationStr = elementNode.attributes?.location;
                if (!locationStr)
                    return null;
                try {
                    // First convert to unknown, then to ElementLocation
                    const parsed = JSON.parse(locationStr);
                    const location = parsed;
                    // Validate the location object
                    if (typeof location === 'object' &&
                        location !== null &&
                        typeof location.x === 'number' &&
                        typeof location.y === 'number' &&
                        typeof location.width === 'number' &&
                        typeof location.height === 'number') {
                        return page.locator(`*:near(:root, ${location.x}, ${location.y})`);
                    }
                }
                catch {
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
            }
            catch {
                // Skip to next strategy
            }
        }
        return null;
    }
    /**
     * Navigate forward in history
     */
    async goForward() {
        const page = await this.getPage();
        await page.goForward();
        await page.waitForLoadState();
    }
    /**
     * Close the current tab
     */
    async closeCurrentTab() {
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
    async getPageHtml() {
        const page = await this.getPage();
        return page.content();
    }
    /**
     * Execute JavaScript code on the page
     */
    async executeJavaScript(script) {
        const page = await this.getPage();
        return page.evaluate(script);
    }
    /**
     * Get the current state of the browser
     */
    async getState(useVision = false) {
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
    async takeScreenshot(fullPage = false) {
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
    async removeHighlights() {
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
        }
        catch (error) {
            // Don't throw error since this is not critical functionality
            console.debug("Failed to remove highlights (this is usually ok):", error);
        }
    }
    /**
     * Save current cookies to file
     */
    async saveCookies() {
        if (this.context && this.config.cookiesFile) {
            try {
                const cookies = await this.context.cookies();
                console.info(`Saving ${cookies.length} cookies to ${this.config.cookiesFile}`);
                const fs = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
                const path = await Promise.resolve().then(() => __importStar(require("node:path")));
                // Create directory if it doesn't exist
                const dirname = path.dirname(this.config.cookiesFile);
                if (dirname) {
                    await fs.mkdir(dirname, { recursive: true });
                }
                await fs.writeFile(this.config.cookiesFile, JSON.stringify(cookies));
            }
            catch (error) {
                console.warn("Failed to save cookies:", error);
            }
        }
    }
    /**
     * Check if element is a file uploader
     */
    async isFileUploader(elementNode) {
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
    async waitForPageAndFramesLoad() {
        const page = await this.getPage();
        try {
            // Wait only for essential events in parallel
            await Promise.all([
                page.waitForLoadState('domcontentloaded'), // Don't wait for full load
                page.waitForLoadState('networkidle', {
                    timeout: 100 // Very short network idle timeout
                }).catch(() => { }) // Ignore network timeout
            ]);
        }
        catch (error) {
            // Log but continue if there are issues
            console.debug("Load state warning:", error.message);
        }
    }
    /**
     * Update and return state
     */
    async updateState(useVision = false) {
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
                            type: el.type || '',
                            href: el.href || '',
                            value: el.value || '',
                            placeholder: el.placeholder || '',
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
        }
        catch (error) {
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
    async getPages() {
        if (!this.context) {
            throw new Error("Browser context not initialized");
        }
        return this.context.pages();
    }
    /**
     * Get the current session
     */
    async getSession() {
        return this.session;
    }
    /**
     * Switch to a specific tab
     */
    async switchToTab(tabIndex) {
        const pages = this.context.pages();
        const adjustedIndex = tabIndex < 0 ? pages.length + tabIndex : tabIndex;
        if (adjustedIndex >= 0 && adjustedIndex < pages.length) {
            this.activePage = pages[adjustedIndex];
            await this.activePage.bringToFront();
        }
        else {
            throw new Error(`Invalid tab index: ${tabIndex}`);
        }
    }
    /**
     * Create a new tab
     */
    async createNewTab(url) {
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
                }).catch(() => { })
            ]);
        }
    }
}
exports.BrowserContext = BrowserContext;
