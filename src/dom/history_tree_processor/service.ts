import { createHash } from 'crypto';
import type { DOMElementNode, HashedDomElement } from '../types';

export interface DOMHistoryElement {
  tagName: string;
  xpath: string;
  highlightIndex: number | null;
  entireParentBranchPath: string[];
  attributes: Record<string, string>;
  shadowRoot: boolean;
}

export class HistoryTreeProcessor {
  static convertDomElementToHistoryElement(domElement: DOMElementNode): DOMHistoryElement {
    const parentBranchPath = this.getParentBranchPath(domElement);
    return {
      tagName: domElement.tagName,
      xpath: domElement.xpath,
      highlightIndex: domElement.highlightIndex,
      entireParentBranchPath: parentBranchPath,
      attributes: domElement.attributes,
      shadowRoot: domElement.shadowRoot
    };
  }

  static findHistoryElementInTree(
    domHistoryElement: DOMHistoryElement,
    tree: DOMElementNode
  ): DOMElementNode | null {
    const hashedDomHistoryElement = this.hashDomHistoryElement(domHistoryElement);

    const processNode = (node: DOMElementNode): DOMElementNode | null => {
      if (node.highlightIndex !== null) {
        const hashedNode = this.hashDomElement(node);
        if (
          hashedNode.branchPathHash === hashedDomHistoryElement.branchPathHash &&
          hashedNode.attributesHash === hashedDomHistoryElement.attributesHash
        ) {
          return node;
        }
      }
      for (const child of node.children) {
        if ('tagName' in child) {
          const result = processNode(child as DOMElementNode);
          if (result !== null) {
            return result;
          }
        }
      }
      return null;
    };

    return processNode(tree);
  }

  static compareHistoryElementAndDomElement(
    domHistoryElement: DOMHistoryElement,
    domElement: DOMElementNode
  ): boolean {
    const hashedDomHistoryElement = this.hashDomHistoryElement(domHistoryElement);
    const hashedDomElement = this.hashDomElement(domElement);

    return (
      hashedDomHistoryElement.branchPathHash === hashedDomElement.branchPathHash &&
      hashedDomHistoryElement.attributesHash === hashedDomElement.attributesHash
    );
  }

  private static hashDomHistoryElement(domHistoryElement: DOMHistoryElement): HashedDomElement {
    const branchPathHash = this.parentBranchPathHash(domHistoryElement.entireParentBranchPath);
    const attributesHash = this.attributesHash(domHistoryElement.attributes);

    return {
      branchPathHash,
      attributesHash
    };
  }

  private static hashDomElement(domElement: DOMElementNode): HashedDomElement {
    const parentBranchPath = this.getParentBranchPath(domElement);
    const branchPathHash = this.parentBranchPathHash(parentBranchPath);
    const attributesHash = this.attributesHash(domElement.attributes);

    return {
      branchPathHash,
      attributesHash
    };
  }

  private static getParentBranchPath(domElement: DOMElementNode): string[] {
    const parents: DOMElementNode[] = [];
    let currentElement: DOMElementNode | null = domElement;

    while (currentElement && currentElement.parent) {
      parents.push(currentElement);
      currentElement = currentElement.parent;
    }

    parents.reverse();
    return parents.map(parent => parent.tagName);
  }

  private static parentBranchPathHash(parentBranchPath: string[]): string {
    const parentBranchPathString = parentBranchPath.join('/');
    return createHash('sha256').update(parentBranchPathString).digest('hex');
  }

  private static attributesHash(attributes: Record<string, string>): string {
    const attributesString = Object.entries(attributes)
      .map(([key, value]) => `${key}=${value}`)
      .join('');
    return createHash('sha256').update(attributesString).digest('hex');
  }
}