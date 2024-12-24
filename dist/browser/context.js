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
    minimumWaitPageLoadTime: 0.5,
    waitForNetworkIdlePageLoadTime: 1.0,
    maximumWaitPageLoadTime: 5.0,
    waitBetweenActions: 1.0,
    disableSecurity: false,
    browserWindowSize: {
        width: 1280,
        height: 1100,
    },
    javascript: true,
    images: true,
};
/**
 * Browser context with enhanced capabilities
 */
class BrowserContext {
    constructor(config = {}, browser) {
        this.context = null;
        this.activePage = null;
        this.session = {
            cachedState: {
                selectorMap: {},
            },
        };
        this.config = { ...defaultConfig, ...config };
        this.browser = browser;
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
        }
        return this.activePage;
    }
    /**
     * Initialize the browser context
     */
    async init() {
        const playwrightBrowser = await this.browser.getPlaywrightBrowser();
        this.context = await playwrightBrowser.newContext({
            javaScriptEnabled: this.config.javascript,
            viewport: this.config.viewport,
            deviceScaleFactor: this.config.deviceScaleFactor,
            isMobile: this.config.isMobile,
            hasTouch: this.config.hasTouch,
            locale: this.config.locale,
            timezoneId: this.config.timezoneId,
            geolocation: this.config.geolocation,
            permissions: this.config.permissions,
            httpCredentials: this.config.httpCredentials,
            ignoreHTTPSErrors: this.config.ignoreHttpsErrors,
            offline: this.config.offline,
            colorScheme: this.config.colorScheme,
            userAgent: this.config.userAgent,
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
            await element.scrollIntoViewIfNeeded({ timeout: 2500 });
            await element.fill("");
            await element.type(text);
            await page.waitForLoadState();
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
        try {
            const element = await this.locateElement(elementNode);
            if (!element) {
                throw new Error(`Element not found: ${JSON.stringify(elementNode)}`);
            }
            try {
                await element.click({ timeout: 1500 });
                await page.waitForLoadState();
            }
            catch (error) {
                // Fallback to JavaScript click
                try {
                    await page.evaluate("(el) => el.click()", element);
                    await page.waitForLoadState();
                }
                catch (jsError) {
                    throw new Error(`Failed to click element: ${jsError.message}`);
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to click element: ${error.message}`);
        }
    }
    /**
     * Locate an element in the page
     */
    async locateElement(elementNode) {
        const page = await this.getPage();
        if (elementNode.xpath) {
            return page.locator(`xpath=${elementNode.xpath}`).first();
        }
        if (elementNode.selector) {
            return page.locator(elementNode.selector).first();
        }
        throw new Error("No valid selector found for element");
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
                const fs = await Promise.resolve().then(() => __importStar(require("fs/promises")));
                const path = await Promise.resolve().then(() => __importStar(require("path")));
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
    async isFileUploader(elementNode, maxDepth = 3) {
        const checkElement = (el, depth = 0) => {
            if (depth > maxDepth)
                return false;
            // Check current element
            if (el.tag === "input") {
                const isUploader = el.attributes["type"] === "file" ||
                    el.attributes["accept"] !== undefined;
                if (isUploader)
                    return true;
            }
            // Check children
            if (el.children && depth < maxDepth) {
                for (const child of el.children) {
                    if (checkElement(child, depth + 1)) {
                        return true;
                    }
                }
            }
            return false;
        };
        return checkElement(elementNode);
    }
    /**
     * Wait for page and frames to load
     */
    async waitForPageAndFramesLoad() {
        const page = await this.getPage();
        // Wait for minimum time
        await new Promise((resolve) => setTimeout(resolve, this.config.minimumWaitPageLoadTime * 1000));
        try {
            // Wait for network idle
            await page.waitForLoadState("networkidle", {
                timeout: this.config.waitForNetworkIdlePageLoadTime * 1000,
            });
        }
        catch (error) {
            console.debug("Network idle timeout:", error);
        }
        // Wait for maximum time if needed
        if (this.config.maximumWaitPageLoadTime > this.config.minimumWaitPageLoadTime) {
            const remainingTime = this.config.maximumWaitPageLoadTime -
                this.config.minimumWaitPageLoadTime;
            await new Promise((resolve) => setTimeout(resolve, remainingTime * 1000));
        }
    }
    /**
     * Update and return state
     */
    async updateState(useVision = false) {
        const page = await this.getPage();
        try {
            await this.removeHighlights();
            // TODO: Implement DOMService to get clickable elements
            const content = ""; // await domService.getClickableElements();
            let screenshot;
            if (useVision) {
                screenshot = await this.takeScreenshot();
            }
            return {
                url: page.url(),
                title: await page.title(),
                content,
                screenshot,
            };
        }
        catch (error) {
            console.error("Failed to update state:", error);
            throw error;
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
    async switchToTab(index) {
        if (!this.context) {
            throw new Error("Browser context not initialized");
        }
        const pages = this.context.pages();
        if (index < 0) {
            index = pages.length + index;
        }
        if (index >= 0 && index < pages.length) {
            this.activePage = pages[index];
            await this.activePage.bringToFront();
        }
        else {
            throw new Error(`Invalid tab index: ${index}`);
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
            await this.activePage.goto(url);
            await this.activePage.waitForLoadState();
        }
    }
}
exports.BrowserContext = BrowserContext;
