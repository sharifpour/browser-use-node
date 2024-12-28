import type { TabInfo } from './types';

export interface BrowserStateHistoryData {
  url: string;
  title: string;
  tabs: TabInfo[];
  interacted_element: (Element | null)[];
  screenshot?: string;
}

export const BrowserStateHistoryUtils = {
  create(data: BrowserStateHistoryData): BrowserStateHistoryData {
    return {
      url: data.url,
      title: data.title,
      tabs: data.tabs,
      interacted_element: data.interacted_element,
      screenshot: data.screenshot
    };
  }
};