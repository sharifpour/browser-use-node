"use strict";
/**
 * Playwright browser on steroids.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Browser = void 0;
const playwright_1 = require("playwright");
const context_1 = require("./context");
const defaultConfig = {
    headless: false,
    disableSecurity: true,
    extraChromiumArgs: [],
};
/**
 * Playwright browser on steroids.
 *
 * This is a persistent browser factory that can spawn multiple browser contexts.
 * It is recommended to use only one instance of Browser per your application (RAM usage will grow otherwise).
 */
class Browser {
    constructor(config = {}) {
        this.playwrightBrowser = null;
        this.config = { ...defaultConfig, ...config };
    }
    /**
     * Create a browser context
     */
    async newContext(config = {}) {
        return new context_1.BrowserContext(this, config);
    }
    /**
     * Get a browser context
     */
    async getPlaywrightBrowser() {
        if (!this.playwrightBrowser) {
            return this.init();
        }
        return this.playwrightBrowser;
    }
    /**
     * Initialize the browser session
     */
    async init() {
        this.playwrightBrowser = await this.setupBrowser();
        return this.playwrightBrowser;
    }
    /**
     * Sets up and returns a Playwright Browser instance with anti-detection measures.
     */
    async setupBrowser() {
        if (this.config.wssUrl) {
            return playwright_1.webkit.connect(this.config.wssUrl);
        }
        if (this.config.chromeInstancePath) {
            // TODO: Implement Chrome instance connection
            throw new Error("Chrome instance connection not implemented yet");
        }
        const disableSecurityArgs = this.config.disableSecurity
            ? [
                "--disable-web-security",
                "--disable-site-isolation-trials",
                "--disable-features=IsolateOrigins,site-per-process",
            ]
            : [];
        return playwright_1.webkit.launch({
            headless: this.config.headless,
            args: [
                "--no-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-infobars",
                "--disable-background-timer-throttling",
                // "--disable-popup-blocking",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-window-activation",
                "--disable-focus-on-load",
                // "--no-first-run",
                "--no-default-browser-check",
                "--no-startup-window",
                "--window-position=0,0",
                "--window-size=1280,800",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-setuid-sandbox",
                "--no-zygote",
                "--single-process",
                "--disable-dev-shm-usage",
                ...disableSecurityArgs,
                ...(this.config.extraChromiumArgs || []),
            ],
            proxy: this.config.proxy,
        });
    }
    /**
     * Close the browser instance
     */
    async close() {
        if (this.playwrightBrowser) {
            await this.playwrightBrowser.close();
            this.playwrightBrowser = null;
        }
    }
}
exports.Browser = Browser;
