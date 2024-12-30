import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

type TabActionType = 'new' | 'switch' | 'close';

export class TabAction extends ActionModel {
  action: TabActionType;
  url?: string;
  pageId?: number;

  constructor(data?: Record<string, any>) {
    super();
    if (data && typeof data.action === 'string' && ['new', 'switch', 'close'].includes(data.action)) {
      this.action = data.action as TabActionType;
      if (data.url !== undefined) {
        this.url = String(data.url);
      }
      if (data.pageId !== undefined) {
        this.pageId = Number(data.pageId);
      }
    } else {
      throw new Error('Action is required for tab action');
    }
  }

  static getName(): string {
    return 'tab';
  }

  static getPromptDescription(): string {
    return `tab: Manage browser tabs
Parameters:
  - action: Action to perform ('new', 'switch', 'close')
  - url: (Optional) URL to open in new tab (only for 'new' action)
  - page_id: (Optional) ID of tab to switch to (only for 'switch' action)
Example:
  {"tab": {"action": "new", "url": "https://example.com"}}
  {"tab": {"action": "switch", "page_id": 1}}
  {"tab": {"action": "close"}}`;
  }

  getIndex(): number | null {
    return null;
  }

  setIndex(_index: number): void {
    // No-op
  }

  static async execute(
    action: TabAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    try {
      switch (action.action) {
        case 'new':
          await browserContext.createNewTab(action.url);
          break;
        case 'switch':
          if (action.pageId === undefined) {
            return new ActionResult({ error: 'Page ID is required for switch action' });
          }
          await browserContext.switchToTab(action.pageId);
          break;
        case 'close':
          await browserContext.closeCurrentTab();
          break;
        default:
          return new ActionResult({ error: `Invalid tab action: ${action.action}` });
      }
      return new ActionResult({});
    } catch (error) {
      return new ActionResult({ error: error instanceof Error ? error.message : String(error) });
    }
  }
}