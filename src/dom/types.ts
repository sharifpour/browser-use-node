export interface HashedDomElement {
  branchPathHash: string;
  attributesHash: string;
}

export class DOMBaseNode {
  constructor(
    public isVisible: boolean,
    public parent: DOMElementNode | null = null
  ) { }
}

export class DOMTextNode extends DOMBaseNode {
  readonly type = 'TEXT_NODE';

  constructor(
    isVisible: boolean,
    public text: string,
    parent: DOMElementNode | null = null
  ) {
    super(isVisible, parent);
  }

  hasParentWithHighlightIndex(): boolean {
    let current = this.parent;
    while (current !== null) {
      if (current.highlightIndex !== null) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
}

export class DOMElementNode extends DOMBaseNode {
  constructor(
    isVisible: boolean,
    public tagName: string,
    public xpath: string,
    public attributes: Record<string, string>,
    public children: DOMBaseNode[],
    public isInteractive: boolean = false,
    public isTopElement: boolean = false,
    public shadowRoot: boolean = false,
    public highlightIndex: number | null = null,
    parent: DOMElementNode | null = null
  ) {
    super(isVisible, parent);
  }

  toString(): string {
    let tagStr = `<${this.tagName}`;

    // Add attributes
    for (const [key, value] of Object.entries(this.attributes)) {
      tagStr += ` ${key}="${value}"`;
    }
    tagStr += '>';

    // Add extra info
    const extras: string[] = [];
    if (this.isInteractive) {
      extras.push('interactive');
    }
    if (this.isTopElement) {
      extras.push('top');
    }
    if (this.shadowRoot) {
      extras.push('shadow-root');
    }
    if (this.highlightIndex !== null) {
      extras.push(`highlight:${this.highlightIndex}`);
    }

    if (extras.length > 0) {
      tagStr += ` [${extras.join(', ')}]`;
    }

    return tagStr;
  }

  getAllTextTillNextClickableElement(): string {
    const textParts: string[] = [];

    const collectText = (node: DOMBaseNode): void => {
      // Skip this branch if we hit a highlighted element (except for the current node)
      if (node instanceof DOMElementNode && node !== this && node.highlightIndex !== null) {
        return;
      }

      if (node instanceof DOMTextNode) {
        textParts.push(node.text);
      } else if (node instanceof DOMElementNode) {
        for (const child of node.children) {
          collectText(child);
        }
      }
    };

    collectText(this);
    return textParts.join('\n').trim();
  }

  clickableElementsToString(includeAttributes: string[] = []): string {
    const formattedText: string[] = [];

    const processNode = (node: DOMBaseNode, depth: number): void => {
      if (node instanceof DOMElementNode) {
        // Add element with highlightIndex
        if (node.highlightIndex !== null) {
          let attributesStr = '';
          if (includeAttributes.length > 0) {
            attributesStr = ' ' + includeAttributes
              .map(key => node.attributes[key] ? `${key}="${node.attributes[key]}"` : '')
              .filter(Boolean)
              .join(' ');
          }
          formattedText.push(
            `${node.highlightIndex}[:]<${node.tagName}${attributesStr}>${node.getAllTextTillNextClickableElement()}</${node.tagName}>`
          );
        }

        // Process children regardless
        for (const child of node.children) {
          processNode(child, depth + 1);
        }
      } else if (node instanceof DOMTextNode) {
        // Add text only if it doesn't have a highlighted parent
        if (!node.hasParentWithHighlightIndex()) {
          formattedText.push(`_[:]{node.text}`);
        }
      }
    };

    processNode(this, 0);
    return formattedText.join('\n');
  }

  getFileUploadElement(checkSiblings: boolean = true): DOMElementNode | null {
    // Check if current element is a file input
    if (this.tagName === 'input' && this.attributes['type'] === 'file') {
      return this;
    }

    // Check children
    for (const child of this.children) {
      if (child instanceof DOMElementNode) {
        const result = child.getFileUploadElement(false);
        if (result) {
          return result;
        }
      }
    }

    // Check siblings only for the initial call
    if (checkSiblings && this.parent) {
      for (const sibling of this.parent.children) {
        if (sibling !== this && sibling instanceof DOMElementNode) {
          const result = sibling.getFileUploadElement(false);
          if (result) {
            return result;
          }
        }
      }
    }

    return null;
  }
}

export class ElementTreeSerializer {
  static serializeClickableElements(elementTree: DOMElementNode): string {
    return elementTree.clickableElementsToString();
  }

  static domElementNodeToJson(elementTree: DOMElementNode): Record<string, any> {
    const nodeToDict = (node: DOMBaseNode): Record<string, any> => {
      if (node instanceof DOMTextNode) {
        return { type: 'text', text: node.text };
      } else if (node instanceof DOMElementNode) {
        return {
          type: 'element',
          tagName: node.tagName,
          attributes: node.attributes,
          highlightIndex: node.highlightIndex,
          children: node.children.map(nodeToDict),
        };
      }
      return {};
    };

    return nodeToDict(elementTree);
  }
}

export type SelectorMap = Record<number, DOMElementNode>;

export interface DOMState {
  elementTree: DOMElementNode;
  selectorMap: SelectorMap;
}