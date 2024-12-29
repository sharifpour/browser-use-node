/**
 * Playwright browser on steroids.
 */

import { type Browser as PlaywrightBrowser, type BrowserContext as PlaywrightContext, chromium } from 'playwright';
import { logger } from '../utils/logger';
import { BrowserContext } from './context';
import type { BrowserConfig, BrowserContextConfig } from './types';

export class Browser {
	private config: BrowserConfig;
	private playwright_browser: PlaywrightBrowser | null = null;

	constructor(config: BrowserConfig = {}) {
		logger.debug('Initializing new browser');
		this.config = config;
	}

	async new_context(config: BrowserContextConfig = {}): Promise<BrowserContext> {
		const playwright_browser = await this.get_playwright_browser();
		const context = await this._create_context(playwright_browser);
		const browserContext = new BrowserContext(context, config);
		await browserContext.initialize();
		return browserContext;
	}

	async get_playwright_browser(): Promise<PlaywrightBrowser> {
		if (!this.playwright_browser) {
			return await this._init();
		}
		return this.playwright_browser;
	}

	private async _init(): Promise<PlaywrightBrowser> {
		const browser = await this._setup_browser();
		this.playwright_browser = browser;
		return browser;
	}

	private async _setup_browser(): Promise<PlaywrightBrowser> {
		try {
			const disable_security_args = this.config.disable_security ? [
				'--disable-web-security',
				'--disable-site-isolation-trials',
				'--disable-features=IsolateOrigins,site-per-process'
			] : [];

			const browser = await chromium.launch({
				headless: this.config.headless,
				args: [
					'--no-sandbox',
					'--disable-blink-features=AutomationControlled',
					'--disable-infobars',
					'--disable-background-timer-throttling',
					'--disable-popup-blocking',
					'--disable-backgrounding-occluded-windows',
					'--disable-renderer-backgrounding',
					'--disable-window-activation',
					'--disable-focus-on-load',
					'--no-first-run',
					'--no-default-browser-check',
					'--no-startup-window',
					'--window-position=0,0',
					...disable_security_args,
					...(this.config.extra_chromium_args || [])
				],
				proxy: this.config.proxy
			});

			return browser;
		} catch (e) {
			logger.error(`Failed to initialize Playwright browser: ${e}`);
			throw e;
		}
	}

	private async _create_context(browser: PlaywrightBrowser): Promise<PlaywrightContext> {
		const context = await browser.newContext({
			viewport: this.config.browser_window_size,
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
			javaScriptEnabled: true,
			bypassCSP: this.config.disable_security,
			ignoreHTTPSErrors: this.config.disable_security
		});

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

	async close(): Promise<void> {
		try {
			if (this.playwright_browser) {
				await this.playwright_browser.close();
			}
		} catch (e) {
			logger.debug(`Failed to close browser properly: ${e}`);
		} finally {
			this.playwright_browser = null;
		}
	}
}
