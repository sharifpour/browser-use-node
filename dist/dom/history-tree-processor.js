"use strict";
/**
 * History tree processor for DOM elements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryTreeProcessor = void 0;
const crypto_1 = require("crypto");
class HistoryTreeProcessor {
    /**
     * Convert a DOM element to a history element
     */
    static convertDomElementToHistoryElement(domElement) {
        const parentBranchPath = this.getParentBranchPath(domElement);
        return {
            tag: domElement.tag,
            xpath: domElement.xpath || "",
            highlightIndex: domElement.highlightIndex || null,
            entireParentBranchPath: parentBranchPath,
            attributes: domElement.attributes,
            shadowRoot: domElement.shadowRoot || false,
        };
    }
    /**
     * Find a history element in the DOM tree
     */
    static findHistoryElementInTree(domHistoryElement, tree) {
        const hashedDomHistoryElement = this.hashDomHistoryElement(domHistoryElement);
        const processNode = (node) => {
            if (node.highlightIndex !== undefined) {
                const hashedNode = this.hashDomElement(node);
                if (this.compareHashedElements(hashedNode, hashedDomHistoryElement)) {
                    return node;
                }
            }
            if (node.children) {
                for (const child of node.children) {
                    const result = processNode(child);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        };
        return processNode(tree);
    }
    /**
     * Compare a history element with a DOM element
     */
    static compareHistoryElementAndDomElement(domHistoryElement, domElement) {
        const hashedDomHistoryElement = this.hashDomHistoryElement(domHistoryElement);
        const hashedDomElement = this.hashDomElement(domElement);
        return this.compareHashedElements(hashedDomHistoryElement, hashedDomElement);
    }
    /**
     * Hash a DOM history element
     */
    static hashDomHistoryElement(domHistoryElement) {
        const branchPathHash = this.parentBranchPathHash(domHistoryElement.entireParentBranchPath);
        const attributesHash = this.attributesHash(domHistoryElement.attributes);
        return {
            branchPathHash,
            attributesHash,
        };
    }
    /**
     * Hash a DOM element
     */
    static hashDomElement(domElement) {
        const parentBranchPath = this.getParentBranchPath(domElement);
        const branchPathHash = this.parentBranchPathHash(parentBranchPath);
        const attributesHash = this.attributesHash(domElement.attributes);
        return {
            branchPathHash,
            attributesHash,
        };
    }
    /**
     * Get the parent branch path of a DOM element
     */
    static getParentBranchPath(domElement) {
        const parents = [];
        let current = domElement;
        while (current.parent) {
            parents.push(current.tag);
            current = current.parent;
        }
        return parents.reverse();
    }
    /**
     * Hash a parent branch path
     */
    static parentBranchPathHash(parentBranchPath) {
        const parentBranchPathString = parentBranchPath.join("/");
        return (0, crypto_1.createHash)("sha256").update(parentBranchPathString).digest("hex");
    }
    /**
     * Hash element attributes
     */
    static attributesHash(attributes) {
        const attributesString = Object.entries(attributes)
            .map(([key, value]) => `${key}=${value}`)
            .join("");
        return (0, crypto_1.createHash)("sha256").update(attributesString).digest("hex");
    }
    /**
     * Compare two hashed elements
     */
    static compareHashedElements(a, b) {
        return (a.branchPathHash === b.branchPathHash &&
            a.attributesHash === b.attributesHash);
    }
}
exports.HistoryTreeProcessor = HistoryTreeProcessor;
