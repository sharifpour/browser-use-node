/**
 * DOM tree processor implementation
 */

import crypto from 'node:crypto';
import type { DOMElementNode, DOMHistoryElement } from "./types";

/**
 * Hashed DOM element
 */
export interface HashedDomElement {
	/**
	 * Branch path hash
	 */
	branchPathHash: string;

	/**
	 * Attributes hash
	 */
	attributesHash: string;
}

/**
 * Hash attributes of a DOM element
 */
function hashAttributes(attributes: Record<string, string>): string {
	const attributesString = Object.entries(attributes)
		.map(([key, value]) => `${key}=${value}`)
		.join('');
	return crypto.createHash('sha256').update(attributesString).digest('hex');
}

/**
 * Hash parent branch path
 */
function parentBranchPathHash(path: string[]): string {
	const pathString = path.join('/');
	return crypto.createHash('sha256').update(pathString).digest('hex');
}

/**
 * Get parent branch path
 */
function getParentBranchPath(element: DOMElementNode): string[] {
	const parents: DOMElementNode[] = [];
	let currentElement: DOMElementNode = element;
	while (currentElement.parent !== null) {
		parents.push(currentElement);
		currentElement = currentElement.parent;
	}
	parents.reverse();
	return parents.map(parent => parent.tagName);
}

/**
 * Hash DOM history element
 */
function hashDOMHistoryElement(element: DOMHistoryElement): HashedDomElement {
	const branchPathHash = parentBranchPathHash(element.entireParentBranchPath);
	const attributesHash = hashAttributes(element.attributes);
	return {
		branchPathHash,
		attributesHash
	};
}

/**
 * Hash DOM element
 */
function hashDOMElement(element: DOMElementNode): HashedDomElement {
	const parentBranchPath = getParentBranchPath(element);
	const branchPathHash = parentBranchPathHash(parentBranchPath);
	const attributesHash = hashAttributes(element.attributes);
	return {
		branchPathHash,
		attributesHash
	};
}

/**
 * Type guard for DOMElementNode
 */
function isDOMElementNode(node: unknown): node is DOMElementNode {
	return typeof node === 'object' && node !== null && 'tagName' in node;
}

/**
 * Convert DOM element to history element
 */
export function convertDOMElementToHistoryElement(element: DOMElementNode): DOMHistoryElement {
	const parentBranchPath = getParentBranchPath(element);
	return {
		tagName: element.tagName,
		xpath: element.xpath,
		highlightIndex: element.highlightIndex,
		entireParentBranchPath: parentBranchPath,
		attributes: { ...element.attributes },
		shadowRoot: element.shadowRoot,
		toDict: () => ({
			tag_name: element.tagName,
			xpath: element.xpath,
			highlight_index: element.highlightIndex,
			entire_parent_branch_path: parentBranchPath,
			attributes: element.attributes,
			shadow_root: element.shadowRoot,
		})
	};
}

/**
 * Find history element in tree
 */
export function findHistoryElementInTree(historyElement: DOMHistoryElement, tree: DOMElementNode): DOMElementNode | null {
	const hashedHistoryElement = hashDOMHistoryElement(historyElement);

	function processNode(node: DOMElementNode): DOMElementNode | null {
		if (node.highlightIndex !== undefined) {
			const hashedNode = hashDOMElement(node);
			if (hashedNode.branchPathHash === hashedHistoryElement.branchPathHash &&
				hashedNode.attributesHash === hashedHistoryElement.attributesHash) {
				return node;
			}
		}

		for (const child of node.children) {
			if (isDOMElementNode(child)) {
				const result = processNode(child);
				if (result) {
					return result;
				}
			}
		}

		return null;
	}

	return processNode(tree);
}