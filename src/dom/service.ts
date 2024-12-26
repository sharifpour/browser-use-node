/**
 * Service for DOM operations
 */

import type { Page, ElementHandle } from "playwright";
import type { DOMElementNode, DOMState, DOMQueryOptions, ElementSelector } from "./types";
import { DOMObserverManager, MutationEvent } from "./mutation-observer";
import { convertDOMElementToHistoryElement, findHistoryElementInTree } from "./tree-processor";

const DEFAULT_QUERY_OPTIONS: DOMQueryOptions = {
	waitForVisible: true,
	waitForEnabled: true,
	timeout: 5000,
	includeHidden: false,
};

export interface ElementVisibilityInfo {
	isVisible: boolean;
	isInViewport: boolean;
	isClickable: boolean;
	opacity: number;
	boundingBox: {
		x: number;
		y: number;
		width: number;
		height: number;
	} | null;
	computedStyle: {
		display: string;
		visibility: string;
		opacity: string;
		pointerEvents: string;
	};
	overlappingElements: DOMElementNode[];
}

/**
 * Service for DOM operations
 */
export class DOMService {
	private observer: DOMObserverManager;
	private mutationHandlers: ((event: MutationEvent) => void)[] = [];
	private isDestroyed: boolean = false;

	constructor(private page: Page) {
		this.observer = new DOMObserverManager(page);
		this.observer.on('mutation', this.handleMutation.bind(this));
	}

	/**
	 * Cleanup resources
	 */
	public async cleanup(): Promise<void> {
		if (this.isDestroyed) return;

		try {
			// Stop observing mutations
			await this.stopObserving();

			// Clear mutation handlers
			this.mutationHandlers = [];

			// Remove highlights
			await this.removeHighlights();

			// Clear DOM observer
			this.observer.removeAllListeners();
			this.observer = null;

			// Mark as destroyed
			this.isDestroyed = true;
		} catch (error) {
			console.debug(`Failed to cleanup DOM service: ${error}`);
		}
	}

	/**
	 * Remove highlights from the page
	 */
	public async removeHighlights(): Promise<void> {
		try {
			await this.page.evaluate(() => {
				try {
					// Remove highlight container and contents
					const container = document.getElementById('playwright-highlight-container');
					if (container) {
						container.remove();
					}

					// Remove highlight attributes
					const highlightedElements = document.querySelectorAll('[browser-user-highlight-id^="playwright-highlight-"]');
					highlightedElements.forEach(el => {
						el.removeAttribute('browser-user-highlight-id');
					});
				} catch (error) {
					console.debug('Failed to remove highlights:', error);
				}
			});
		} catch (error) {
			console.debug(`Failed to remove highlights (this is usually ok): ${error}`);
		}
	}

	/**
	 * Start observing DOM mutations
	 */
	public async startObserving(): Promise<void> {
		await this.observer.startObserving();
	}

	/**
	 * Stop observing DOM mutations
	 */
	public async stopObserving(): Promise<void> {
		await this.observer.stopObserving();
	}

	/**
	 * Add a mutation handler
	 */
	public onMutation(handler: (event: MutationEvent) => void): void {
		this.mutationHandlers.push(handler);
	}

	/**
	 * Remove a mutation handler
	 */
	public offMutation(handler: (event: MutationEvent) => void): void {
		this.mutationHandlers = this.mutationHandlers.filter(h => h !== handler);
	}

	/**
	 * Handle mutation events
	 */
	private handleMutation(event: MutationEvent): void {
		for (const handler of this.mutationHandlers) {
			handler(event);
		}
	}

	/**
	 * Wait for a specific element to be added to the DOM
	 */
	public async waitForElement(selector: string, timeout?: number): Promise<void> {
		return this.observer.waitForElement(selector, timeout);
	}

	/**
	 * Wait for an element to be removed from the DOM
	 */
	public async waitForElementRemoval(selector: string, timeout?: number): Promise<void> {
		return this.observer.waitForElementRemoval(selector, timeout);
	}

	/**
	 * Wait for an attribute to change on an element
	 */
	public async waitForAttributeChange(
		selector: string,
		attributeName: string,
		timeout?: number
	): Promise<void> {
		return this.observer.waitForAttributeChange(selector, attributeName, timeout);
	}

