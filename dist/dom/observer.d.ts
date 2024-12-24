/**
 * DOM observer for monitoring and interacting with page elements
 */
import type { Page } from "playwright";
import type { DOMElement, DOMObservation, DOMQueryOptions, ElementSelector } from "./types";
export declare class DOMObserver {
    private page;
    constructor(page: Page);
    /**
     * Get all clickable elements on the page
     */
    getClickableElements(highlightElements?: boolean): Promise<DOMObservation>;
    /**
     * Build the DOM tree
     */
    private buildDomTree;
    /**
     * Parse a node from the page evaluation result
     */
    private parseNode;
    /**
     * Flatten the element tree into an array
     */
    private flattenElements;
    /**
     * Find elements matching the selector
     */
    findElements(selector: ElementSelector, options?: Partial<DOMQueryOptions>): Promise<DOMElement[]>;
    /**
     * Find a single element matching the selector
     */
    findElement(selector: ElementSelector, options?: Partial<DOMQueryOptions>): Promise<DOMElement | null>;
    /**
     * Check if an element is a file uploader
     */
    isFileUploader(element: DOMElement, maxDepth?: number): Promise<boolean>;
}
