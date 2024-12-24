/**
 * Types for DOM operations
 */
export interface DOMElement {
    tag: string;
    id?: string;
    classes?: string[];
    attributes: Record<string, string>;
    textContent?: string;
    children?: DOMElement[];
    xpath?: string;
    selector?: string;
    isVisible?: boolean;
    isClickable?: boolean;
    role?: string;
    parent?: DOMElement;
    highlightIndex?: number;
    shadowRoot?: boolean;
}
export interface DOMObservation {
    url: string;
    title: string;
    elements: DOMElement[];
    timestamp: number;
}
export interface ElementSelector {
    /**
     * CSS selector
     */
    selector?: string;
    /**
     * XPath selector
     */
    xpath?: string;
    /**
     * Text content to match
     */
    text?: string;
    /**
     * Role attribute value
     */
    role?: string;
    /**
     * Label text or aria-label
     */
    label?: string;
    /**
     * Match by ID
     */
    id?: string;
    /**
     * Match by class name
     */
    className?: string;
}
export interface DOMQueryOptions {
    /**
     * Whether to wait for element to be visible
     * @default true
     */
    waitForVisible?: boolean;
    /**
     * Whether to wait for element to be enabled
     * @default true
     */
    waitForEnabled?: boolean;
    /**
     * Timeout in milliseconds
     * @default 5000
     */
    timeout?: number;
    /**
     * Whether to include hidden elements
     * @default false
     */
    includeHidden?: boolean;
}
