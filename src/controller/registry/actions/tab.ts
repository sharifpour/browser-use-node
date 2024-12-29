import type { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

type TabActionType = 'new' | 'switch' | 'close';

export class TabAction extends ActionModel {
  constructor(
    public action: TabActionType,
    public url?: string,
    public pageId?: number
  ) {
    super();
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

  getIndex(): number | undefined {
    return undefined;
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
            return { error: 'Page ID is required for switch action' };
          }
          await browserContext.switchToTab(action.pageId);
          break;
        case 'close':
          await browserContext.closeCurrentTab();
          break;
        default:
          return { error: `Invalid tab action: ${action.action}` };
      }
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}