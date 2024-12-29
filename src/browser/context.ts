import type { ElementHandle, Page, BrowserContext as PlaywrightContext } from 'playwright';
import { DomService } from '../dom/service';
import type { DOMElementNode } from '../dom/types';
import { BrowserError } from '../errors';
import { logger } from '../utils/logger';
import type { BrowserContextConfig, BrowserState, TabInfo } from './types';

export class BrowserContext {
	private config: BrowserContextConfig;
	private context: PlaywrightContext;
	private page: Page | null = null;
	private current_state: BrowserState | null = null;
	private context_id: string;
	private session: any = null;

	constructor(context: PlaywrightContext, config: BrowserContextConfig = {}) {
		this.context = context;
		this.config = config;
		this.context_id = crypto.randomUUID();
		logger.debug(`Initializing new browser context with id: ${this.context_id}`);
	}

	async initialize(): Promise<void> {
		logger.debug('Initializing browser context');
		this.page = await this.context.newPage();

		// Create an empty initial state
		const element_tree: DOMElementNode = {
			type: 'ELEMENT_NODE',
			tag_name: 'root',
			is_visible: true,
			parent: null,
			xpath: '',
			attributes: {},
			children: [],
			is_interactive: false,
			is_top_element: false,
			shadow_root: false,
			highlight_index: null
		};

		const initial_state: BrowserState = {
			element_tree,
			selector_map: {},
			url: this.page.url(),
			title: await this.page.title(),
			screenshot: null,
			tabs: [],
			content: ''
		};

		this.current_state = initial_state;
		await this._add_new_page_listener();
	}

	private async _add_new_page_listener(): Promise<void> {
		this.context.on('page', async (page: Page) => {
			await page.waitForLoadState();
			logger.debug(`New page opened: ${page.url()}`);
			if (this.page) {
				this.page = page;
			}
		});
	}

	async get_state(use_vision = false): Promise<BrowserState> {
		await this._wait_for_page_and_frames_load();
		const state = await this._update_state(use_vision);

		// Save cookies if a file is specified
		if (this.config.cookies_file) {
			await this.save_cookies();
		}

		return state;
	}

	private async _update_state(use_vision = false): Promise<BrowserState> {
		try {
			const page = await this.get_page();
			if (!page) {
				throw new Error('No page available');
			}

			// Test if page is still accessible
			try {
				await page.evaluate('1');
			} catch (e) {
				logger.debug(`Current page is no longer accessible: ${e}`);
				const pages = this.context.pages();
				if (pages.length > 0) {
					this.page = pages[pages.length - 1];
					logger.debug(`Switched to page: ${await this.page.title()}`);
				} else {
					throw new BrowserError('No valid pages available');
				}
			}

			await this.remove_highlights();
			const dom_service = new DomService(page);
			const content = await dom_service.get_clickable_elements();

			let screenshot: string | null = null;
			if (use_vision) {
				screenshot = await this.take_screenshot();
			}

			const tabs = await this.get_tabs_info();
			const title = await page.title();
			const pageContent = await page.content();

			const state: BrowserState = {
				element_tree: content.element_tree,
				selector_map: content.selector_map,
				url: page.url(),
				title,
				content: pageContent,
				tabs,
				screenshot
			};

			this.current_state = state;
			return state;
		} catch (e) {
			logger.error(`Failed to update state: ${e}`);
			if (this.current_state) {
				return this.current_state;
			}
			throw e;
		}
	}

	private async _wait_for_page_and_frames_load(): Promise<void> {
		const page = await this.get_page();

		// Wait for the main page to load
		await page.waitForLoadState('load');

		// Wait for network to be idle
		if (this.config.wait_for_network_idle_page_load_time) {
			await page.waitForLoadState('networkidle');
		}

		// Wait for any iframes to load
		const frames = page.frames();
		for (const frame of frames) {
			await frame.waitForLoadState('load').catch(() => { });
		}

		// Additional wait time if specified
		const minWaitTime = this.config.minimum_wait_page_load_time ?? 0;
		if (minWaitTime > 0) {
			await new Promise(resolve => setTimeout(resolve, minWaitTime * 1000));
		}
	}

