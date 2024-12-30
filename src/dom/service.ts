import { readFileSync } from 'fs';
import { join } from 'path';
import type { Page } from 'playwright';
import { DOMBaseNode, DOMElementNode, DOMState, DOMTextNode, SelectorMap } from './types';

declare global {
  interface Window {
    getDomTree: (highlightElements: boolean) => any;
  }
}

export class DomService {
  private readonly page: Page;
  private readonly domScriptPath: string;

  constructor(page: Page) {
    this.page = page;
    this.domScriptPath = join(__dirname, './buildDomTree.js');
  }

  async getDomState(highlightElements = false): Promise<DOMState> {
    const domScript = readFileSync(this.domScriptPath, 'utf-8');
    await this.page.evaluate(`window.getDomTree = ${domScript}`);
    await this.page.evaluate(`window.getDomTree(${highlightElements})`);

    const htmlToDict = await this.buildDomTree(highlightElements);
    const selectorMap = this.createSelectorMap(htmlToDict);

    return {
      elementTree: htmlToDict,
      selectorMap,
    };
  }

  private async buildDomTree(highlightElements: boolean): Promise<DOMElementNode> {
    const domScript = readFileSync(this.domScriptPath, 'utf-8');
    await this.page.evaluate(domScript);

    const htmlToDict = await this.page.evaluate((highlightElements: boolean) => {
      return window.getDomTree(highlightElements);
    }, highlightElements);

    const parsedDict = this.parseNode(htmlToDict);
    if (!parsedDict || !(parsedDict instanceof DOMElementNode)) {
      throw new Error('Failed to build DOM tree');
    }

    return parsedDict;
  }

  private createSelectorMap(elementTree: DOMElementNode): SelectorMap {
    const selectorMap: SelectorMap = {};

    const processNode = (node: DOMBaseNode): void => {
      if (node instanceof DOMElementNode) {
        if (node.highlightIndex !== null) {
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
    if (!nodeData || typeof nodeData !== 'object') {
      return null;
    }

    if (nodeData.type === 'TEXT_NODE') {
      return new DOMTextNode(
        nodeData.isVisible,
        nodeData.text,
        parent || null
      );
    }

    const elementNode = new DOMElementNode(
      nodeData.isVisible,
      nodeData.tagName,
      nodeData.xpath,
      nodeData.attributes,
      [],
      nodeData.isInteractive,
      nodeData.isTopElement,
      nodeData.shadowRoot,
      nodeData.highlightIndex,
      parent || null
    );

    if (Array.isArray(nodeData.children)) {
      elementNode.children = nodeData.children
        .map((child: any) => this.parseNode(child, elementNode))
        .filter((node: any): node is DOMBaseNode => node !== null);
    }

    return elementNode;
  }

  private isDOMElementNode(node: any): node is DOMElementNode {
    return node instanceof DOMElementNode;
  }
}
