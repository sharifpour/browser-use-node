/**
 * DOM types and interfaces
 */

/**
 * Base DOM node
 */
export interface DOMBaseNode {
	/**
	 * Whether the element is visible
	 */
	is_visible: boolean;

	/**
	 * Parent element
	 */
	parent: DOMElementNode | null;
}

/**
 * DOM text node
 */
export class DOMTextNode implements DOMBaseNode {
	/**
	 * Node type
	 */
	readonly type = 'TEXT_NODE';

	/**
	 * Text content
	 */
	readonly text: string;

	/**
	 * Whether the element is visible
	 */
	readonly is_visible: boolean;

	/**
	 * Parent element
	 */
	readonly parent: DOMElementNode | null;

	/**
	 * Constructor function
	 */
	constructor(params: {
		text: string;
		is_visible: boolean;
		parent: DOMElementNode | null;
	}) {
		this.text = params.text;
		this.is_visible = params.is_visible;
		this.parent = params.parent;
	}
}

/**
 * DOM element node
 */
export class DOMElementNode implements DOMBaseNode {
	/**
	 * Node type
	 */
	readonly type = 'ELEMENT_NODE';

	/**
	 * Tag name
	 */
	readonly tag_name: string;

	/**
	 * XPath
	 */
	readonly xpath: string;

	/**
	 * Attributes
	 */
	readonly attributes: Record<string, string>;

	/**
	 * Children
	 */
	children: DOMBaseNode[];

	/**
	 * Whether the element is visible
	 */
	readonly is_visible: boolean;

	/**
	 * Whether the element is interactive
	 */
	readonly is_interactive: boolean;

	/**
	 * Whether the element is the top element
	 */
	readonly is_top_element: boolean;

	/**
	 * Highlight index
	 */
	readonly highlight_index: number | null;

	/**
	 * Whether the element has a shadow root
	 */
	readonly shadow_root: boolean;

	/**
	 * Parent element
	 */
	readonly parent: DOMElementNode | null;

	/**
	 * Constructor function
	 */
	constructor(params: {
		tag_name: string;
		xpath: string;
		attributes: Record<string, string>;
		children?: DOMBaseNode[];
		is_visible: boolean;
		is_interactive: boolean;
		is_top_element: boolean;
		highlight_index: number | null;
		shadow_root: boolean;
		parent: DOMElementNode | null;
	}) {
		this.tag_name = params.tag_name;
		this.xpath = params.xpath;
		this.attributes = params.attributes;
		this.children = params.children || [];
		this.is_visible = params.is_visible;
		this.is_interactive = params.is_interactive;
		this.is_top_element = params.is_top_element;
		this.highlight_index = params.highlight_index;
		this.shadow_root = params.shadow_root;
		this.parent = params.parent;
	}
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
	element_tree: DOMElementNode;

	/**
	 * Selector map
	 */
	selector_map: SelectorMap;
}

export type SelectorMap = Record<number, DOMElementNode>;

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
