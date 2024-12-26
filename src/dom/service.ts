/**
 * Service for DOM operations
 */

import type { Page, ElementHandle, Frame } from "playwright";
import type { DOMElementNode, DOMState, DOMQueryOptions, ElementSelector, DOMBaseNode, DOMHistoryElement, DOMObservation } from "./types";
import { DOMObserverManager, MutationEvent } from "./mutation-observer";
import { convertDOMElementToHistoryElement, findHistoryElementInTree } from "./tree-processor";
import type { HashedDomElement } from './tree-processor';

const DEFAULT_QUERY_OPTIONS: DOMQueryOptions = {
	waitForVisible: true,
	waitForEnabled: true,
	timeout: 5000,
	includeInvisible: false,
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
	private isDestroyed = false;

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
			this.observer = undefined;

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
					for (const el of highlightedElements) {
						el.removeAttribute('browser-user-highlight-id');
					}
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
		const observation = await this.observer.getClickableElements() as DOMObservation;
		return {
			elementTree: observation.tree,
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
	public async isFileUploader(element: ElementHandle): Promise<{
		isUploader: boolean;
		type: 'native' | 'custom' | 'dragdrop' | null;
		multiple: boolean;
		acceptTypes: string[];
	}> {
		return await element.evaluate((el: HTMLElement) => {
			// Check for native file input
			if (el.tagName.toLowerCase() === 'input' && (el as HTMLInputElement).type === 'file') {
				return {
					isUploader: true,
					type: 'native',
					multiple: (el as HTMLInputElement).multiple,
					acceptTypes: ((el as HTMLInputElement).accept || '').split(',').filter(Boolean)
				};
			}

			// Check for drag-and-drop zones
			const hasDragDropEvents = [
				'dragenter',
				'dragover',
				'dragleave',
				'drop'
			].some(eventType => {
				const eventHandlers = (el as { [key: string]: unknown })[`on${eventType}`];
				return typeof eventHandlers === 'function';
			});

			if (hasDragDropEvents) {
				return {
					isUploader: true,
					type: 'dragdrop',
					multiple: true, // Drag-drop zones typically support multiple files
					acceptTypes: []  // Accept types are usually handled in JS
				};
			}

			// Check for custom file upload widgets
			const isCustomUploader = (
				// Common class names and attributes
				el.classList.contains('upload') ||
				el.classList.contains('file-upload') ||
				el.classList.contains('dropzone') ||
				el.hasAttribute('data-upload') ||
				el.hasAttribute('data-dropzone') ||

				// Common aria roles
				el.getAttribute('role') === 'button' &&
				(el.textContent || '').toLowerCase().includes('upload') ||

				// Common wrapper elements
				(el.tagName.toLowerCase() === 'div' || el.tagName.toLowerCase() === 'label') &&
				el.querySelector('input[type="file"]') !== null ||

				// Common button text patterns
				/upload|choose file|select file|drop file/i.test(el.textContent || '') ||

				// Check for file-related event listeners
				(window as { _eventListeners?: Map<Element, { toString(): string }[]> })._eventListeners?.get(el)?.some(listener =>
					/file|upload|drop/i.test(listener.toString())
				)
			);

			if (isCustomUploader) {
				// Try to find associated file input
				const fileInput = el.querySelector('input[type="file"]') as HTMLInputElement;
				return {
					isUploader: true,
					type: 'custom',
					multiple: fileInput ? fileInput.multiple : true,
					acceptTypes: fileInput ?
						(fileInput.accept || '').split(',').filter(Boolean) :
						[]
				};
			}

			return {
				isUploader: false,
				type: null,
					multiple: false,
					acceptTypes: []
			};
		});
	}

	/**
	 * Find all file upload elements
	 */
	public async findFileUploaders(options: {
		includeShadowDOM?: boolean;
		includeIframes?: boolean;
		includeHidden?: boolean;
	} = {}): Promise<Array<{
		element: ElementHandle;
		context: string[];
		info: {
			type: 'native' | 'custom' | 'dragdrop';
			multiple: boolean;
			acceptTypes: string[];
		};
	}>> {
		const {
			includeShadowDOM = true,
			includeIframes = true,
			includeHidden = false
		} = options;

		const results: Array<{
			element: ElementHandle;
			context: string[];
			info: {
				type: 'native' | 'custom' | 'dragdrop';
				multiple: boolean;
				acceptTypes: string[];
			};
		}> = [];

		// Helper function to process elements
		const processElements = async (
			elements: ElementHandle[],
			context: string[]
		) => {
			for (const element of elements) {
				const uploaderInfo = await this.isFileUploader(element);
				if (uploaderInfo.isUploader && uploaderInfo.type) {
					const isVisible = await this.isElementVisible(element);
					if (includeHidden || isVisible) {
						results.push({
							element,
							context,
							info: {
								type: uploaderInfo.type,
								multiple: uploaderInfo.multiple,
								acceptTypes: uploaderInfo.acceptTypes
							}
						});
					}
				}
			}
		};

		// Search in main document
		const mainElements = await this.page.$$('*');
		await processElements(mainElements, ['main']);

		// Search in shadow DOM
		if (includeShadowDOM) {
			const shadowRoots = await this.getAllShadowRoots(await this.page.$('body') as ElementHandle);
			for (const shadowRoot of shadowRoots) {
				const shadowElements = await shadowRoot.$$('*');
				const hostElement = await shadowRoot.evaluateHandle(root => (root as ShadowRoot).host);
				const hostTagName = await hostElement.evaluate(el => el.tagName.toLowerCase());
				await processElements(shadowElements, ['shadow', hostTagName]);
			}
		}

		// Search in iframes
		if (includeIframes) {
			const frames = await this.getAllFrames();
			for (const { frame, path } of frames) {
				try {
					const frameElements = await frame.$$('*');
					await processElements(frameElements, ['frame', ...path]);
				} catch (error) {
					console.warn(`Could not access frame at path: ${path.join('/')}`, error);
				}
			}
		}

		return results;
	}

	/**
	 * Upload files to an uploader element
	 */
	public async uploadFiles(
		element: ElementHandle,
		files: Array<{
			name: string;
			mimeType: string;
			buffer: Buffer;
		}>,
		options: {
			checkAcceptTypes?: boolean;
			simulateDragDrop?: boolean;
		} = {}
	): Promise<void> {
		const {
			checkAcceptTypes = true,
			simulateDragDrop = false
		} = options;

		const uploaderInfo = await this.isFileUploader(element);
		if (!uploaderInfo.isUploader) {
			throw new Error('Element is not a file uploader');
		}

		if (!uploaderInfo.multiple && files.length > 1) {
			throw new Error('Uploader does not support multiple files');
		}

		if (checkAcceptTypes && uploaderInfo.acceptTypes.length > 0) {
			for (const file of files) {
				const isAccepted = uploaderInfo.acceptTypes.some(accept => {
					if (accept.startsWith('.')) {
						// File extension
						return file.name.toLowerCase().endsWith(accept.toLowerCase());
					} else if (accept.includes('/*')) {
						// MIME type with wildcard
						const [acceptType, acceptSubtype] = accept.split('/');
						const [fileType, fileSubtype] = file.mimeType.split('/');
						return acceptType === fileType && (acceptSubtype === '*' || acceptSubtype === fileSubtype);
					} else {
						// Exact MIME type
						return accept === file.mimeType;
					}
				});

				if (!isAccepted) {
					throw new Error(`File type ${file.mimeType} is not accepted by the uploader`);
				}
			}
		}

		if (uploaderInfo.type === 'native' || uploaderInfo.type === 'custom') {
			// For native and custom uploaders, use the file input
			const fileInput = await element.evaluateHandle(el => {
				if (el.tagName.toLowerCase() === 'input') {
					return el;
				}
				return el.querySelector('input[type="file"]');
			});

			if (!fileInput) {
				throw new Error('Could not find file input element');
			}

			await fileInput.asElement()?.setInputFiles(files.map(file => ({
				name: file.name,
				mimeType: file.mimeType,
				buffer: file.buffer
			})));
		} else if (uploaderInfo.type === 'dragdrop' && simulateDragDrop) {
			// For drag-drop zones, simulate drag and drop events
			await element.evaluate((el, fileList) => {
				const dt = new DataTransfer();
				fileList.forEach((file: any) => {
					const f = new File([file.buffer], file.name, { type: file.mimeType });
					dt.items.add(f);
				});

				const dragEnterEvent = new DragEvent('dragenter', {
					bubbles: true,
					cancelable: true,
					dataTransfer: dt
				});
				el.dispatchEvent(dragEnterEvent);

				const dragOverEvent = new DragEvent('dragover', {
					bubbles: true,
					cancelable: true,
					dataTransfer: dt
				});
				el.dispatchEvent(dragOverEvent);

				const dropEvent = new DragEvent('drop', {
					bubbles: true,
					cancelable: true,
					dataTransfer: dt
				});
				el.dispatchEvent(dropEvent);
			}, files);
		} else {
			throw new Error('Unsupported upload method');
		}
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
			function buildNode(node: Element, index: number = 0): DOMElementNode {
				const result: DOMElementNode = {
					tagName: node.tagName.toLowerCase(),
					xpath: getXPath(node),
					attributes: getAttributes(node),
					children: [],
					isVisible: isElementVisible(node),
					isInteractive: isElementInteractive(node),
					isTopElement: isTopLevelElement(node),
					shadowRoot: !!node.shadowRoot,
					parent: null,
					isClickable: isElementClickable(node),
					highlightIndex: index
				};

				// Process child nodes
				for (const child of node.children) {
					const childNode = buildNode(child, index + 1);
					childNode.parent = result;
					result.children.push(childNode);
				}

				return result;
			}

			function getXPath(node: Element): string {
				// Implementation of getXPath function
				return '';
			}

			function getAttributes(node: Element): Record<string, string> {
				// Implementation of getAttributes function
				return {};
			}

			function isElementVisible(node: Element): boolean {
				// Implementation of isElementVisible function
				return false;
			}

			function isElementInteractive(node: Element): boolean {
				// Implementation of isElementInteractive function
				return false;
			}

			function isTopLevelElement(node: Element): boolean {
				// Implementation of isTopLevelElement function
				return false;
			}

			function isElementClickable(node: Element): boolean {
				// Implementation of isElementClickable function
				return false;
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
		return await element.evaluate((el: HTMLElement) => {
			function isInViewport(element: HTMLElement): boolean {
				const rect = element.getBoundingClientRect();
				return (
					rect.top >= 0 &&
					rect.left >= 0 &&
					rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
					rect.right <= (window.innerWidth || document.documentElement.clientWidth)
				);
			}

			function getOverlappingElements(element: HTMLElement): DOMElementNode[] {
				const rect = element.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;

				const elements = document.elementsFromPoint(centerX, centerY);
				const elementIndex = elements.indexOf(element);
				const overlapping = elements.slice(0, elementIndex) as HTMLElement[];

				return overlapping.map(el => ({
					tagName: el.tagName.toLowerCase(),
					xpath: '',
					attributes: Object.fromEntries(
						Array.from(el.attributes).map(attr => [attr.name, attr.value])
					),
					children: [],
					isVisible: true,
					isInteractive: false,
					isTopElement: false,
					shadowRoot: false,
					parent: null,
					isClickable: false
				}));
			}

			const computedStyle = window.getComputedStyle(el);
			const boundingBox = el.getBoundingClientRect();

			const isVisible = (
				computedStyle.display !== 'none' &&
				computedStyle.visibility !== 'hidden' &&
				Number.parseFloat(computedStyle.opacity) > 0 &&
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
				opacity: Number.parseFloat(computedStyle.opacity),
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

	/**
	 * Find elements by fuzzy text match
	 */
	public async findElementsByText(
		text: string,
		options: {
			threshold?: number;
			includeHidden?: boolean;
			caseSensitive?: boolean;
		} = {}
	): Promise<DOMElementNode[]> {
		const {
			threshold = 0.6,
			includeHidden = false,
			caseSensitive = false
		} = options;

		return this.page.evaluate(
			({ text, threshold, includeHidden, caseSensitive }) => {
				function calculateSimilarity(str1: string, str2: string): number {
					if (!caseSensitive) {
						str1 = str1.toLowerCase();
						str2 = str2.toLowerCase();
					}

					const len1 = str1.length;
					const len2 = str2.length;
					const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

					for (let i = 0; i <= len1; i++) matrix[i][0] = i;
					for (let j = 0; j <= len2; j++) matrix[0][j] = j;

					for (let i = 1; i <= len1; i++) {
						for (let j = 1; j <= len2; j++) {
							const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
							matrix[i][j] = Math.min(
								matrix[i - 1][j] + 1,
								matrix[i][j - 1] + 1,
								matrix[i - 1][j - 1] + cost
							);
						}
					}

					const maxLen = Math.max(len1, len2);
					return 1 - matrix[len1][len2] / maxLen;
				}

				function isVisible(element: Element): boolean {
					const style = window.getComputedStyle(element);
					const rect = element.getBoundingClientRect();
					return (
						style.display !== 'none' &&
						style.visibility !== 'hidden' &&
						parseFloat(style.opacity) > 0 &&
						rect.width > 0 &&
						rect.height > 0
					);
				}

				function processNode(node: Element): any {
					if (!includeHidden && !isVisible(node)) {
						return null;
					}

					const nodeText = node.textContent || '';
					const similarity = calculateSimilarity(text, nodeText);

					const result = {
						tagName: node.tagName.toLowerCase(),
						xpath: getXPath(node),
						attributes: Object.fromEntries(
							Array.from(node.attributes).map(attr => [attr.name, attr.value])
						),
						text: nodeText,
						similarity,
						isVisible: isVisible(node),
						location: node.getBoundingClientRect()
					};

					if (similarity >= threshold) {
						return result;
					}

					const childResults = Array.from(node.children)
						.map(child => processNode(child))
						.filter(Boolean);

					if (childResults.length > 0) {
						return childResults;
					}

					return null;
				}

				function getXPath(element: Element): string {
					const paths = [];
					let current = element;
					while (current && current.nodeType === Node.ELEMENT_NODE) {
						let index = 0;
						let sibling = current.previousSibling;
						while (sibling) {
							if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
								index++;
							}
							sibling = sibling.previousSibling;
						}
						const tagName = current.nodeName.toLowerCase();
						const position = index > 0 ? `[${index + 1}]` : '';
						paths.unshift(`${tagName}${position}`);
						current = current.parentElement!;
					}
					return `/${paths.join('/')}`;
				}

				const results = processNode(document.body);
				return Array.isArray(results) ? results.flat(Infinity) : [results];
			},
			{ text, threshold, includeHidden, caseSensitive }
		);
	}

	/**
	 * Find elements by relative position
	 */
	public async findElementsByPosition(
		referenceElement: DOMElementNode,
		position: 'above' | 'below' | 'left' | 'right',
		maxDistance: number = 100
	): Promise<DOMElementNode[]> {
		const state = await this.getState();
		const elements = state.clickableElements;

		if (!referenceElement.location) {
			return [];
		}

		const refRect = referenceElement.location;
		const matches: Array<{ element: DOMElementNode; distance: number }> = [];

		for (const element of elements) {
			if (!element.location || element === referenceElement) {
				continue;
			}

			const elemRect = element.location;
			let distance: number;

			switch (position) {
				case 'above':
					if (elemRect.y + elemRect.height <= refRect.y) {
						distance = Math.abs(
							(elemRect.x + elemRect.width / 2) - (refRect.x + refRect.width / 2)
						) + Math.abs(refRect.y - (elemRect.y + elemRect.height));
						if (distance <= maxDistance) {
							matches.push({ element, distance });
						}
					}
					break;

				case 'below':
					if (elemRect.y >= refRect.y + refRect.height) {
						distance = Math.abs(
							(elemRect.x + elemRect.width / 2) - (refRect.x + refRect.width / 2)
						) + Math.abs(elemRect.y - (refRect.y + refRect.height));
						if (distance <= maxDistance) {
							matches.push({ element, distance });
						}
					}
					break;

				case 'left':
					if (elemRect.x + elemRect.width <= refRect.x) {
						distance = Math.abs(
							(elemRect.y + elemRect.height / 2) - (refRect.y + refRect.height / 2)
						) + Math.abs(refRect.x - (elemRect.x + elemRect.width));
						if (distance <= maxDistance) {
							matches.push({ element, distance });
						}
					}
					break;

				case 'right':
					if (elemRect.x >= refRect.x + refRect.width) {
						distance = Math.abs(
							(elemRect.y + elemRect.height / 2) - (refRect.y + refRect.height / 2)
						) + Math.abs(elemRect.x - (refRect.x + refRect.width));
						if (distance <= maxDistance) {
							matches.push({ element, distance });
						}
					}
					break;
			}
		}

		return matches
			.sort((a, b) => a.distance - b.distance)
			.map(match => match.element);
	}

	/**
	 * Get all shadow roots recursively
	 */
	private async getAllShadowRoots(root: ElementHandle): Promise<ElementHandle[]> {
		const shadowRoots: ElementHandle[] = [];

		async function traverse(element: ElementHandle) {
			const shadowRoot = await this.getShadowRoot(element);
			if (shadowRoot) {
				shadowRoots.push(shadowRoot);
				const shadowElements = await shadowRoot.$$('*');
				for (const el of shadowElements) {
					await traverse(el);
				}
			}

			const children = await element.$$('*');
			for (const child of children) {
				await traverse(child);
			}
		}

		await traverse(root);
		return shadowRoots;
	}

	/**
	 * Get all frames recursively
	 */
	private async getAllFrames(): Promise<{ frame: Frame; path: string[] }[]> {
		const frames: { frame: Frame; path: string[] }[] = [];

		async function traverse(frame: Frame, path: string[] = []) {
			frames.push({ frame, path });

			const childFrames = frame.childFrames();
			for (const childFrame of childFrames) {
				const framePath = [...path];
				const frameElement = await childFrame.frameElement();
				if (frameElement) {
					const name = await frameElement.getAttribute('name') || '';
					const id = await frameElement.getAttribute('id') || '';
					framePath.push(name || id || String(frames.length));
				}
				await traverse(childFrame, framePath);
			}
		}

		await traverse(this.page.mainFrame());
		return frames;
	}

	/**
	 * Find elements across all shadow roots and frames
	 */
	public async findElementsDeep(
		selector: string,
		options: {
			includeShadowDOM?: boolean;
			includeIframes?: boolean;
			waitForVisible?: boolean;
			timeout?: number;
		} = {}
	): Promise<Array<{ element: ElementHandle; context: string[] }>> {
		const {
			includeShadowDOM = true,
			includeIframes = true,
			waitForVisible = false,
			timeout = 5000
		} = options;

		const results: Array<{ element: ElementHandle; context: string[] }> = [];
		const startTime = Date.now();

		// Helper function to check visibility
		const isVisible = async (element: ElementHandle): Promise<boolean> => {
			const visibilityInfo = await this.getElementVisibilityInfo(element);
			return visibilityInfo.isVisible;
		};

		// Search in main document
		const mainElements = await this.page.$$(selector);
		for (const element of mainElements) {
			if (!waitForVisible || await isVisible(element)) {
				results.push({ element, context: ['main'] });
			}
		}

		// Search in shadow DOM
		if (includeShadowDOM) {
			const shadowRoots = await this.getAllShadowRoots(await this.page.$('body') as ElementHandle);
			for (const shadowRoot of shadowRoots) {
				const shadowElements = await shadowRoot.$$(selector);
				for (const element of shadowElements) {
					if (!waitForVisible || await isVisible(element)) {
						const hostElement = await shadowRoot.evaluateHandle(root => (root as ShadowRoot).host);
						const hostTagName = await hostElement.evaluate(el => el.tagName.toLowerCase());
						results.push({
							element,
							context: ['shadow', hostTagName]
						});
					}
				}
			}
		}

		// Search in iframes
		if (includeIframes) {
			const frames = await this.getAllFrames();
			for (const { frame, path } of frames) {
				try {
					const frameElements = await frame.$$(selector);
					for (const element of frameElements) {
						if (!waitForVisible || await isVisible(element)) {
							results.push({
								element,
								context: ['frame', ...path]
							});
						}
					}
				} catch (error) {
					// Handle potential cross-origin frame access errors
					console.warn(`Could not access frame at path: ${path.join('/')}`, error);
				}
			}
		}

		// Wait for at least one element if timeout is specified
		if (timeout > 0 && results.length === 0) {
			while (Date.now() - startTime < timeout) {
				await new Promise(resolve => setTimeout(resolve, 100));
				const newResults = await this.findElementsDeep(selector, {
					...options,
					timeout: 0
				});
				if (newResults.length > 0) {
					return newResults;
				}
			}
		}

		return results;
	}

	/**
	 * Get synchronized DOM state across all contexts
	 */
	public async getSynchronizedState(): Promise<{
		main: DOMState;
		shadowRoots: Record<string, DOMState>;
		frames: Record<string, DOMState>;
	}> {
		const mainState = await this.getState();
		const shadowStates: Record<string, DOMState> = {};
		const frameStates: Record<string, DOMState> = {};

		// Get shadow root states
		const shadowRoots = await this.getAllShadowRoots(await this.page.$('body') as ElementHandle);
		for (const shadowRoot of shadowRoots) {
			const hostElement = await shadowRoot.evaluateHandle(root => (root as ShadowRoot).host);
			const hostTagName = await hostElement.evaluate(el => el.tagName.toLowerCase());
			const shadowState = await this.getStateForContext(shadowRoot);
			shadowStates[hostTagName] = shadowState;
		}

		// Get frame states
		const frames = await this.getAllFrames();
		for (const { frame, path } of frames) {
			try {
				const frameState = await this.getStateForFrame(frame);
				frameStates[path.join('/')] = frameState;
			} catch (error) {
				console.warn(`Could not get state for frame at path: ${path.join('/')}`, error);
			}
		}

		return {
			main: mainState,
			shadowRoots: shadowStates,
			frames: frameStates
		};
	}

	/**
	 * Get DOM state for a specific context (shadow root or frame)
	 */
	private async getStateForContext(context: ElementHandle): Promise<DOMState> {
		const tree = await this.buildDOMTreeWithShadow(context);
		const clickableElements = this.findClickableElements(tree);
		const selectorMap = this.buildSelectorMap(clickableElements);

		return {
			elementTree: [tree],
			clickableElements,
			selectorMap
		};
	}

	/**
	 * Get DOM state for a specific frame
	 */
	private async getStateForFrame(frame: Frame): Promise<DOMState> {
		const tree = await this.buildDOMTreeForFrame(frame);
		const clickableElements = this.findClickableElements(tree);
		const selectorMap = this.buildSelectorMap(clickableElements);

		return {
			elementTree: [tree],
			clickableElements,
			selectorMap
		};
	}

	/**
	 * Build DOM tree for a specific frame
	 */
	private async buildDOMTreeForFrame(frame: Frame): Promise<DOMElementNode> {
		const body = await frame.$('body');
		if (!body) {
			throw new Error('Could not find body element in frame');
		}
		return this.buildDOMTreeWithShadow(body);
	}

	/**
	 * Find clickable elements in a DOM tree
	 */
	private findClickableElements(tree: DOMElementNode): DOMElementNode[] {
		const clickable: DOMElementNode[] = [];

		function traverse(node: DOMElementNode) {
			if (node.isInteractive && node.isVisible) {
				clickable.push(node);
			}
			for (const child of node.children) {
				traverse(child as DOMElementNode);
			}
		}

		traverse(tree);
		return clickable;
	}

	/**
	 * Build selector map for a list of elements
	 */
	private buildSelectorMap(elements: DOMElementNode[]): Record<number, DOMElementNode> {
		const map: Record<number, DOMElementNode> = {};
		for (const element of elements) {
			if (element.highlightIndex !== undefined) {
				map[element.highlightIndex] = element;
			}
		}
		return map;
	}

	/**
	 * Get all event listeners for an element
	 */
	public async getEventListeners(element: ElementHandle): Promise<Array<{
		type: string;
		useCapture: boolean;
		passive: boolean;
		once: boolean;
		handler: string;
	}>> {
		return await element.evaluate((el) => {
			const listeners: Array<{
				type: string;
				useCapture: boolean;
				passive: boolean;
				once: boolean;
				handler: string;
			}> = [];

			// Get event properties from the element
			const eventProperties = Object.keys(el).filter(key =>
				key.startsWith('on') && typeof (el as any)[key] === 'function'
			);

			// Add inline event handlers
			for (const prop of eventProperties) {
				const type = prop.slice(2); // Remove 'on' prefix
				listeners.push({
					type,
					useCapture: false,
					passive: false,
					once: false,
					handler: (el as any)[prop].toString()
				});
			}

			// Get event listeners from the prototype chain
			let proto = Object.getPrototypeOf(el);
			while (proto && proto !== Object.prototype) {
				const descriptors = Object.getOwnPropertyDescriptors(proto);
				for (const [key, descriptor] of Object.entries(descriptors)) {
					if (key.startsWith('on') && typeof descriptor.value === 'function') {
						const type = key.slice(2);
						listeners.push({
							type,
							useCapture: false,
							passive: false,
							once: false,
							handler: descriptor.value.toString()
						});
					}
				}
				proto = Object.getPrototypeOf(proto);
			}

			// Get event listeners from event listener API
			const listenerMap = new Map<string, Set<string>>();
			const originalAddEventListener = el.addEventListener;
			const originalRemoveEventListener = el.removeEventListener;

			// Override addEventListener to track listeners
			el.addEventListener = function(
				type: string,
				listener: EventListenerOrEventListenerObject,
				options?: boolean | AddEventListenerOptions
			) {
				const listenerSet = listenerMap.get(type) || new Set();
				const handlerStr = listener.toString();
				listenerSet.add(handlerStr);
				listenerMap.set(type, listenerSet);

				const useCapture = typeof options === 'boolean' ? options : options?.capture || false;
				const passive = typeof options === 'object' ? options.passive || false : false;
				const once = typeof options === 'object' ? options.once || false : false;

				listeners.push({
					type,
					useCapture,
					passive,
					once,
					handler: handlerStr
				});

				return originalAddEventListener.apply(this, arguments);
			};

			// Override removeEventListener to track removals
			el.removeEventListener = function(
				type: string,
				listener: EventListenerOrEventListenerObject,
				options?: boolean | EventListenerOptions
			) {
				const listenerSet = listenerMap.get(type);
				if (listenerSet) {
					const handlerStr = listener.toString();
					listenerSet.delete(handlerStr);
					if (listenerSet.size === 0) {
						listenerMap.delete(type);
					}
				}

				return originalRemoveEventListener.apply(this, arguments);
			};

			return listeners;
		});
	}

	/**
	 * Check if an element has specific event handlers
	 */
	public async hasEventHandler(
		element: ElementHandle,
		eventType: string | string[]
	): Promise<boolean> {
		const listeners = await this.getEventListeners(element);
		const types = Array.isArray(eventType) ? eventType : [eventType];
		return listeners.some(listener => types.includes(listener.type));
	}

	/**
	 * Get all interactive elements with specific event handlers
	 */
	public async findElementsByEventHandler(
		eventType: string | string[],
		options: {
			includeHidden?: boolean;
			includeShadowDOM?: boolean;
			includeIframes?: boolean;
		} = {}
	): Promise<Array<{
		element: ElementHandle;
		context: string[];
		listeners: Array<{
			type: string;
			useCapture: boolean;
			passive: boolean;
			once: boolean;
			handler: string;
		}>;
	}>> {
		const {
			includeHidden = false,
			includeShadowDOM = true,
			includeIframes = true
		} = options;

		const results: Array<{
			element: ElementHandle;
			context: string[];
			listeners: Array<{
				type: string;
				useCapture: boolean;
				passive: boolean;
				once: boolean;
				handler: string;
			}>;
		}> = [];

		// Helper function to process elements
		const processElements = async (
			elements: ElementHandle[],
			context: string[]
		) => {
			for (const element of elements) {
				const listeners = await this.getEventListeners(element);
				const types = Array.isArray(eventType) ? eventType : [eventType];
				const matchingListeners = listeners.filter(l => types.includes(l.type));

				if (matchingListeners.length > 0) {
					const isVisible = await this.isElementVisible(element);
					if (includeHidden || isVisible) {
						results.push({
							element,
							context,
							listeners: matchingListeners
						});
					}
				}
			}
		};

		// Search in main document
		const mainElements = await this.page.$$('*');
		await processElements(mainElements, ['main']);

		// Search in shadow DOM
		if (includeShadowDOM) {
			const shadowRoots = await this.getAllShadowRoots(await this.page.$('body') as ElementHandle);
			for (const shadowRoot of shadowRoots) {
				const shadowElements = await shadowRoot.$$('*');
				const hostElement = await shadowRoot.evaluateHandle(root => (root as ShadowRoot).host);
				const hostTagName = await hostElement.evaluate(el => el.tagName.toLowerCase());
				await processElements(shadowElements, ['shadow', hostTagName]);
			}
		}

		// Search in iframes
		if (includeIframes) {
			const frames = await this.getAllFrames();
			for (const { frame, path } of frames) {
				try {
					const frameElements = await frame.$$('*');
					await processElements(frameElements, ['frame', ...path]);
				} catch (error) {
					console.warn(`Could not access frame at path: ${path.join('/')}`, error);
				}
			}
		}

		return results;
	}

	/**
	 * Simulate custom events on an element
	 */
	public async triggerCustomEvent(
		element: ElementHandle,
		eventType: string,
		detail: Record<string, unknown> = {}
	): Promise<void> {
		await element.evaluate(
			(el, { type, detail }) => {
				const event = new CustomEvent(type, {
					bubbles: true,
					cancelable: true,
					detail
				});
				el.dispatchEvent(event);
			},
			{ type: eventType, detail }
		);
	}

	/**
	 * Check if an element is a custom element
	 */
	public async isCustomElement(element: ElementHandle): Promise<boolean> {
		return await element.evaluate((el) => {
			return el.tagName.includes('-') || !!(window as any).customElements?.get(el.tagName.toLowerCase());
		});
	}

	/**
	 * Get custom element definition
	 */
	public async getCustomElementDefinition(element: ElementHandle): Promise<{
		name: string;
		constructor: string;
		observedAttributes: string[];
		properties: string[];
		methods: string[];
	} | null> {
		return await element.evaluate((el) => {
			const tagName = el.tagName.toLowerCase();
			const constructor = (window as any).customElements?.get(tagName);
			if (!constructor) return null;

			return {
				name: tagName,
				constructor: constructor.toString(),
				observedAttributes: constructor.observedAttributes || [],
				properties: Object.getOwnPropertyNames(constructor.prototype),
				methods: Object.getOwnPropertyNames(constructor.prototype).filter(
					name => typeof constructor.prototype[name] === 'function'
				)
			};
		});
	}
}