"use strict";
/**
 * DOM observer for monitoring and interacting with page elements
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMObserver = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const defaultQueryOptions = {
    waitForVisible: true,
    waitForEnabled: true,
    timeout: 5000,
    includeHidden: false,
};
class DOMObserver {
    constructor(page) {
        this.page = page;
    }
    /**
     * Get all clickable elements on the page
     */
    async getClickableElements(highlightElements = true) {
        const elementTree = await this.buildDomTree(highlightElements);
        const timestamp = Date.now();
        const url = this.page.url();
        const title = await this.page.title();
        return {
            url,
            title,
            elements: this.flattenElements(elementTree),
            timestamp,
        };
    }
    /**
     * Build the DOM tree
     */
    async buildDomTree(highlightElements) {
        // Read the JavaScript code for building DOM tree
        const jsCode = await node_fs_1.default.promises.readFile(node_path_1.default.join(__dirname, "buildDomTree.js"), "utf-8");
        const evalPage = await this.page.evaluate(jsCode, [highlightElements]);
        return this.parseNode(evalPage);
    }
    /**
     * Parse a node from the page evaluation result
     */
    parseNode(nodeData, parent) {
        if (!nodeData)
            return null;
        if (nodeData.type === "TEXT_NODE") {
            const textNode = {
                tag: "text",
                textContent: nodeData.text,
                isVisible: nodeData.isVisible,
                attributes: {},
            };
            if (parent) {
                textNode.parent = parent;
            }
            return textNode;
        }
        const element = {
            tag: nodeData.tagName || "",
            attributes: nodeData.attributes || {},
            isVisible: nodeData.isVisible || false,
            isClickable: nodeData.isInteractive || false,
            xpath: nodeData.xpath,
            children: [],
            shadowRoot: nodeData.shadowRoot || false,
        };
        if (parent) {
            element.parent = parent;
        }
        if (nodeData.highlightIndex !== undefined) {
            element.highlightIndex = nodeData.highlightIndex;
            element.selector = `[data-highlight-index="${nodeData.highlightIndex}"]`;
        }
        if (nodeData.children) {
            for (const child of nodeData.children) {
                const childNode = this.parseNode(child, element);
                if (childNode) {
                    element.children?.push(childNode);
                }
            }
        }
        return element;
    }
    /**
     * Flatten the element tree into an array
     */
    flattenElements(root) {
        const elements = [];
        const traverse = (element) => {
            elements.push(element);
            if (element.children) {
                for (const child of element.children) {
                    traverse(child);
                }
            }
        };
        traverse(root);
        return elements;
    }
    /**
     * Find elements matching the selector
     */
    async findElements(selector, options = {}) {
        const mergedOptions = { ...defaultQueryOptions, ...options };
        const elements = await this.getClickableElements(!mergedOptions.includeHidden);
        return elements.elements.filter((element) => {
            if (selector.selector && element.selector !== selector.selector)
                return false;
            if (selector.xpath && element.xpath !== selector.xpath)
                return false;
            if (selector.text && element.textContent !== selector.text)
                return false;
            if (selector.role && element.attributes.role !== selector.role)
                return false;
            if (selector.label && element.attributes["aria-label"] !== selector.label)
                return false;
            if (selector.id && element.id !== selector.id)
                return false;
            if (selector.className && !element.classes?.includes(selector.className))
                return false;
            return true;
        });
    }
    /**
     * Find a single element matching the selector
     */
    async findElement(selector, options = {}) {
        const elements = await this.findElements(selector, options);
        return elements[0] || null;
    }
    /**
     * Check if an element is a file uploader
     */
    async isFileUploader(element, maxDepth = 3) {
        const checkElement = (el, depth = 0) => {
            if (depth > maxDepth)
                return false;
            // Check current element
            if (el.tag === "input") {
                const isUploader = el.attributes.type === "file" ||
                    el.attributes.accept !== undefined;
                if (isUploader)
                    return true;
            }
            // Check children
            if (el.children && depth < maxDepth) {
                for (const child of el.children) {
                    if (checkElement(child, depth + 1)) {
                        return true;
                    }
                }
            }
            return false;
        };
        return checkElement(element);
    }
}
exports.DOMObserver = DOMObserver;