	async get_page(): Promise<Page> {
		if (!this.page) {
			const pages = this.context.pages();
			if (pages.length === 0) {
				this.page = await this.context.newPage();
			} else {
				this.page = pages[0];
			}
		}
		return this.page;
	}

	async goto(url: string): Promise<void> {
		const page = await this.get_page();
		await page.goto(url, {
			waitUntil: 'networkidle',
			timeout: this.config.page_load_timeout || 30000
		});
	}

	async close(): Promise<void> {
		try {
			if (this.config.trace_path) {
				try {
					await this.context.tracing.stop({
						path: this.config.trace_path
					});
				} catch (e) {
					logger.debug(`Failed to stop tracing: ${e}`);
				}
			}

			await this.context.close();
		} catch (e) {
			logger.debug(`Failed to close context properly: ${e}`);
		}
	}

	async wait_for_load(): Promise<void> {
		const page = await this.get_page();
		await page.waitForLoadState('networkidle');
	}

	async get_page_html(): Promise<string> {
		const page = await this.get_page();
		return await page.content();
	}

	async execute_javascript<T>(script: string): Promise<T> {
		const page = await this.get_page();
		return await page.evaluate(script);
	}

	async take_screenshot(full_page = false): Promise<string> {
		const page = await this.get_page();
		const screenshot = await page.screenshot({
			fullPage: full_page,
			type: 'jpeg',
			quality: 80
		});
		return screenshot.toString('base64');
	}

	async remove_highlights(): Promise<void> {
		try {
			const page = await this.get_page();
			await page.evaluate(`
				try {
					const highlights = document.querySelectorAll('[data-highlight]');
					for (const el of Array.from(highlights)) {
						el.removeAttribute('data-highlight');
					}
				} catch (e) {
					console.error('Failed to remove highlights:', e);
				}
			`);
		} catch (e) {
			logger.debug(`Failed to remove highlights: ${e}`);
		}
	}

	private async get_tabs_info(): Promise<TabInfo[]> {
		return Promise.all(
			this.context.pages().map(async (p, index) => ({
				id: index,
				url: p.url(),
				title: await p.title(),
				active: p === this.page
			}))
		);
	}

	async get_locate_element(element: DOMElementNode): Promise<ElementHandle | null> {
		const current_frame = await this.get_page();

		// Start with the target element and collect all parents
		const parents: DOMElementNode[] = [];
		let current = element;
		while (current.parent) {
			parents.push(current.parent);
			current = current.parent;
			if (current.tag_name === 'iframe') {
				break;
			}
		}

		// There can be only one iframe parent (by design of the loop above)
		const iframe_parent = parents.find(item => item.tag_name === 'iframe');

		try {
			if (iframe_parent) {
				const css_selector = this._enhanced_css_selector_for_element(iframe_parent);
				const frame = current_frame.frameLocator(css_selector);
				const locator = frame.locator(this._enhanced_css_selector_for_element(element));
				return await locator.elementHandle();
			}

			// Try to scroll into view if hidden
			const element_handle = await current_frame.$(this._enhanced_css_selector_for_element(element));
			if (element_handle) {
				await element_handle.scrollIntoViewIfNeeded();
				return element_handle;
			}

			return null;
		} catch (e) {
			logger.error(`Failed to locate element: ${e}`);
			return null;
		}
	}

