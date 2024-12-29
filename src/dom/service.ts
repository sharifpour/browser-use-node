import type { Page } from 'playwright';
import { logger } from '../utils/logger';
import { buildDomTreeFn } from './buildDomTree';
import { type DOMBaseNode, DOMElementNode, type DOMState, DOMTextNode, type SelectorMap } from './types';

export class DomService {
	private readonly page: Page;
	private readonly xpath_cache: Record<string, any> = {};

	constructor(page: Page) {
		this.page = page;
	}

	// region - Clickable elements
	async get_clickable_elements(highlight_elements = true): Promise<DOMState> {
		const element_tree = await this._build_dom_tree(highlight_elements);
		const selector_map = this._create_selector_map(element_tree);

		return {
			element_tree,
			selector_map
		};
	}

	private async _build_dom_tree(highlight_elements: boolean): Promise<DOMElementNode> {
		try {
			// Inject the buildDomTree function into the page context
			await this.page.evaluate(`window.buildDomTree = ${buildDomTreeFn}`);

			// Call the injected function with the parameter
			const eval_page = await this.page.evaluate(`window.buildDomTree(${highlight_elements})`);
			const html_to_dict = this._parse_node(eval_page);

			if (!html_to_dict || !(html_to_dict instanceof DOMElementNode)) {
				throw new Error('Failed to parse HTML to dictionary');
			}

			return html_to_dict;
		} catch (error) {
			logger.error('Error building DOM tree:', error);
			throw error;
		}
	}

	private _create_selector_map(element_tree: DOMElementNode): SelectorMap {
		const selector_map: SelectorMap = {};

		const process_node = (node: DOMBaseNode): void => {
			if (node instanceof DOMElementNode && node.highlight_index !== null) {
				selector_map[node.highlight_index] = node;

				for (const child of node.children) {
					process_node(child);
				}
			}
		};

		process_node(element_tree);
		return selector_map;
	}

	private _parse_node(
		node_data: any,
		parent: DOMElementNode | null = null
	): DOMBaseNode | null {
		if (!node_data) {
			return null;
		}

		if (node_data.type === 'TEXT_NODE') {
			return new DOMTextNode({
				text: node_data.text,
				is_visible: node_data.isVisible,
				parent
			});
		}

		const element_node = new DOMElementNode({
			tag_name: node_data.tagName,
			xpath: node_data.xpath,
			attributes: node_data.attributes || {},
			children: [], // Initialize empty, will fill later
			is_visible: node_data.isVisible ?? false,
			is_interactive: node_data.isInteractive ?? false,
			is_top_element: node_data.isTopElement ?? false,
			highlight_index: node_data.highlightIndex ?? null,
			shadow_root: node_data.shadowRoot ?? false,
			parent
		});

		const children: DOMBaseNode[] = [];
		for (const child of node_data.children || []) {
			if (child) {
				const child_node = this._parse_node(child, element_node);
				if (child_node) {
					children.push(child_node);
				}
			}
		}

		element_node.children = children;
		return element_node;
	}
	// endregion
}