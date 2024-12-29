/**
 * DOM element node
 */
export interface DOMBaseNode {
  is_visible: boolean;
  parent: DOMElementNode | null;
}

export interface DOMTextNode extends DOMBaseNode {
  text: string;
  type: 'TEXT_NODE';
}

export interface DOMElementNode extends DOMBaseNode {
  type: 'ELEMENT_NODE';
  tag_name: string;
  xpath: string;
  attributes: Record<string, string>;
  children: DOMElementNode[];
  is_interactive: boolean;
  is_top_element: boolean;
  shadow_root: boolean;
  highlight_index: number | null;
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
    if (node.is_interactive && node.is_visible && node.is_top_element) {
      const attrs = include_attributes
        .map(attr => node.attributes[attr] ? `${attr}="${node.attributes[attr]}"` : null)
        .filter(Boolean)
        .join(' ');

      elements.push(`${node.highlight_index}[:]<${node.tag_name}${attrs ? ` ${attrs}` : ''}>`);
    }

    // Traverse children
    for (const child of node.children) {
      this.traverse_clickable(child, elements, include_attributes);
    }
  }
}