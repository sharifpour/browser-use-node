/**
 * DOM types and interfaces
 */

import type { Page, BrowserContext as PlaywrightContext } from "playwright";
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
	children: Array<DOMBaseNode>;

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
	entireParentBranchPath: string[];

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
	elementTree: DOMElementNode;

	/**
	 * Clickable elements
	 */
	clickableElements: DOMElementNode[];

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
	 * Whether to wait for element to be visible
	 */
	waitForVisible?: boolean;

	/**
	 * Whether to wait for element to be enabled
	 */
	waitForEnabled?: boolean;

	/**
	 * Query timeout in milliseconds
	 */
	timeout?: number;

	/**
	 * Whether to include hidden elements
	 */
	includeHidden?: boolean;
}

/**
 * Element selector
 */
export interface ElementSelector {
	/**
	 * Element index
	 */
	index?: number;

	/**
	 * Element XPath
	 */
	xpath?: string;

	/**
	 * Element coordinates
	 */
	coordinates?: {
		x: number;
		y: number;
	};
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
	tree: DOMElementNode;

	/**
	 * Clickable elements
	 */
	clickableElements: DOMElementNode[];

	/**
	 * Selector map
	 */
	selectorMap: Record<number, DOMElementNode>;
}
