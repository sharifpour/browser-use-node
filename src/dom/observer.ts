/**
 * DOM observer for monitoring and interacting with page elements
 */

import type { Page } from "playwright";
import type {
	DOMElementNode,
	DOMObservation,
	DOMQueryOptions,
	ElementSelector,
} from "./types";
import { buildDomTree, parseEvaluatedTree } from "./buildDomTree";

const DEFAULT_QUERY_OPTIONS: DOMQueryOptions = {
	waitForVisible: true,
	waitForEnabled: true,
	timeout: 5000,
	includeHidden: false,
};

/**
 * DOM observer for monitoring page elements
 */
export class DOMObserver {
	private page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Get clickable elements and DOM tree
	 */
	async getClickableElements(includeHidden = false): Promise<DOMObservation> {
		const [tree, clickableElements, selectorMap] = await Promise.all([
			this.getDOMTree(),
			this.getClickableElementsList(includeHidden),
			this.getSelectorMap()
		]);

		return {
			timestamp: Date.now(),
			tree,
			clickableElements,
			selectorMap
		};
	}

	/**
	 * Find elements by selector
	 */
	async findElements(
		selector: ElementSelector,
		options: DOMQueryOptions = DEFAULT_QUERY_OPTIONS
	): Promise<DOMElementNode[]> {
		const state = await this.getClickableElements(options.includeHidden);
		const elements = state.clickableElements.filter(element => {
			if (selector.index !== undefined && element.highlightIndex !== selector.index) {
				return false;
			}
			if (selector.xpath && element.xpath !== selector.xpath) {
				return false;
			}
			if (selector.coordinates) {
				const loc = element.location;
				if (!loc) return false;
				return (
					loc.x === selector.coordinates.x &&
					loc.y === selector.coordinates.y
				);
			}
			return true;
		});

		if (options.waitForVisible || options.waitForEnabled) {
			await this.page.waitForFunction(
				(elements, xpath) => {
					const element = document.evaluate(
						xpath,
						document,
						null,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
						null
					).singleNodeValue;

					if (!element) return false;

					const isVisible = element.getBoundingClientRect().height > 0;
					const isEnabled = !(element as HTMLElement).hasAttribute('disabled');

					return (!options.waitForVisible || isVisible) &&
						   (!options.waitForEnabled || isEnabled);
				},
				{ timeout: options.timeout },
				elements.map(e => e.xpath)
			);
		}

		return elements;
	}

	/**
	 * Get DOM tree
	 */
	private async getDOMTree(): Promise<DOMElementNode> {
		const evalResult = await this.page.evaluate(buildDomTree());
		const tree = parseEvaluatedTree(evalResult);
		if (!tree) {
			throw new Error("Failed to build DOM tree");
		}
		return tree;
	}

	/**
	 * Get clickable elements list
	 */
	private async getClickableElementsList(includeHidden = false): Promise<DOMElementNode[]> {
		const tree = await this.getDOMTree();
		const clickable: DOMElementNode[] = [];

		function traverse(node: DOMElementNode) {
			if (node.isInteractive && (includeHidden || node.isVisible)) {
				clickable.push(node);
			}
			for (const child of node.children) {
				traverse(child);
			}
		}

		traverse(tree);
		return clickable;
	}

	/**
	 * Get selector map
	 */
	private async getSelectorMap(): Promise<Record<number, DOMElementNode>> {
		const elements = await this.getClickableElementsList();
		const map: Record<number, DOMElementNode> = {};

		for (const el of elements) {
			if (el.highlightIndex !== undefined) {
				map[el.highlightIndex] = el;
			}
		}

		return map;
	}
}
