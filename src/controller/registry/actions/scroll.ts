import type { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class ScrollAction extends ActionModel {
  constructor(
    public direction: 'up' | 'down',
    public amount?: number
  ) {
    super();
  }

  static getName(): string {
    return 'scroll';
  }

  static getPromptDescription(): string {
    return `scroll: Scroll the page
Parameters:
  - direction: Direction to scroll ('up' or 'down')
  - amount: (Optional) Amount to scroll in pixels. If not provided, scrolls by viewport height.
Example:
  {"scroll": {"direction": "down"}}
  {"scroll": {"direction": "up", "amount": 500}}`;
  }

  getIndex(): number | undefined {
    return undefined;
  }

  setIndex(_index: number): void {
    // No-op
  }

  static async execute(
    action: ScrollAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    try {
      const page = await browserContext.getCurrentPage();
      let amount = action.amount;

      if (amount === undefined) {
        const viewport = await page.viewportSize();
        amount = viewport?.height || 500;
      }

      if (action.direction === 'up') {
        amount = -amount;
      }

      await page.evaluate(`window.scrollBy(0, ${amount})`);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}