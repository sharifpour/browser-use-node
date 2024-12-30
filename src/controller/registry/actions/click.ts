import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class ClickAction extends ActionModel {
  index: number;

  constructor(data?: Record<string, any>) {
    super();
    if (data && typeof data.index === 'number') {
      this.index = data.index;
    } else {
      throw new Error('Index is required for click action');
    }
  }

  static getName(): string {
    return 'click_element';
  }

  static getPromptDescription(): string {
    return `click_element: Click on an element
Parameters:
  - index: Index of the element to click
Example:
  {"click_element": {"index": 1}}`;
  }

  getIndex(): number {
    return this.index;
  }

  setIndex(index: number): void {
    this.index = index;
  }

  static async execute(
    action: ClickAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    const page = await browserContext.getCurrentPage();
    const elements = await page.locator(`[data-highlight-index="${action.index}"]`).all();

    if (elements.length === 0) {
      return new ActionResult({
        isDone: false,
        extractedContent: null,
        error: `Element with index ${action.index} not found`,
        includeInMemory: true
      });
    }

    try {
      await elements[0].click();
      return new ActionResult({
        isDone: false,
        extractedContent: `Clicked element ${action.index}`,
        error: null,
        includeInMemory: true
      });
    } catch (error) {
      return new ActionResult({
        isDone: false,
        extractedContent: null,
        error: error instanceof Error ? error.message : String(error),
        includeInMemory: true
      });
    }
  }
}