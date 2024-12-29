import { createHash } from 'node:crypto';
import type { DOMElementNode } from '../browser/types/types';

export interface DOMHistoryElement {
  tag_name: string;
  xpath: string;
  highlight_index: number | null;
  entire_parent_branch_path: string[];
  attributes: Record<string, string>;
  shadow_root: boolean;
}

interface HashedDomElement {
  branch_path_hash: string;
  attributes_hash: string;
}

export function convertDOMElementToHistoryElement(dom_element: DOMElementNode): DOMHistoryElement {
  const parent_branch_path = getParentBranchPath(dom_element);
  return {
    tag_name: dom_element.tag_name,
    xpath: dom_element.xpath,
    highlight_index: dom_element.highlight_index,
    entire_parent_branch_path: parent_branch_path,
    attributes: dom_element.attributes,
    shadow_root: dom_element.shadow_root
  };
}

export function findHistoryElementInTree(
  dom_history_element: DOMHistoryElement,
  tree: DOMElementNode
): DOMElementNode | null {
  const hashed_dom_history_element = hashDomHistoryElement(dom_history_element);

  function processNode(node: DOMElementNode): DOMElementNode | null {
    if (node.highlight_index !== null) {
      const hashed_node = hashDomElement(node);
      if (
        hashed_node.branch_path_hash === hashed_dom_history_element.branch_path_hash &&
        hashed_node.attributes_hash === hashed_dom_history_element.attributes_hash
      ) {
        return node;
      }
    }
    for (const child of node.children) {
      if ('tag_name' in child) {
        const result = processNode(child as DOMElementNode);
        if (result !== null) {
          return result;
        }
      }
    }
    return null;
  }

  return processNode(tree);
}

function getParentBranchPath(dom_element: DOMElementNode): string[] {
  const parents: DOMElementNode[] = [];
  let current_element: DOMElementNode | null = dom_element;

  while (current_element.parent !== null) {
    parents.push(current_element);
    current_element = current_element.parent;
  }

  parents.reverse();
  return parents.map(parent => parent.tag_name);
}

function hashDomHistoryElement(dom_history_element: DOMHistoryElement): HashedDomElement {
  const branch_path_hash = hashParentBranchPath(dom_history_element.entire_parent_branch_path);
  const attributes_hash = hashAttributes(dom_history_element.attributes);

  return { branch_path_hash, attributes_hash };
}

function hashDomElement(dom_element: DOMElementNode): HashedDomElement {
  const parent_branch_path = getParentBranchPath(dom_element);
  const branch_path_hash = hashParentBranchPath(parent_branch_path);
  const attributes_hash = hashAttributes(dom_element.attributes);

  return { branch_path_hash, attributes_hash };
}

function hashParentBranchPath(parent_branch_path: string[]): string {
  const parent_branch_path_string = parent_branch_path.join('/');
  return createHash('sha256').update(parent_branch_path_string).digest('hex');
}

function hashAttributes(attributes: Record<string, string>): string {
  const attributes_string = Object.entries(attributes)
    .map(([key, value]) => `${key}=${value}`)
    .join('');
  return createHash('sha256').update(attributes_string).digest('hex');
}