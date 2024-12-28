/**
 * Playwright browser on steroids.
 */

import { type Browser as PlaywrightBrowser, chromium } from 'playwright';
import { BrowserContext } from './context';
import type { BrowserContextConfig } from './types';

export class Browser {
	private browser: PlaywrightBrowser | null = null;

	constructor(private readonly options: {
		headless?: boolean;
		ignoreHTTPSErrors?: boolean;
	} = {}) { }

	public async initialize(): Promise<void> {
		if (this.browser) return;

		this.browser = await chromium.launch({
			headless: this.options.headless ?? false,
			args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
		});
	}

	public async new_context(config: BrowserContextConfig = {}): Promise<BrowserContext> {
		if (!this.browser) {
			throw new Error('Browser not initialized');
		}

		const context = await this.browser.newContext({
			viewport: config.no_viewport ? null : {
				width: config.browser_window_size?.width ?? 1280,
				height: config.browser_window_size?.height ?? 720
			},
			ignoreHTTPSErrors: true,
			bypassCSP: true,
			javaScriptEnabled: true
		});

		// Enable request interception if needed
		if (config.disable_security) {
			await context.route('**/*', route => route.continue());
		}

		return new BrowserContext(context, config);
	}

	public async close(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}
}
