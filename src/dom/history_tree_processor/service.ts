import type { DOMElementNode } from '../views';

export interface DOMHistoryElement {
  hash: string;
  highlightIndex?: number;
  children?: DOMHistoryElement[];
}

export class HistoryTreeProcessor {
  static findHistoryElementInTree(
    historyElement: DOMHistoryElement,
    currentTree: DOMElementNode
  ): DOMHistoryElement | null {
    if (currentTree.hash === historyElement.hash) {
      return {
        hash: currentTree.hash,
        highlightIndex: currentTree.highlightIndex,
        children: currentTree.children?.map(child => ({
          hash: child.hash,
          highlightIndex: child.highlightIndex,
          children: child.children
        }))
      };
    }

    if (!currentTree.children) {
      return null;
    }

    for (const child of currentTree.children) {
      const found = this.findHistoryElementInTree(historyElement, child);
      if (found) {
        return found;
      }
    }

    return null;
  }
}