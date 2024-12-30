import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { logger } from '../../../utils/logging';
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
    try {
      // Update state to refresh element mappings
      await browserContext.getState();

      // Get element by index
      const element = await browserContext.getElementByIndex(action.index);
      if (!element) {
        logger.debug(`No element found with index ${action.index}`);
        return new ActionResult({
          isDone: false,
          extractedContent: null,
          error: `Element with index ${action.index} not found`,
          includeInMemory: true
        });
      }

      // Get element info for logging
      const tagName = await element.evaluate(el => (el as HTMLElement).tagName.toLowerCase());
      const type = await element.evaluate(el => (el as HTMLElement).getAttribute('type')?.toLowerCase() || '');
      logger.debug(`Element info - tag: ${tagName}, type: ${type}`);

      // Click with navigation handling for submit buttons and links
      const expectsNavigation = (tagName === 'input' && type === 'submit') || tagName === 'a';
      await browserContext.clickElement(element, expectsNavigation);

      return new ActionResult({
        isDone: expectsNavigation, // Mark as done if we navigated
        extractedContent: `Clicked element ${action.index}`,
        error: null,
        includeInMemory: true
      });
    } catch (error) {
      logger.debug(`Click action failed: ${error}`);
      return new ActionResult({
        isDone: false,
        extractedContent: null,
        error: error instanceof Error ? error.message : String(error),
        includeInMemory: true
      });
    }
  }
}