import type { DOMHistoryElement } from '../dom/history_tree_processor/service';
import type { DOMState } from '../dom/views';

export interface TabInfo {
  pageId: number;
  url: string;
  title: string;
}

export interface BrowserState extends DOMState {
  url: string;
  title: string;
  tabs: TabInfo[];
  screenshot?: string;
}

export class BrowserStateHistory {
  constructor(
    public url: string,
    public title: string,
    public tabs: TabInfo[],
    public interactedElement: (DOMHistoryElement | null)[],
    public screenshot: string | null = null
  ) { }

  toDict(): Record<string, any> {
    return {
      url: this.url,
      title: this.title,
      tabs: this.tabs.map(tab => ({
        page_id: tab.pageId,
        title: tab.title,
        url: tab.url
      })),
      interacted_element: this.interactedElement.map(el =>
        el ? {
          tag_name: el.tagName,
          xpath: el.xpath,
          highlight_index: el.highlightIndex,
          entire_parent_branch_path: el.entireParentBranchPath,
          attributes: el.attributes,
          shadow_root: el.shadowRoot
        } : null
      ),
      screenshot: this.screenshot
    };
  }
}

export class BrowserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserError';
  }
}
