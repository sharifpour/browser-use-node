import type { Page, BrowserContext as PlaywrightContext } from 'playwright';
import type { DOMElementNode } from '../dom/element-tree';
import { DOMElementTree } from '../dom/element-tree';
import type { BrowserContextConfig, BrowserState, TabInfo } from './types';

export class BrowserContext {
	private page: Page | null = null;
	private readonly config: BrowserContextConfig;

	constructor(
		private readonly context: PlaywrightContext,
		config: BrowserContextConfig = {}
	) {
		this.config = {
			disable_security: config.disable_security ?? false,
			minimum_wait_page_load_time: config.minimum_wait_page_load_time ?? 0,
			maximum_wait_page_load_time: config.maximum_wait_page_load_time ?? 30000,
			no_viewport: config.no_viewport ?? false,
			browser_window_size: config.browser_window_size ?? { width: 1280, height: 720 },
			trace_path: config.trace_path
		};
	}

	public async get_current_page(): Promise<Page> {
		if (!this.page) {
			const pages = await this.context.pages();
			this.page = pages[0] || await this.context.newPage();

			// Configure page based on context settings
			if (!this.config.no_viewport && this.config.browser_window_size) {
				await this.page.setViewportSize(this.config.browser_window_size);
			}

			if (this.config.disable_security) {
				await this.page.context().setGeolocation({ latitude: 0, longitude: 0 });
				await this.page.context().grantPermissions(['geolocation']);
			}

			if (this.config.trace_path) {
				await this.context.tracing.start({ screenshots: true, snapshots: true });
			}
		}
		return this.page;
	}

	public async get_state(use_vision: boolean): Promise<BrowserState> {
		try {
			const page = await this.get_current_page();

			// Wait for page to be ready
			await page.waitForLoadState('domcontentloaded');
			const minWaitTime = this.config.minimum_wait_page_load_time ?? 0;
			if (minWaitTime > 0) {
				await page.waitForTimeout(minWaitTime);
			}

			// Get current URL and tabs
			const url = page.url();
			const tabs = await this.get_tabs();

			// Get page content
			const content = await page.content();
			if (!content) {
				throw new Error('Failed to get page content');
			}

			// Get DOM tree
			const dom_tree = await this._get_dom_tree(page);
			if (!dom_tree) {
				throw new Error('Failed to get DOM tree');
			}

			// Get screenshot if vision is enabled
			let screenshot: string | undefined;
			if (use_vision) {
				const buffer = await page.screenshot({
					type: 'jpeg',
					quality: 80,
					fullPage: true
				});
				screenshot = buffer.toString('base64');
			}

			return {
				url,
				content,
				dom_tree,
				screenshot,
				tabs
			};
		} catch (error) {
			throw new Error(`Failed to get browser state: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async get_tabs(): Promise<TabInfo[]> {
		const pages = await this.context.pages();
		const currentPage = await this.get_current_page();

		return Promise.all(pages.map(async (page, index) => ({
			id: page.url().split('/').pop() || String(index),
			url: page.url(),
			title: await page.title(),
			active: page === currentPage
		})));
	}

	private async _get_dom_tree(page: Page): Promise<DOMElementTree> {
		const elements = await page.evaluate(() => {
			const isClickable = (element: Element): boolean => {
				const style = window.getComputedStyle(element);
				const rect = element.getBoundingClientRect();
				return (
					style.display !== 'none' &&
					style.visibility !== 'hidden' &&
					style.opacity !== '0' &&
					rect.width > 0 &&
					rect.height > 0 &&
					(element instanceof HTMLAnchorElement ||
						element instanceof HTMLButtonElement ||
						element instanceof HTMLInputElement ||
						(element as HTMLElement).onclick !== null ||
						element.getAttribute('role') === 'button' ||
						element.getAttribute('role') === 'link' ||
						element.getAttribute('role') === 'menuitem')
				);
			};

			const processElement = (element: Element, index: number): DOMElementNode | null => {
				const rect = element.getBoundingClientRect();
				if (rect.width === 0 || rect.height === 0) return null;

				const children = Array.from(element.children)
					.map((child, i) => processElement(child, index + i + 1))
					.filter((child): child is DOMElementNode => child !== null);

				return {
					index,
					tag: element.tagName.toLowerCase(),
					text: element.textContent?.trim() || '',
					attributes: Object.fromEntries(
						Array.from(element.attributes).map(attr => [attr.name, attr.value])
					),
					children,
					is_clickable: isClickable(element)
				};
			};

			const root = document.documentElement;
			return processElement(root, 0);
		});

		if (!elements) {
			throw new Error('Failed to process DOM tree');
		}

		return new DOMElementTree(elements);
	}

	public async close(): Promise<void> {
		try {
			if (this.config.trace_path && this.context.tracing) {
				await this.context.tracing.stop({
					path: this.config.trace_path
				});
			}

			if (this.page) {
				await this.page.close();
				this.page = null;
			}

			await this.context.close();
		} catch (error) {
			throw new Error(`Failed to close browser context: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
