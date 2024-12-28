/**
 * DOM element node
 */
export interface DOMElementNode {
  index: number;
  tag: string;
  text: string;
  attributes: Record<string, string>;
  children: DOMElementNode[];
  is_clickable: boolean;
}

/**
 * DOM element tree
 */
export class DOMElementTree {
  constructor(private readonly root: DOMElementNode) { }

  public clickable_elements_to_string(include_attributes: string[] = []): string {
    const elements: string[] = [];
    this.traverse_clickable(this.root, elements, include_attributes);
    return elements.join('\n');
  }

  private traverse_clickable(node: DOMElementNode, elements: string[], include_attributes: string[]): void {
    // Add current node if clickable
    if (node.is_clickable) {
      const attrs = include_attributes
        .map(attr => node.attributes[attr] ? `${attr}="${node.attributes[attr]}"` : null)
        .filter(Boolean)
        .join(' ');

      elements.push(`${node.index}[:]<${node.tag}${attrs ? ` ${attrs}` : ''}>${node.text}</${node.tag}>`);
    } else if (node.text.trim()) {
      // Add non-clickable text nodes for context
      elements.push(`_[:] ${node.text.trim()}`);
    }

    // Traverse children
    for (const child of node.children) {
      this.traverse_clickable(child, elements, include_attributes);
    }
  }
}