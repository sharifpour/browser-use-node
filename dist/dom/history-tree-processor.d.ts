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
/**
 * Convert a DOM element to a history element
 */
export declare function convertDomElementToHistoryElement(domElement: DOMElement): DOMHistoryElement;
/**
 * Find a history element in the DOM tree
 */
export declare function findHistoryElementInTree(domHistoryElement: DOMHistoryElement, tree: DOMElement): DOMElement | null;
/**
 * Compare a history element with a DOM element
 */
export declare function compareHistoryElementAndDomElement(domHistoryElement: DOMHistoryElement, domElement: DOMElement): boolean;
