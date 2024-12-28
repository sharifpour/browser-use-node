import { HashedDomElement } from './history_tree_processor/view'
import { HistoryTreeProcessor } from './history_tree_processor/service'

// Base class for DOM nodes
export abstract class DOMBaseNode {
	constructor(
		public is_visible: boolean,
		public parent: DOMElementNode | null
	) {}
}

// Text node class
export class DOMTextNode extends DOMBaseNode {
	readonly type: string = 'TEXT_NODE'

	constructor(
		public text: string,
		is_visible: boolean,
		parent: DOMElementNode | null
	) {
		super(is_visible, parent)
	}

	hasParentWithHighlightIndex(): boolean {
		let current = this.parent
		while (current !== null) {
			if (current.highlight_index !== null) {
				return true
			}
			current = current.parent
		}
		return false
	}
}

// Element node class
export class DOMElementNode extends DOMBaseNode {
	private _hash: HashedDomElement | null = null

	constructor(
		public tag_name: string,
		public xpath: string,
		public attributes: Record<string, string>,
		public children: DOMBaseNode[],
		public is_interactive: boolean = false,
		public is_top_element: boolean = false,
		public shadow_root: boolean = false,
		public highlight_index: number | null = null,
		is_visible: boolean = false,
		parent: DOMElementNode | null = null
	) {
		super(is_visible, parent)
	}

	toString(): string {
		let tag_str = `<${this.tag_name}`

		// Add attributes
		for (const [key, value] of Object.entries(this.attributes)) {
			tag_str += ` ${key}="${value}"`
		}
		tag_str += '>'

		// Add extra info
		const extras: string[] = []
		if (this.is_interactive) extras.push('interactive')
		if (this.is_top_element) extras.push('top')
		if (this.shadow_root) extras.push('shadow-root')
		if (this.highlight_index !== null) extras.push(`highlight:${this.highlight_index}`)

		if (extras.length > 0) {
			tag_str += ` [${extras.join(', ')}]`
		}

		return tag_str
	}

	// Cached hash property
	get hash(): HashedDomElement {
		if (!this._hash) {
			this._hash = HistoryTreeProcessor.hashDomElement(this)
		}
		return this._hash
	}

	getAllTextTillNextClickableElement(): string {
		const text_parts: string[] = []

		const collectText = (node: DOMBaseNode): void => {
			// Skip this branch if we hit a highlighted element (except for the current node)
			if (
				node instanceof DOMElementNode &&
				node !== this &&
				node.highlight_index !== null
			) {
				return
			}

			if (node instanceof DOMTextNode) {
				text_parts.push(node.text)
			} else if (node instanceof DOMElementNode) {
				for (const child of node.children) {
					collectText(child)
				}
			}
		}

		collectText(this)
		return text_parts.join('\n').trim()
	}

	clickableElementsToString(include_attributes: string[] = []): string {
		const formatted_text: string[] = []

		const processNode = (node: DOMBaseNode, depth: number): void => {
			if (node instanceof DOMElementNode) {
				// Add element with highlight_index
				if (node.highlight_index !== null) {
					let attributes_str = ''
					if (include_attributes.length > 0) {
						attributes_str = ' ' + include_attributes
							.map(key => {
								const value = node.attributes[key]
								return value ? `${key}="${value}"` : ''
							})
							.filter(Boolean)
							.join(' ')
					}
					formatted_text.push(
						`${node.highlight_index}[:]<${node.tag_name}${attributes_str}>${node.getAllTextTillNextClickableElement()}</${node.tag_name}>`
					)
				}

				// Process children regardless
				for (const child of node.children) {
					processNode(child, depth + 1)
				}
			} else if (node instanceof DOMTextNode) {
				// Add text only if it doesn't have a highlighted parent
				if (!node.hasParentWithHighlightIndex()) {
					formatted_text.push(`_[:]{node.text}`)
				}
			}
		}

		processNode(this, 0)
		return formatted_text.join('\n')
	}

	getFileUploadElement(check_siblings: boolean = true): DOMElementNode | null {
		// Check if current element is a file input
		if (this.tag_name === 'input' && this.attributes['type'] === 'file') {
			return this
		}

		// Check children
		for (const child of this.children) {
			if (child instanceof DOMElementNode) {
				const result = child.getFileUploadElement(false)
				if (result) {
					return result
				}
			}
		}

		// Check siblings only for the initial call
		if (check_siblings && this.parent) {
			for (const sibling of this.parent.children) {
				if (sibling !== this && sibling instanceof DOMElementNode) {
					const result = sibling.getFileUploadElement(false)
					if (result) {
						return result
					}
				}
			}
		}

		return null
	}
}

// Helper class for serialization
export class ElementTreeSerializer {
	static serializeClickableElements(element_tree: DOMElementNode): string {
		return element_tree.clickableElementsToString()
	}

	static domElementNodeToJson(element_tree: DOMElementNode): Record<string, any> {
		const nodeToDict = (node: DOMBaseNode): Record<string, any> => {
			if (node instanceof DOMTextNode) {
				return { type: 'text', text: node.text }
			} else if (node instanceof DOMElementNode) {
				return {
					type: 'element',
					tag_name: node.tag_name,
					attributes: node.attributes,
					highlight_index: node.highlight_index,
					children: node.children.map(child => nodeToDict(child))
				}
			}
			return {}
		}

		return nodeToDict(element_tree)
	}
}

// Type for selector map
export type SelectorMap = Map<number, DOMElementNode>

// DOM state class
export class DOMState {
	constructor(
		public element_tree: DOMElementNode,
		public selector_map: SelectorMap
	) {}
}
