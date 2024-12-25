/**
 * History tree processor for DOM elements
 */

import { createHash } from "node:crypto";
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
export function convertDomElementToHistoryElement(
	domElement: DOMElement,
): DOMHistoryElement {
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
export function findHistoryElementInTree(
	domHistoryElement: DOMHistoryElement,
	tree: DOMElement,
): DOMElement | null {
	const hashedDomHistoryElement = hashDomHistoryElement(domHistoryElement);

	const processNode = (node: DOMElement): DOMElement | null => {
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
export function compareHistoryElementAndDomElement(
	domHistoryElement: DOMHistoryElement,
	domElement: DOMElement,
): boolean {
	const hashedDomHistoryElement = hashDomHistoryElement(domHistoryElement);
	const hashedDomElement = hashDomElement(domElement);

	return compareHashedElements(hashedDomHistoryElement, hashedDomElement);
}

/**
 * Hash a DOM history element
 */
function hashDomHistoryElement(domHistoryElement: DOMHistoryElement): HashedDomElement {
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
function hashDomElement(domElement: DOMElement): HashedDomElement {
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
function getParentBranchPath(domElement: DOMElement): string[] {
	const parents: string[] = [];
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
function parentBranchPathHash(parentBranchPath: string[]): string {
	const parentBranchPathString = parentBranchPath.join("/");
	return createHash("sha256").update(parentBranchPathString).digest("hex");
}

/**
 * Hash element attributes
 */
function computeAttributesHash(attributes: Record<string, string>): string {
	const attributesString = Object.entries(attributes)
		.map(([key, value]) => `${key}=${value}`)
		.join("");
	return createHash("sha256").update(attributesString).digest("hex");
}

/**
 * Compare two hashed elements
 */
function compareHashedElements(a: HashedDomElement, b: HashedDomElement): boolean {
	return (
		a.branchPathHash === b.branchPathHash &&
		a.attributesHash === b.attributesHash
	);
}
