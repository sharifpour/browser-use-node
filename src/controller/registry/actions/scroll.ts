import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class ScrollAction extends ActionModel {
  direction: 'up' | 'down';
  amount?: number;

  constructor(data?: Record<string, any>) {
    super();
    if (data) {
      if (data.direction !== 'up' && data.direction !== 'down') {
        throw new Error('Direction must be "up" or "down"');
      }
      this.direction = data.direction;
      if (data.amount !== undefined) {
        if (typeof data.amount !== 'number') {
          throw new Error('Amount must be a number');
        }
        this.amount = data.amount;
      }
    } else {
      throw new Error('Direction is required for scroll action');
    }
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

  getIndex(): number | null {
    return null;
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

      await page.evaluate((scrollAmount: number) => {
        window.scrollBy(0, scrollAmount);
      }, amount);

      return new ActionResult({
        isDone: false,
        extractedContent: `Scrolled ${action.direction} by ${Math.abs(amount)}px`,
        error: null,
        includeInMemory: true
      });
    } catch (error) {
      return new ActionResult({
        error: error instanceof Error ? error.message : String(error),
        includeInMemory: true
      });
    }
  }
}