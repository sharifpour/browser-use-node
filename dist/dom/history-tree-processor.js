"use strict";
/**
 * History tree processor for DOM elements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertDomElementToHistoryElement = convertDomElementToHistoryElement;
exports.findHistoryElementInTree = findHistoryElementInTree;
exports.compareHistoryElementAndDomElement = compareHistoryElementAndDomElement;
const node_crypto_1 = require("node:crypto");
/**
 * Convert a DOM element to a history element
 */
function convertDomElementToHistoryElement(domElement) {
    const parentBranchPath = getParentBranchPath(domElement);
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
function findHistoryElementInTree(domHistoryElement, tree) {
    const hashedDomHistoryElement = hashDomHistoryElement(domHistoryElement);
    const processNode = (node) => {
        if (node.highlightIndex !== undefined) {
            const hashedNode = hashDomElement(node);
            if (compareHashedElements(hashedNode, hashedDomHistoryElement)) {
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
function compareHistoryElementAndDomElement(domHistoryElement, domElement) {
    const hashedDomHistoryElement = hashDomHistoryElement(domHistoryElement);
    const hashedDomElement = hashDomElement(domElement);
    return compareHashedElements(hashedDomHistoryElement, hashedDomElement);
}
/**
 * Hash a DOM history element
 */
function hashDomHistoryElement(domHistoryElement) {
    const branchPathHash = parentBranchPathHash(domHistoryElement.entireParentBranchPath);
    const attributesHash = computeAttributesHash(domHistoryElement.attributes);
    return {
        branchPathHash,
        attributesHash,
    };
}
/**
 * Hash a DOM element
 */
function hashDomElement(domElement) {
    const parentBranchPath = getParentBranchPath(domElement);
    const branchPathHash = parentBranchPathHash(parentBranchPath);
    const attributesHash = computeAttributesHash(domElement.attributes);
    return {
        branchPathHash,
        attributesHash,
    };
}
/**
 * Get the parent branch path of a DOM element
 */
function getParentBranchPath(domElement) {
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
function parentBranchPathHash(parentBranchPath) {
    const parentBranchPathString = parentBranchPath.join("/");
    return (0, node_crypto_1.createHash)("sha256").update(parentBranchPathString).digest("hex");
}
/**
 * Hash element attributes
 */
function computeAttributesHash(attributes) {
    const attributesString = Object.entries(attributes)
        .map(([key, value]) => `${key}=${value}`)
        .join("");
    return (0, node_crypto_1.createHash)("sha256").update(attributesString).digest("hex");
}
/**
 * Compare two hashed elements
 */
function compareHashedElements(a, b) {
    return (a.branchPathHash === b.branchPathHash &&
        a.attributesHash === b.attributesHash);
}
