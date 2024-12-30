import { readFileSync } from 'fs';
import { join } from 'path';
import { Page } from 'playwright';
import { DOMBaseNode, DOMElementNode, DOMState, DOMTextNode, SelectorMap } from './views';

export class DomService {
  private xpathCache: Record<string, any> = {};

  constructor(private page: Page) { }

  async getClickableElements(highlightElements = true): Promise<DOMState> {
    const elementTree = await this.buildDomTree(highlightElements);
    const selectorMap = this.createSelectorMap(elementTree);

    return {
      elementTree,
      selectorMap
    };
  }

  private async buildDomTree(highlightElements: boolean): Promise<DOMElementNode> {
    // TODO: Read the JS code from a file like Python does
    const jsCode = readFileSync(join(__dirname, 'buildDomTree.js'), 'utf8');


    await this.page.evaluate(`window.buildDomTree = ${jsCode}`);

    const evalPage = await this.page.evaluate(`window.buildDomTree(${highlightElements})`);
    

    const htmlToDict = this.parseNode(evalPage);

    if (!htmlToDict || !(htmlToDict instanceof DOMElementNode)) {
      throw new Error('Failed to parse HTML to dictionary');
    }

    return htmlToDict;
  }

  private createSelectorMap(elementTree: DOMElementNode): SelectorMap {
    const selectorMap: SelectorMap = {};

    const processNode = (node: DOMBaseNode): void => {
      if (node instanceof DOMElementNode) {
        if (node.highlightIndex !== undefined) {
          selectorMap[node.highlightIndex] = node;
        }

        for (const child of node.children) {
          processNode(child);
        }
      }
    };

    processNode(elementTree);
    return selectorMap;
  }

  private parseNode(nodeData: any, parent?: DOMElementNode): DOMBaseNode | null {
    if (!nodeData) {
      return null;
    }

    if (nodeData.type === 'TEXT_NODE') {
      return new DOMTextNode(
        nodeData.text,
        nodeData.isVisible,
        parent
      );
    }

    const elementNode = new DOMElementNode(
      nodeData.tagName,
      nodeData.xpath,
      nodeData.attributes || {},
      [],
      nodeData.isVisible ?? false,
      nodeData.isInteractive ?? false,
      nodeData.isTopElement ?? false,
      nodeData.shadowRoot ?? false,
      nodeData.highlightIndex,
      parent
    );

    const children: DOMBaseNode[] = [];
    for (const child of nodeData.children || []) {
      if (child !== null) {
        const childNode = this.parseNode(child, elementNode);
        if (childNode !== null) {
          children.push(childNode);
        }
      }
    }

    elementNode.children = children;
    return elementNode;
  }

  private isDOMElementNode(node: any): node is DOMElementNode {
    return node instanceof DOMElementNode;
  }
}
