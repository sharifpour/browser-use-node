/**
 * History tree processor for DOM elements
 */

import { createHash } from "crypto";
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

export class HistoryTreeProcessor {
	/**
	 * Convert a DOM element to a history element
	 */
	static convertDomElementToHistoryElement(
		domElement: DOMElement,
	): DOMHistoryElement {
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
	static findHistoryElementInTree(
		domHistoryElement: DOMHistoryElement,
		tree: DOMElement,
	): DOMElement | null {
		const hashedDomHistoryElement =
			this.hashDomHistoryElement(domHistoryElement);

		const processNode = (node: DOMElement): DOMElement | null => {
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
	static compareHistoryElementAndDomElement(
		domHistoryElement: DOMHistoryElement,
		domElement: DOMElement,
	): boolean {
		const hashedDomHistoryElement =
			this.hashDomHistoryElement(domHistoryElement);
		const hashedDomElement = this.hashDomElement(domElement);

		return this.compareHashedElements(
			hashedDomHistoryElement,
			hashedDomElement,
		);
	}

	/**
	 * Hash a DOM history element
	 */
	private static hashDomHistoryElement(
		domHistoryElement: DOMHistoryElement,
	): HashedDomElement {
		const branchPathHash = this.parentBranchPathHash(
			domHistoryElement.entireParentBranchPath,
		);
		const attributesHash = this.attributesHash(domHistoryElement.attributes);

		return {
			branchPathHash,
			attributesHash,
		};
	}

	/**
	 * Hash a DOM element
	 */
	private static hashDomElement(domElement: DOMElement): HashedDomElement {
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
	private static getParentBranchPath(domElement: DOMElement): string[] {
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
	private static parentBranchPathHash(parentBranchPath: string[]): string {
		const parentBranchPathString = parentBranchPath.join("/");
		return createHash("sha256").update(parentBranchPathString).digest("hex");
	}

	/**
	 * Hash element attributes
	 */
	private static attributesHash(attributes: Record<string, string>): string {
		const attributesString = Object.entries(attributes)
			.map(([key, value]) => `${key}=${value}`)
			.join("");
		return createHash("sha256").update(attributesString).digest("hex");
	}

	/**
	 * Compare two hashed elements
	 */
	private static compareHashedElements(
		a: HashedDomElement,
		b: HashedDomElement,
	): boolean {
		return (
			a.branchPathHash === b.branchPathHash &&
			a.attributesHash === b.attributesHash
		);
	}
}
