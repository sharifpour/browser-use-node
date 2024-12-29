// Python source reference:
// from dataclasses import dataclass
// from typing import Optional
//
// @dataclass
// class HashedDomElement:
// 	"""
// 	Hash of the dom element to be used as a unique identifier
// 	"""
//
// 	branch_path_hash: str
// 	attributes_hash: str
// 	# text_hash: str
//
// @dataclass
// class DOMHistoryElement:
// 	tag_name: str
// 	xpath: str
// 	highlight_index: Optional[int]
// 	entire_parent_branch_path: list[str]
// 	attributes: dict[str, str]
// 	shadow_root: bool = False
//
// 	def to_dict(self) -> dict:
// 		return {
// 			'tag_name': self.tag_name,
// 			'xpath': self.xpath,
// 			'highlight_index': self.highlight_index,
// 			'entire_parent_branch_path': self.entire_parent_branch_path,
// 			'attributes': self.attributes,
// 			'shadow_root': self.shadow_root,
// 		}

// TypeScript implementation:

export interface HashedDomElement {
  branchPathHash: string;
  attributesHash: string;
  // textHash: string; // Commented out as in Python
}

export interface DOMHistoryElement {
  tagName: string;
  xpath: string;
  highlightIndex: number | null;
  entireParentBranchPath: string[];
  attributes: Record<string, string>;
  shadowRoot: boolean;

  toDict(): Record<string, unknown>;
}

export class DOMHistoryElementImpl implements DOMHistoryElement {
  constructor(
    public tagName: string,
    public xpath: string,
    public highlightIndex: number | null,
    public entireParentBranchPath: string[],
    public attributes: Record<string, string>,
    public shadowRoot = false
  ) { }

  toDict(): Record<string, unknown> {
    return {
      tagName: this.tagName,
      xpath: this.xpath,
      highlightIndex: this.highlightIndex,
      entireParentBranchPath: this.entireParentBranchPath,
      attributes: this.attributes,
      shadowRoot: this.shadowRoot,
    };
  }
}