	/**
	 * Wait for dynamic content to be loaded
	 */
	public async waitForDynamicContent(options: {
		selector?: string;
		predicate?: (state: DOMState) => boolean;
		timeout?: number;
	} = {}): Promise<void> {
		const { selector, predicate, timeout = 30000 } = options;

		if (selector) {
			return this.waitForElement(selector, timeout);
		}

		if (predicate) {
			return new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					this.offMutation(handler);
					reject(new Error('Timeout waiting for dynamic content'));
				}, timeout);

				const handler = async () => {
					const state = await this.getState();
					if (predicate(state)) {
						clearTimeout(timeoutId);
						this.offMutation(handler);
						resolve();
					}
				};

				this.onMutation(handler);
			});
		}

		throw new Error('Either selector or predicate must be provided');
	}

	/**
	 * Get current DOM state
	 */
	async getState(): Promise<DOMState> {
		const observation = await this.observer.getClickableElements();
		return {
			tree: observation.tree,
			clickableElements: observation.clickableElements,
			selectorMap: observation.selectorMap
		};
	}

	/**
	 * Find elements by selector
	 */
	async findElements(
		selector: ElementSelector,
		options: Partial<DOMQueryOptions> = {}
	): Promise<DOMElementNode[]> {
		const mergedOptions = { ...DEFAULT_QUERY_OPTIONS, ...options };
		return this.observer.findElements(selector, mergedOptions);
	}

	/**
	 * Find single element by selector
	 */
	async findElement(
		selector: ElementSelector,
		options: Partial<DOMQueryOptions> = {}
	): Promise<DOMElementNode | null> {
		const elements = await this.findElements(selector, options);
		return elements[0] || null;
	}

	/**
	 * Check if element is a file uploader
	 */
	async isFileUploader(element: DOMElementNode): Promise<boolean> {
		return element.tagName.toLowerCase() === "input" &&
			(element.attributes.type === "file" ||
				element.attributes.accept !== undefined);
	}

	/**
	 * Convert DOM element to history element
	 */
	convertToHistoryElement(element: unknown) {
		return convertDOMElementToHistoryElement(element);
	}

	/**
	 * Find history element in tree
	 */
	findHistoryElement(element: DOMElementNode, tree: DOMElementNode) {
		return findHistoryElementInTree(element, tree);
	}

	/**
	 * Get element by XPath
	 */
	async getElementByXPath(xpath: string): Promise<DOMElementNode | null> {
		return this.findElement({ xpath });
	}

	/**
	 * Get elements by XPath
	 */
	async getElementsByXPath(xpath: string): Promise<DOMElementNode[]> {
		return this.findElements({ xpath });
	}

	/**
	 * Get element by index
	 */
	async getElementByIndex(index: number): Promise<DOMElementNode | null> {
		const state = await this.getState();
		return state.selectorMap[index] || null;
	}

	/**
	 * Get clickable elements
	 */
	async getClickableElements(): Promise<DOMElementNode[]> {
		const state = await this.getState();
		return state.clickableElements;
	}

	/**
	 * Get DOM tree
	 */
	async getDOMTree(): Promise<DOMElementNode> {
		const state = await this.getState();
		return state.tree;
	}

	/**
	 * Get selector map
	 */
	async getSelectorMap(): Promise<Record<number, DOMElementNode>> {
		const state = await this.getState();
		return state.selectorMap;
	}

	/**
	 * Query selector with shadow DOM support
	 */
	public async querySelectorDeep(selector: string): Promise<ElementHandle | null> {
		return this.page.evaluateHandle((sel) => {
			function queryDeep(root: Document | ShadowRoot, selector: string): Element | null {
				// Try to find in current root
				const element = root.querySelector(selector);
				if (element) return element;

				// Search in shadow roots
				const shadows = Array.from(root.querySelectorAll('*'))
					.map(el => el.shadowRoot)
					.filter((shadow): shadow is ShadowRoot => shadow !== null);

				for (const shadow of shadows) {
					const found = queryDeep(shadow, selector);
					if (found) return found;
				}

				return null;
			}

			return queryDeep(document, sel);
		}, selector);
	}

	/**
	 * Query selector all with shadow DOM support
	 */
	public async querySelectorAllDeep(selector: string): Promise<ElementHandle[]> {
		const handles = await this.page.evaluateHandle((sel) => {
			function queryAllDeep(root: Document | ShadowRoot, selector: string): Element[] {
				// Get elements in current root
				const elements = Array.from(root.querySelectorAll(selector));

				// Get elements in shadow roots
				const shadows = Array.from(root.querySelectorAll('*'))
					.map(el => el.shadowRoot)
					.filter((shadow): shadow is ShadowRoot => shadow !== null);

				for (const shadow of shadows) {
					elements.push(...queryAllDeep(shadow, selector));
				}

				return elements;
			}

			return queryAllDeep(document, sel);
		}, selector);

		const properties = await handles.getProperties();
		const elements: ElementHandle[] = [];
		for (const property of properties.values()) {
			if (property.asElement()) {
				elements.push(property.asElement() as ElementHandle);
			}
		}
		return elements;
	}

	/**
	 * Build DOM tree with shadow DOM support
	 */
	public async buildDOMTreeWithShadow(root: ElementHandle | null = null): Promise<DOMElementNode> {
		const handle = root || await this.page.$('body');
		if (!handle) throw new Error('Could not find root element');

		return await this.page.evaluate((element) => {
			function buildNode(node: Element, index: number = 0): any {
				const attributes: Record<string, string> = {};
				for (const attr of node.attributes) {
					attributes[attr.name] = attr.value;
				}

				const result: any = {
					tagName: node.tagName,
					attributes,
					textContent: node.textContent || '',
					highlightIndex: index,
					children: [],
					isShadowRoot: false
				};

				// Handle shadow DOM
				if (node.shadowRoot) {
					result.children.push({
						tagName: '#shadow-root',
						attributes: {},
						textContent: '',
						highlightIndex: -1,
						children: Array.from(node.shadowRoot.children).map((child, i) =>
							buildNode(child as Element, index + i + 1)
						),
						isShadowRoot: true
					});
				}

				// Handle regular children
				let childIndex = index + (node.shadowRoot ? node.shadowRoot.children.length : 0) + 1;
				for (const child of node.children) {
					result.children.push(buildNode(child, childIndex));
					childIndex += countDescendants(child) + 1;
				}

				return result;
			}

			function countDescendants(node: Element): number {
				let count = 0;
				for (const child of node.children) {
					count += 1 + countDescendants(child);
				}
				if (node.shadowRoot) {
					for (const child of node.shadowRoot.children) {
						count += 1 + countDescendants(child as Element);
					}
				}
				return count;
			}

			return buildNode(element);
		}, handle);
	}

	/**
	 * Check if an element is in shadow DOM
	 */
	public async isInShadowDOM(element: ElementHandle): Promise<boolean> {
		return await element.evaluate((el) => {
			let parent = el.parentElement;
			while (parent) {
				if (parent.tagName === 'BODY') return false;
				const parentHost = parent.getRootNode()?.host;
				if (parentHost) return true;
				parent = parentHost?.parentElement || parent.parentElement;
			}
			return false;
		});
	}

	/**
	 * Get shadow root if available
	 */
	public async getShadowRoot(element: ElementHandle): Promise<ElementHandle | null> {
		const shadowRoot = await element.evaluateHandle(el => el.shadowRoot);
		return shadowRoot.asElement();
	}

	/**
	 * Get all iframes in the page
	 */
	public async getIframes(): Promise<ElementHandle[]> {
		return this.page.$$('iframe');
	}

	/**
	 * Get iframe content
	 */
	public async getIframeContent(iframe: ElementHandle): Promise<DOMElementNode | null> {
		const frame = await iframe.contentFrame();
		if (!frame) return null;

		return frame.evaluate((root) => {
			function buildNode(node: Element, index: number = 0): any {
				const attributes: Record<string, string> = {};
				for (const attr of node.attributes) {
					attributes[attr.name] = attr.value;
				}

				const result: any = {
					tagName: node.tagName,
					attributes,
					textContent: node.textContent || '',
					highlightIndex: index,
					children: [],
					isIframe: node.tagName === 'IFRAME'
				};

				let childIndex = index + 1;
				for (const child of node.children) {
					result.children.push(buildNode(child, childIndex));
					childIndex += countDescendants(child) + 1;
				}

				return result;
			}

			function countDescendants(node: Element): number {
				let count = 0;
				for (const child of node.children) {
					count += 1 + countDescendants(child);
				}
				return count;
			}

			return buildNode(root.documentElement);
		});
	}

	/**
	 * Query selector inside an iframe
	 */
	public async queryIframeSelector(iframe: ElementHandle, selector: string): Promise<ElementHandle | null> {
		const frame = await iframe.contentFrame();
		if (!frame) return null;
		return frame.$(selector);
	}

	/**
	 * Query selector all inside an iframe
	 */
	public async queryIframeSelectorAll(iframe: ElementHandle, selector: string): Promise<ElementHandle[]> {
		const frame = await iframe.contentFrame();
		if (!frame) return [];
		return frame.$$(selector);
	}

	/**
	 * Execute JavaScript in an iframe
	 */
	public async executeIframeScript<T>(iframe: ElementHandle, script: string): Promise<T> {
		const frame = await iframe.contentFrame();
		if (!frame) throw new Error('Could not access iframe content');
		return frame.evaluate(script);
	}

	/**
	 * Wait for iframe to load
	 */
	public async waitForIframeLoad(iframe: ElementHandle, timeout: number = 30000): Promise<void> {
		const frame = await iframe.contentFrame();
		if (!frame) throw new Error('Could not access iframe content');
		await frame.waitForLoadState('load', { timeout });
	}

	/**
	 * Get all elements from all iframes
	 */
	public async getAllIframeElements(): Promise<DOMElementNode[]> {
		const iframes = await this.getIframes();
		const elements: DOMElementNode[] = [];

		for (const iframe of iframes) {
			const content = await this.getIframeContent(iframe);
			if (content) {
				elements.push(content);
			}
		}

		return elements;
	}

	/**
	 * Build DOM tree including iframe content
	 */
	public async buildDOMTreeWithIframes(root: ElementHandle | null = null): Promise<DOMElementNode> {
		const handle = root || await this.page.$('body');
		if (!handle) throw new Error('Could not find root element');

		const tree = await this.page.evaluate((element) => {
			function buildNode(node: Element, index: number = 0): any {
				const attributes: Record<string, string> = {};
				for (const attr of node.attributes) {
					attributes[attr.name] = attr.value;
				}

				const result: any = {
					tagName: node.tagName,
					attributes,
					textContent: node.textContent || '',
					highlightIndex: index,
					children: [],
					isIframe: node.tagName === 'IFRAME'
				};

				let childIndex = index + 1;
				for (const child of node.children) {
					result.children.push(buildNode(child, childIndex));
					childIndex += countDescendants(child) + 1;
				}

				return result;
			}

			function countDescendants(node: Element): number {
				let count = 0;
				for (const child of node.children) {
					count += 1 + countDescendants(child);
				}
				return count;
			}

			return buildNode(element);
		}, handle);

		// Process iframes recursively
		const processIframes = async (node: DOMElementNode): Promise<void> => {
			if (node.isIframe) {
				const iframe = await this.page.$(`[highlight_index="${node.highlightIndex}"]`);
				if (iframe) {
					const content = await this.getIframeContent(iframe);
					if (content) {
						node.children = [content];
					}
				}
			}

			for (const child of node.children) {
				await processIframes(child);
			}
		};

		await processIframes(tree);
		return tree;
	}

	/**
	 * Find elements across all iframes
	 */
	public async findElementsAcrossFrames(selector: string): Promise<ElementHandle[]> {
		const elements: ElementHandle[] = [];

		// Find elements in main frame
		elements.push(...await this.page.$$(selector));

		// Find elements in iframes
		const iframes = await this.getIframes();
		for (const iframe of iframes) {
			const frame = await iframe.contentFrame();
			if (frame) {
				elements.push(...await frame.$$(selector));
			}
		}

		return elements;
	}

	/**
	 * Check if an element is visible
	 */
	public async isElementVisible(element: ElementHandle): Promise<boolean> {
		const visibilityInfo = await this.getElementVisibilityInfo(element);
		return visibilityInfo.isVisible;
	}

	/**
	 * Get detailed visibility information for an element
	 */
	public async getElementVisibilityInfo(element: ElementHandle): Promise<ElementVisibilityInfo> {
		return await element.evaluate((el) => {
			function isInViewport(element: Element): boolean {
				const rect = element.getBoundingClientRect();
				return (
					rect.top >= 0 &&
					rect.left >= 0 &&
					rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
					rect.right <= (window.innerWidth || document.documentElement.clientWidth)
				);
			}

			function getOverlappingElements(element: Element): any[] {
				const rect = element.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;

				const elements = document.elementsFromPoint(centerX, centerY);
				const elementIndex = elements.indexOf(element);
				const overlapping = elements.slice(0, elementIndex);

				return overlapping.map(el => ({
					tagName: el.tagName,
					attributes: Object.fromEntries(
						Array.from(el.attributes).map(attr => [attr.name, attr.value])
					),
					textContent: el.textContent || ''
				}));
			}

			const computedStyle = window.getComputedStyle(el);
			const boundingBox = el.getBoundingClientRect();

			const isVisible = (
				computedStyle.display !== 'none' &&
				computedStyle.visibility !== 'hidden' &&
				parseFloat(computedStyle.opacity) > 0 &&
				boundingBox.width > 0 &&
				boundingBox.height > 0
			);

			const isClickable = (
				isVisible &&
				computedStyle.pointerEvents !== 'none' &&
				!el.hasAttribute('disabled')
			);

			return {
				isVisible,
				isInViewport: isInViewport(el),
				isClickable,
				opacity: parseFloat(computedStyle.opacity),
				boundingBox: {
					x: boundingBox.x,
					y: boundingBox.y,
					width: boundingBox.width,
					height: boundingBox.height
				},
				computedStyle: {
					display: computedStyle.display,
					visibility: computedStyle.visibility,
					opacity: computedStyle.opacity,
					pointerEvents: computedStyle.pointerEvents
				},
				overlappingElements: getOverlappingElements(el)
			};
		});
	}

	/**
	 * Wait for an element to become visible
	 */
	public async waitForElementVisible(
		selector: string,
		timeout: number = 30000
	): Promise<ElementHandle> {
		const element = await this.page.waitForSelector(selector, {
			state: 'visible',
			timeout
		});
		if (!element) {
			throw new Error(`Element ${selector} did not become visible within ${timeout}ms`);
		}
		return element;
	}

	/**
	 * Wait for an element to become clickable
	 */
	public async waitForElementClickable(
		selector: string,
		timeout: number = 30000
	): Promise<ElementHandle> {
		const startTime = Date.now();
		let element: ElementHandle | null = null;

		while (Date.now() - startTime < timeout) {
			element = await this.page.$(selector);
			if (element) {
				const visibilityInfo = await this.getElementVisibilityInfo(element);
				if (visibilityInfo.isClickable) {
					return element;
				}
			}
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		throw new Error(`Element ${selector} did not become clickable within ${timeout}ms`);
	}

	/**
	 * Check if an element is clickable at specific coordinates
	 */
	public async isElementClickableAtPoint(
		element: ElementHandle,
		x: number,
		y: number
	): Promise<boolean> {
		return await this.page.evaluate(
			({ el, x, y }) => {
				const elementAtPoint = document.elementFromPoint(x, y);
				return elementAtPoint === el || el.contains(elementAtPoint);
			},
			{ el: element, x, y }
		);
	}

	/**
	 * Find all visible elements matching a selector
	 */
	public async findVisibleElements(selector: string): Promise<ElementHandle[]> {
		const elements = await this.page.$$(selector);
		const visibleElements: ElementHandle[] = [];

		for (const element of elements) {
			if (await this.isElementVisible(element)) {
				visibleElements.push(element);
			}
		}

		return visibleElements;
	}

	/**
	 * Get the most visible element from a list of elements
	 */
	public async getMostVisibleElement(elements: ElementHandle[]): Promise<ElementHandle | null> {
		let maxVisibleArea = 0;
		let mostVisibleElement: ElementHandle | null = null;

		for (const element of elements) {
			const visibilityInfo = await this.getElementVisibilityInfo(element);
			if (visibilityInfo.isVisible && visibilityInfo.boundingBox) {
				const area = visibilityInfo.boundingBox.width * visibilityInfo.boundingBox.height;
				if (area > maxVisibleArea) {
					maxVisibleArea = area;
					mostVisibleElement = element;
				}
			}
		}

		return mostVisibleElement;
	}
}