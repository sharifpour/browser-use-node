import type { Page } from 'playwright';
import { type DOMBaseNode, DOMElementNode, type DOMState, DOMTextNode, type SelectorMap } from './views';

// Load buildDomTree.js content at module initialization
const buildDomTreeJs = `
function buildDomTree(highlightElements) {
  let highlightIndex = 0;

  const isVisible = (element) => {
    if (!(element instanceof Element)) return true;
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  };

  const isInteractive = (element) => {
    if (!(element instanceof Element)) return false;
    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type')?.toLowerCase();
    const role = element.getAttribute('role')?.toLowerCase();

    // Check if element is naturally interactive
    if (['a', 'button', 'input', 'select', 'textarea'].includes(tagName)) return true;

    // Check for ARIA roles that indicate interactivity
    if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) return true;

    // Check for event listeners
    const hasClickListener = element.onclick !== null || element._click !== undefined;
    if (hasClickListener) return true;

    // Check for cursor style
    const style = window.getComputedStyle(element);
    if (style.cursor === 'pointer') return true;

    return false;
  };

  const getAttributes = (element) => {
    if (!(element instanceof Element)) return {};
    const attributes = {};
    for (const attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  };

  const getXPath = (element) => {
    if (!(element instanceof Element)) return '';
    let paths = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let hasFollowingSibling = false;
      for (let sibling = current.previousSibling; sibling; sibling = sibling.previousSibling) {
        if (sibling.nodeType !== Node.DOCUMENT_TYPE_NODE && sibling.nodeName === current.nodeName) {
          index++;
        }
      }

      for (let sibling = current.nextSibling; sibling && !hasFollowingSibling; sibling = sibling.nextSibling) {
        if (sibling.nodeName === current.nodeName) {
          hasFollowingSibling = true;
        }
      }

      const tagName = current.nodeName.toLowerCase();
      const pathIndex = index || hasFollowingSibling ? \`[\${index + 1}]\` : '';
      paths.unshift(tagName + pathIndex);

      if (current.id) {
        paths = [\`//*[@id='\${current.id}']\`];
        break;
      }

      current = current.parentNode;
    }

    return '/' + paths.join('/');
  };

  const processNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) return null;

      return {
        type: 'TEXT_NODE',
        text,
        isVisible: isVisible(node.parentElement)
      };
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node;
    const visible = isVisible(element);
    const interactive = isInteractive(element);

    // Skip invisible and non-interactive elements and their children
    if (!visible && !interactive) return null;

    const children = [];
    for (const child of element.childNodes) {
      const processedChild = processNode(child);
      if (processedChild) {
        children.push(processedChild);
      }
    }

    const result = {
      tagName: element.tagName.toLowerCase(),
      xpath: getXPath(element),
      attributes: getAttributes(element),
      isVisible: visible,
      isInteractive: interactive,
      children
    };

    if (highlightElements && interactive) {
      result.highlightIndex = highlightIndex++;
      element.setAttribute('data-highlight', result.highlightIndex.toString());
      element.style.outline = '2px solid red';
      element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    }

    return result;
  };

  return processNode(document.documentElement);
}
`;

interface NodeData {
  type?: string;
  text?: string;
  isVisible?: boolean;
  tagName?: string;
  xpath?: string;
  attributes?: Record<string, string>;
  isInteractive?: boolean;
  isTopElement?: boolean;
  highlightIndex?: number;
  shadowRoot?: boolean;
  children?: NodeData[];
}

export class DomService {
  private page: Page;
  private xpathCache: Record<string, any> = {};

  constructor(page: Page) {
    this.page = page;
  }

  async getElementTree(): Promise<DOMElementNode> {
    const elementTree = await this.buildDomTree(true);
    return elementTree;
  }

  async getClickableElements(highlightElements = true): Promise<DOMState> {
    const elementTree = await this.buildDomTree(highlightElements);
    const selectorMap = this.createSelectorMap(elementTree);

    return {
      elementTree,
      selectorMap
    };
  }

  private async buildDomTree(highlightElements: boolean): Promise<DOMElementNode> {
    // First, inject the buildDomTree function
    await this.page.evaluate(`window.buildDomTree = ${buildDomTreeJs}`);

    // Then call the function
    const evalPage = await this.page.evaluate(`buildDomTree(${highlightElements})`) as NodeData;
    const htmlToDict = this.parseNode(evalPage);

    if (!htmlToDict || !(htmlToDict instanceof DOMElementNode)) {
      throw new Error('Failed to parse HTML to dictionary');
    }

    return htmlToDict;
  }

  private createSelectorMap(elementTree: DOMElementNode): SelectorMap {
    const selectorMap: SelectorMap = {};

    const processNode = (node: DOMBaseNode) => {
      if (node instanceof DOMElementNode && node.highlightIndex !== undefined) {
        selectorMap[node.highlightIndex] = node;
      }

      if (node instanceof DOMElementNode) {
        for (const child of node.children) {
          processNode(child);
        }
      }
    };

    processNode(elementTree);
    return selectorMap;
  }

  private parseNode(
    nodeData: NodeData,
    parent?: DOMElementNode
  ): DOMBaseNode | null {
    if (!nodeData) {
      return null;
    }

    if (nodeData.type === 'TEXT_NODE') {
      return new DOMTextNode(
        nodeData.text || '',
        parent
      );
    }

    const tagName = nodeData.tagName || '';

    const elementNode = new DOMElementNode(
      tagName,
      nodeData.xpath || '',
      nodeData.attributes || {},
      [],
      parent,
      undefined,
      undefined,
      nodeData.highlightIndex
    );

    const children: DOMBaseNode[] = [];
    for (const child of nodeData.children || []) {
      if (child) {
        const childNode = this.parseNode(child, elementNode);
        if (childNode) {
          children.push(childNode);
        }
      }
    }

    elementNode.children = children;

    return elementNode;
  }
}
