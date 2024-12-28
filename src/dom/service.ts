import type { Page } from 'playwright';
import type { DOMElementNode } from './types';

export class DOMService {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	public async get_state(use_vision = true): Promise<{ elementTree: DOMElementNode[]; selectorMap: Record<number, DOMElementNode> }> {
		const elementTree = await this.get_element_tree(use_vision);
		const selectorMap = this.build_selector_map(elementTree);
		return { elementTree, selectorMap };
	}

	private async get_element_tree(use_vision = true): Promise<DOMElementNode[]> {
		const tree = await this.page.evaluate((shouldUseVision) => {
			function processNode(node: Element): DOMElementNode {
				const rect = node.getBoundingClientRect();
				const computedStyle = window.getComputedStyle(node);
				const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;

				const attributes: Record<string, string> = {};
				for (const attr of Array.from(node.attributes)) {
					attributes[attr.name] = attr.value;
				}

				return {
					tag: node.tagName.toLowerCase(),
					text: node.textContent?.trim(),
					attributes,
					children: Array.from(node.children).map(child => processNode(child as Element)),
					xpath: getXPath(node),
					selector_id: Math.floor(Math.random() * 1000000),
					is_clickable: isClickable(node),
					is_visible: isVisible,
					bounding_box: shouldUseVision ? {
						x: rect.x,
						y: rect.y,
						width: rect.width,
						height: rect.height
					} : undefined
				};
			}

			function getXPath(node: Node): string {
				if (!node.parentNode) return '';
				const parent = getXPath(node.parentNode);
				const siblings = Array.from(node.parentNode.childNodes).filter(n => n.nodeName === node.nodeName);
				const index = siblings.indexOf(node as ChildNode) + 1;
				return `${parent}/${node.nodeName.toLowerCase()}[${index}]`;
			}

			function isClickable(node: Element): boolean {
				const clickableElements = ['a', 'button', 'input', 'select', 'textarea'];
				if (clickableElements.includes(node.tagName.toLowerCase())) return true;

				const style = window.getComputedStyle(node);
				if (style.cursor === 'pointer') return true;

				const onclick = node.getAttribute('onclick');
				if (onclick) return true;

				return false;
			}

			return Array.from(document.body.children).map(node => processNode(node as Element));
		}, use_vision);

		return tree;
	}

	private build_selector_map(elementTree: DOMElementNode[]): Record<number, DOMElementNode> {
		const map: Record<number, DOMElementNode> = {};

		function traverse(node: DOMElementNode) {
			map[node.selector_id] = node;
			for (const child of node.children) {
				traverse(child);
			}
		}

		for (const node of elementTree) {
			traverse(node);
		}
		return map;
	}

	public async cleanup(): Promise<void> {
	// Nothing to clean up for now
	}
}