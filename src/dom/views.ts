// Python source reference:
// """
// DOM views.
// """
//
// from dataclasses import dataclass
// from typing import Any, Dict, List, Optional
//
// @dataclass
// class DOMBaseNode:
// 	"""Base node."""
//
// 	parent: Optional['DOMElementNode'] = None
// 	hash: Optional[str] = None
//
// 	def get_all_text_till_next_clickable_element(self) -> str:
// 		"""Get all text till next clickable element."""
// 		return ''
//
// @dataclass
// class DOMTextNode(DOMBaseNode):
// 	"""Text node."""
//
// 	text: str
//
// 	def get_all_text_till_next_clickable_element(self) -> str:
// 		"""Get all text till next clickable element."""
// 		return self.text
//
// @dataclass
// class DOMElementNode(DOMBaseNode):
// 	"""Element node."""
//
// 	tag_name: str
// 	xpath: str
// 	attributes: Dict[str, str]
// 	children: List[DOMBaseNode]
// 	shadow_root: Optional['DOMElementNode'] = None
// 	highlight_index: Optional[int] = None
//
// 	def get_all_text_till_next_clickable_element(self) -> str:
// 		"""Get all text till next clickable element."""
// 		if self.highlight_index is not None:
// 			return ''
//
// 		text = ''
// 		for child in self.children:
// 			text += child.get_all_text_till_next_clickable_element()
// 		return text
//
// 	def clickable_elements_to_string(self, include_attributes: Optional[List[str]] = None) -> str:
// 		"""Convert clickable elements to string."""
// 		elements = []
// 		if self.highlight_index is not None:
// 			element_str = f'{self.highlight_index}[:]<{self.tag_name}>'
// 			if include_attributes:
// 				for attr in include_attributes:
// 					if attr in self.attributes:
// 						element_str += f' {attr}="{self.attributes[attr]}"'
// 			element_str += f'</{self.tag_name}>'
// 			elements.append(element_str)
//
// 		for child in self.children:
// 			if isinstance(child, DOMElementNode):
// 				elements.extend(child.clickable_elements_to_string(include_attributes).split('\n'))
//
// 		return '\n'.join(elements)

export interface DOMBaseNode {
  isVisible: boolean;
  parent?: DOMElementNode;
  getAllTextTillNextClickableElement(): string;
}

export class DOMTextNode implements DOMBaseNode {
  constructor(
    public text: string,
    public isVisible: boolean,
    public parent?: DOMElementNode,
    public type: 'TEXT_NODE' = 'TEXT_NODE'
  ) { }

  getAllTextTillNextClickableElement(): string {
    return this.text;
  }
}

export class DOMElementNode implements DOMBaseNode {
  constructor(
    public tagName: string,
    public xpath: string,
    public attributes: Record<string, string>,
    public children: DOMBaseNode[],
    public isVisible: boolean,
    public isInteractive: boolean,
    public isTopElement: boolean,
    public shadowRoot: boolean,
    public highlightIndex?: number,
    public parent?: DOMElementNode
  ) { }

  getAllTextTillNextClickableElement(): string {
    if (this.highlightIndex !== undefined) {
      return '';
    }

    return this.children
      .map(child => child.getAllTextTillNextClickableElement())
      .join('');
  }

  clickableElementsToString(includeAttributes?: string[]): string {
    const elements: string[] = [];

    if (this.highlightIndex !== undefined) {
      let elementStr = `${this.highlightIndex}[:]<${this.tagName}>`;
      if (includeAttributes) {
        for (const attr of includeAttributes) {
          if (attr in this.attributes) {
            elementStr += ` ${attr}="${this.attributes[attr]}"`;
          }
        }
      }
      elementStr += `</${this.tagName}>`;
      elements.push(elementStr);
    }

    for (const child of this.children) {
      if (child instanceof DOMElementNode) {
        elements.push(...child.clickableElementsToString(includeAttributes).split('\n'));
      }
    }

    return elements.join('\n');
  }
}

export type SelectorMap = Record<number, DOMElementNode>;

export interface DOMState {
  elementTree: DOMElementNode;
  selectorMap: SelectorMap;
}

export class ElementTreeSerializer {
  static serializeClickableElements(elementTree: DOMElementNode): string {
    let result = '';

    function processNode(node: DOMBaseNode, depth: number): void {
      if (node instanceof DOMElementNode && node.highlightIndex !== undefined) {
        result += `${node.highlightIndex}[:]<${node.tagName}>${ElementTreeSerializer.getNodeDescription(node)}</${node.tagName}>\n`;
      }

      if (node instanceof DOMElementNode) {
        for (const child of node.children) {
          processNode(child, depth + 1);
        }
      }
    }

    processNode(elementTree, 0);
    return result;
  }

  private static getNodeDescription(node: DOMElementNode): string {
    const attrs = [];
    for (const [key, value] of Object.entries(node.attributes)) {
      if (key === 'aria-label' || key === 'role' || key === 'title' || key === 'name' || key === 'placeholder') {
        attrs.push(`${key}="${value}"`);
      }
    }
    return attrs.length > 0 ? attrs.join(' ') : '';
  }

  static domElementNodeToJson(elementTree: DOMElementNode): Record<string, any> {
    function nodeToDict(node: DOMBaseNode): Record<string, any> {
      if (node instanceof DOMTextNode) {
        return {
          type: 'TEXT_NODE',
          text: node.text,
          isVisible: node.isVisible
        };
      }

      const elementNode = node as DOMElementNode;
      return {
        tagName: elementNode.tagName,
        xpath: elementNode.xpath,
        attributes: elementNode.attributes,
        children: elementNode.children.map(nodeToDict),
        isVisible: elementNode.isVisible,
        isInteractive: elementNode.isInteractive,
        isTopElement: elementNode.isTopElement,
        highlightIndex: elementNode.highlightIndex,
        shadowRoot: elementNode.shadowRoot
      };
    }

    return nodeToDict(elementTree);
  }
}