	private _enhanced_css_selector_for_element(element: DOMElementNode): string {
		try {
			let css_selector = element.tag_name || '*';

			// Add ID if available
			if (element.attributes.id) {
				return `#${element.attributes.id}`;
			}

			// Add classes if available
			if (element.attributes.class) {
				const classes = element.attributes.class.split(' ')
					.filter((c: string) => c.trim())
					.map((c: string) => `.${c}`)
					.join('');
				css_selector += classes;
			}

			// Handle other attributes
			for (const [attribute, value] of Object.entries(element.attributes)) {
				if (attribute === 'class') continue;
				if (!attribute.trim()) continue;

				// Escape special characters in attribute names
				const safe_attribute = attribute.replace(':', '\\:');

				// Handle different value cases
				if (value === '') {
					css_selector += `[${safe_attribute}]`;
				} else if (/["'<>`]/.test(value)) {
					// Use contains for values with special characters
					const safe_value = value.replace('"', '\\"');
					css_selector += `[${safe_attribute}*="${safe_value}"]`;
				} else {
					css_selector += `[${safe_attribute}="${value}"]`;
				}
			}

			return css_selector;
		} catch {
			// Fallback to a more basic selector if something goes wrong
			const tag_name = element.tag_name || '*';
			return `${tag_name}[highlight_index='${element.highlight_index}']`;
		}
	}

	async _click_element_node(element: DOMElementNode): Promise<void> {
		const page = await this.get_page();

		try {
			const element_handle = await this.get_locate_element(element);

			if (!element_handle) {
				throw new Error(`Element: ${element} not found`);
			}

			try {
				await element_handle.click({ timeout: 1500 });
				await page.waitForLoadState();
			} catch {
				try {
					await page.evaluate('(el) => el.click()', element_handle);
					await page.waitForLoadState();
				} catch (e) {
					throw new Error(`Failed to click element: ${e}`);
				}
			}
		} catch (e) {
			throw new Error(`Failed to click element: ${element}. Error: ${e}`);
		}
	}

	async _input_text_element_node(element: DOMElementNode, text: string): Promise<void> {
		try {
			const page = await this.get_page();
			const element_handle = await this.get_locate_element(element);

			if (!element_handle) {
				throw new Error(`Element: ${element} not found`);
			}

			await element_handle.scrollIntoViewIfNeeded({ timeout: 2500 });
			await element_handle.fill('');
			await element_handle.type(text);
			await page.waitForLoadState();
		} catch (e) {
			throw new Error(`Failed to input text into element: ${element}. Error: ${e}`);
		}
	}

	async is_file_uploader(element: DOMElementNode, max_depth = 3, current_depth = 0): Promise<boolean> {
		if (current_depth > max_depth) {
			return false;
		}

		// Check current element
		let is_uploader = false;

		if (!(element instanceof Object)) {
			return false;
		}

		// Check for file input attributes
		if (element.tag_name === 'input') {
			is_uploader = (
				element.attributes.type === 'file' ||
				element.attributes.accept !== undefined
			);
		}

		if (is_uploader) {
			return true;
		}

		// Recursively check children
		if (element.children && current_depth < max_depth) {
			for (const child of element.children) {
				if (await this.is_file_uploader(child as DOMElementNode, max_depth, current_depth + 1)) {
					return true;
				}
			}
		}

		return false;
	}

	async switch_to_tab(page_id: number): Promise<void> {
		const pages = this.context.pages();
		const targetPage = page_id === -1 ? pages[pages.length - 1] : pages[page_id];

		if (!targetPage) {
			throw new Error(`No page found with id ${page_id}`);
		}

		this.page = targetPage;
		await targetPage.bringToFront();
	}

	async save_cookies(): Promise<void> {
		if (this.config.cookies_file) {
			try {
				const cookies = await this.context.cookies();
				logger.info(`Saving ${cookies.length} cookies to ${this.config.cookies_file}`);
				// Save cookies implementation
			} catch (e) {
				logger.warn(`Failed to save cookies: ${e}`);
			}
		}
	}

	async _initialize_session() {
		// Create an empty initial state
		const element_tree: DOMElementNode = {
			type: 'ELEMENT_NODE',
			tag_name: 'root',
			is_visible: true,
			parent: null,
			xpath: '',
			attributes: {},
			children: [],
			is_interactive: false,
			is_top_element: false,
			shadow_root: false,
			highlight_index: null
		};

		const initial_state: BrowserState = {
			element_tree,
			selector_map: {},
			url: 'about:blank',
			title: '',
			screenshot: null,
			tabs: [],
			content: ''
		};

		// Initialize session with empty state
		this.session = {
			cached_state: initial_state
		};

		return this.session;
	}

	async get_session() {
		if (!this.session) {
			return await this._initialize_session();
		}
		return this.session;
	}
}
