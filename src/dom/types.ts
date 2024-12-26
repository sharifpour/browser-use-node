/**
 * DOM types and interfaces
 */

import type { HashedDomElement } from "./tree-processor";

/**
 * Base DOM node
 */
export interface DOMBaseNode {
	/**
	 * Whether the element is visible
	 */
	isVisible: boolean;

	/**
	 * Parent element
	 */
	parent: DOMElementNode | null;

	/**
	 * Element ID
	 */
	id?: string;

	/**
	 * Element hash
	 */
	hash?: {
		/**
		 * Branch path hash
		 */
		branchPathHash: string;

		/**
		 * Element hash
		 */
		elementHash: string;
	};
}

/**
 * DOM text node
 */
export interface DOMTextNode extends DOMBaseNode {
	/**
	 * Node type
	 */
	type: 'TEXT_NODE';

	/**
	 * Text content
	 */
	text: string;
}

/**
 * DOM element node
 */
export interface DOMElementNode extends DOMBaseNode {
	/**
	 * Element tag name
	 */
	tagName: string;

	/**
	 * Element XPath
	 */
	xpath: string;

	/**
	 * Element attributes
	 */
	attributes: Record<string, string>;

	/**
	 * Child elements
	 */
	children: DOMBaseNode[];

	/**
	 * Whether the element is interactive
	 */
	isInteractive: boolean;

	/**
	 * Whether the element is a top element
	 */
	isTopElement: boolean;

	/**
	 * Whether the element has a shadow root
	 */
	shadowRoot: boolean;

	/**
	 * Element highlight index
	 */
	highlightIndex?: number;

	/**
	 * Element location
	 */
	location?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};

	/**
	 * Element hash
	 */
	hash?: HashedDomElement;

	/**
	 * Whether the element is clickable
	 */
	isClickable: boolean;

	/**
	 * Whether the element is visible
	 */
	isVisible: boolean;

	/**
	 * Whether the element is an iframe
	 */
	isIframe?: boolean;
}

/**
 * DOM history element
 */
export interface DOMHistoryElement {
	/**
	 * Element tag name
	 */
	tagName: string;

	/**
	 * Element XPath
	 */
	xpath: string;

	/**
	 * Element highlight index
	 */
	highlightIndex?: number;

	/**
	 * Parent branch path
	 */
	entireParentBranchPath: string;

	/**
	 * Element attributes
	 */
	attributes: Record<string, string>;

	/**
	 * Whether the element has a shadow root
	 */
	shadowRoot: boolean;

	/**
	 * Convert to dictionary
	 */
	toDict(): Record<string, unknown>;
}

/**
 * DOM state
 */
export interface DOMState {
	/**
	 * Element tree
	 */
	elementTree: DOMElementNode[];

	/**
	 * Selector map
	 */
	selectorMap: Record<number, DOMElementNode>;
}

/**
 * DOM query options
 */
export interface DOMQueryOptions {
	/**
	 * Maximum results
	 */
	maxResults?: number;

	/**
	 * Whether to include invisible elements
	 */
	includeInvisible?: boolean;

	/**
	 * Whether to perform exact match
	 */
	exactMatch?: boolean;

	/**
	 * Whether to perform case-sensitive search
	 */
	caseSensitive?: boolean;
}

/**
 * Element selector
 */
export interface ElementSelector {
	/**
	 * Selector type
	 */
	type: 'xpath' | 'css';

	/**
	 * Selector value
	 */
	value: string;
}

/**
 * DOM observation
 */
export interface DOMObservation {
	/**
	 * Timestamp
	 */
	timestamp: number;

	/**
	 * DOM tree
	 */
	tree: DOMElementNode[];

	/**
	 * Selector map
	 */
	selectorMap: Record<number, DOMElementNode>;
}
