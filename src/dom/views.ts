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
  parent?: DOMElementNode;
  hash?: string;
  getAllTextTillNextClickableElement(): string;
}

export class DOMTextNode implements DOMBaseNode {
  constructor(
    public text: string,
    public parent?: DOMElementNode,
    public hash?: string
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
    public parent?: DOMElementNode,
    public hash?: string,
    public shadowRoot?: DOMElementNode,
    public highlightIndex?: number
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
