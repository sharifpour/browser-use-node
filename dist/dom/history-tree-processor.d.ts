/**
 * History tree processor for DOM elements
 */
import type { DOMElement } from "./types";
export interface HashedDomElement {
    branchPathHash: string;
    attributesHash: string;
}
export interface DOMHistoryElement {
    tag: string;
    xpath: string;
    highlightIndex: number | null;
    entireParentBranchPath: string[];
    attributes: Record<string, string>;
    shadowRoot: boolean;
}
export declare class HistoryTreeProcessor {
    /**
     * Convert a DOM element to a history element
     */
    static convertDomElementToHistoryElement(domElement: DOMElement): DOMHistoryElement;
    /**
     * Find a history element in the DOM tree
     */
    static findHistoryElementInTree(domHistoryElement: DOMHistoryElement, tree: DOMElement): DOMElement | null;
    /**
     * Compare a history element with a DOM element
     */
    static compareHistoryElementAndDomElement(domHistoryElement: DOMHistoryElement, domElement: DOMElement): boolean;
    /**
     * Hash a DOM history element
     */
    private static hashDomHistoryElement;
    /**
     * Hash a DOM element
     */
    private static hashDomElement;
    /**
     * Get the parent branch path of a DOM element
     */
    private static getParentBranchPath;
    /**
     * Hash a parent branch path
     */
    private static parentBranchPathHash;
    /**
     * Hash element attributes
     */
    private static attributesHash;
    /**
     * Compare two hashed elements
     */
    private static compareHashedElements;
}
