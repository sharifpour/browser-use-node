/**
 * DOM types and interfaces
 */

import type { HashedDomElement } from './tree-processor';

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
	hash?: HashedDomElement;
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
export interface DOMElementNode {
	/**
	 * Element tag name
	 */
	tag: string;

	/**
	 * Element text content
	 */
	text?: string;

	/**
	 * Element attributes
	 */
	attributes: Record<string, string>;

	/**
	 * Element children
	 */
	children: DOMElementNode[];

	/**
	 * Element XPath
	 */
	xpath: string;

	/**
	 * Element selector ID
	 */
	selector_id: number;

	/**
	 * Whether element is clickable
	 */
	is_clickable: boolean;

	/**
	 * Whether element is visible
	 */
	is_visible: boolean;

	/**
	 * Element bounding box
	 */
	bounding_box?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};

	/**
	 * Parent element
	 */
	parent?: DOMElementNode;
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
	elementTree: DOMElementNode[];

	/**
	 * Selector map
	 */
	selectorMap: Record<number, DOMElementNode>;

	/**
	 * Clickable elements
	 */
	clickableElements: DOMElementNode[];
}

/**
 * File uploader info
 */
export interface FileUploaderInfo {
	/**
	 * Whether the element is a file uploader
	 */
	isUploader: boolean;

	/**
	 * Type of file uploader
	 */
	type: 'native' | 'custom' | 'dragdrop' | null;

	/**
	 * Whether multiple files are supported
	 */
	multiple: boolean;

	/**
	 * Accepted file types
	 */
	acceptTypes: string[];
}

/**
 * Event listener info
 */
export interface EventListenerInfo {
	/**
	 * Event type
	 */
	type: string;

	/**
	 * Whether to use capture phase
	 */
	useCapture: boolean;

	/**
	 * Whether the listener is passive
	 */
	passive: boolean;

	/**
	 * Whether the listener is one-time
	 */
	once: boolean;

	/**
	 * Event handler function
	 */
	handler: string;
}

/**
 * Custom element definition
 */
export interface CustomElementDefinition {
	/**
	 * Element name
	 */
	name: string;

	/**
	 * Constructor function
	 */
	constructor: string;

	/**
	 * Observed attributes
	 */
	observedAttributes: string[];

	/**
	 * Element properties
	 */
	properties: string[];

	/**
	 * Element methods
	 */
	methods: string[];
}

/**
 * Element context
 */
export interface ElementContext {
	/**
	 * Context type
	 */
	type: 'main' | 'shadow' | 'frame';

	/**
	 * Context path
	 */
	path: string[];
}

/**
 * DOM element with event info
 */
export interface DOMElementWithEvents extends DOMElementNode {
	/**
	 * Event listeners
	 */
	eventListeners?: EventListenerInfo[];

	/**
	 * Custom element info
	 */
	customElement?: CustomElementDefinition;

	/**
	 * File uploader info
	 */
	fileUploader?: FileUploaderInfo;

	/**
	 * Element context
	 */
	context?: ElementContext;
}

/**
 * DOM state with events
 */
export interface DOMStateWithEvents extends DOMState {
	/**
	 * Elements with event info
	 */
	elementsWithEvents: DOMElementWithEvents[];

	/**
	 * Custom elements
	 */
	customElements: DOMElementWithEvents[];

	/**
	 * File uploaders
	 */
	fileUploaders: DOMElementWithEvents[];
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

	/**
	 * Whether to wait for element to be visible
	 */
	waitForVisible?: boolean;

	/**
	 * Whether to wait for element to be enabled
	 */
	waitForEnabled?: boolean;

	/**
	 * Whether to include shadow DOM
	 */
	includeShadowDOM?: boolean;

	/**
	 * Whether to include iframes
	 */
	includeIframes?: boolean;

	/**
	 * Timeout in milliseconds
	 */
	timeout?: number;
}

/**
 * Element selector
 */
export interface ElementSelector {
	/**
	 * Selector type
	 */
	type: 'xpath' | 'css' | 'text' | 'position' | 'event';

	/**
	 * Selector value
	 */
	value: string;

	/**
	 * Element index
	 */
	index?: number;

	/**
	 * Element xpath
	 */
	xpath?: string;

	/**
	 * Element coordinates
	 */
	coordinates?: {
		x: number;
		y: number;
	};

	/**
	 * Relative position
	 */
	position?: {
		type: 'above' | 'below' | 'left' | 'right';
		reference: DOMElementNode;
		maxDistance?: number;
	};

	/**
	 * Event type
	 */
	eventType?: string | string[];
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

	/**
	 * Clickable elements
	 */
	clickableElements: DOMElementNode[];
}
