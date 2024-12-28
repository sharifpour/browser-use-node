import { createHash } from 'node:crypto';
import type { DOMElementNode, DOMHistoryElement } from './types';

/**
 * Hash of the dom element to be used as a unique identifier
 */
export interface HashedDomElement {
  /**
   * Hash of the parent branch path
   */
  branch_path_hash: string;

  /**
   * Hash of the element attributes
   */
  attributes_hash: string;
}

export const hashDomElement = (domElement: DOMElementNode): HashedDomElement => {
  const parentBranchPath = getParentBranchPath(domElement);
  const branchPathHash = parentBranchPathHash(parentBranchPath);
  const attributesHash = getAttributesHash(domElement.attributes);

  return {
    branch_path_hash: branchPathHash,
    attributes_hash: attributesHash
  };
};

export const hashDomHistoryElement = (domHistoryElement: DOMHistoryElement): HashedDomElement => {
  const branchPathHash = parentBranchPathHash(domHistoryElement.entireParentBranchPath);
  const attributesHash = getAttributesHash(domHistoryElement.attributes);

  return {
    branch_path_hash: branchPathHash,
    attributes_hash: attributesHash
  };
};

const getParentBranchPath = (domElement: DOMElementNode): string[] => {
  const path: string[] = [];
  let current = domElement;

  while (current.parent) {
    path.push(current.tag);
    current = current.parent;
  }

  return path.reverse();
};

const parentBranchPathHash = (parentBranchPath: string[]): string => {
  const pathString = parentBranchPath.join('/');
  return createHash('sha256').update(pathString).digest('hex');
};

const getAttributesHash = (attributes: Record<string, string>): string => {
  const sortedEntries = Object.entries(attributes).sort(([a], [b]) => a.localeCompare(b));
  const attributesString = sortedEntries.map(([key, value]) => `${key}=${value}`).join('&');
  return createHash('sha256').update(attributesString).digest('hex');
};