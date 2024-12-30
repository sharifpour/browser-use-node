import type { DOMElementNode, SelectorMap } from '../dom/views';

// Python source reference:
// """
// Browser views.
// """
//
// from dataclasses import dataclass
// from typing import Any, Dict, List, Optional
//
// from browser_use.dom.views import DOMElementNode
//
//
// class BrowserError(Exception):
// 	"""Browser error."""
//
// 	pass
//
//
// @dataclass
// class TabInfo:
// 	"""Tab info."""
//
// 	page_id: int
// 	url: str
// 	title: str
//
//
// @dataclass
// class BrowserState:
// 	"""Browser state."""
//
// 	element_tree: DOMElementNode
// 	selector_map: dict[str, str]
// 	url: str
// 	title: str
// 	screenshot: Optional[str] = None
// 	tabs: list[TabInfo] = None

export interface TabInfo {
  pageId: number;
  url: string;
  title: string;
}

export interface BrowserTab extends Omit<TabInfo, 'pageId'> {
  pageId: string;
}

export interface BrowserState {
  elementTree: DOMElementNode;
  selectorMap: SelectorMap;
  url: string;
  title: string;
  tabs: BrowserTab[];
  screenshot?: string;
}

export class BrowserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserError';
  }
}

export class BrowserStateHistory {
  constructor(
    private data: {
      url: string;
      title: string;
      tabs: BrowserTab[];
      interactedElement: (string | null)[];
      screenshot: string | null;
    }
  ) { }

  toDict(): Record<string, any> {
    return {
      url: this.data.url,
      title: this.data.title,
      tabs: this.data.tabs.map(tab => ({
        page_id: tab.pageId,
        title: tab.title,
        url: tab.url
      })),
      interacted_element: this.data.interactedElement,
      screenshot: this.data.screenshot
    };
  }

  static fromDict(data: Record<string, any>): BrowserStateHistory {
    return new BrowserStateHistory({
      url: data.url,
      title: data.title,
      tabs: data.tabs.map((tab: any) => ({
        pageId: tab.page_id,
        title: tab.title,
        url: tab.url
      })),
      interactedElement: data.interacted_element,
      screenshot: data.screenshot
    });
  }
}
