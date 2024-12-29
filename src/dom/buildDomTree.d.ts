interface ProcessedNode {
  type: 'TEXT_NODE' | 'ELEMENT_NODE';
  text?: string;
  tagName?: string;
  xpath?: string;
  attributes?: Record<string, string>;
  children?: ProcessedNode[];
  isVisible: boolean;
  isInteractive?: boolean;
  isTopElement?: boolean;
  shadowRoot?: boolean;
  highlightIndex?: number | null;
}

declare const buildDomTree: (doHighlightElements?: boolean) => ProcessedNode;
export default buildDomTree;