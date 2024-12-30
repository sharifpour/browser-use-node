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
      // Update the DOM state to ensure we have the latest element mapping
      await browserContext.getState();

      const page = await browserContext.getCurrentPage();
      logger.debug(`Attempting to click element with index ${action.index}`);

      // First check if element exists
      const elements = await page.$$(`[browser-user-highlight-id="playwright-highlight-${action.index}"]`);
      if (elements.length === 0) {
        logger.debug(`No elements found with browser-user-highlight-id=playwright-highlight-${action.index}`);
        return new ActionResult({
          isDone: false,
          extractedContent: null,
          error: `Element with index ${action.index} not found`,
          includeInMemory: true
        });
      }

      logger.debug(`Found ${elements.length} elements with index ${action.index}`);
      const element = elements[0];

      // Get element info
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const type = await element.evaluate(el => (el as HTMLElement).getAttribute('type')?.toLowerCase() || '');
      logger.debug(`Element info - tag: ${tagName}, type: ${type}, visible: ${isVisible}, enabled: ${isEnabled}`);

      // Try to scroll the element into view
      await element.scrollIntoViewIfNeeded();

      // Wait for element to be stable
      await page.waitForTimeout(1000);

      // Try different interaction strategies based on element type
      try {
        if (tagName === 'input' && type === 'submit') {
          logger.debug('Attempting form submission');
          // Try submitting the form first
          const form = await element.evaluate(el => el.closest('form'));
          if (form) {
            await element.evaluate(el => {
              const form = el.closest('form');
              if (form) form.submit();
            });
          } else {
            // If no form found, try clicking
            await element.click({ timeout: 5000 });
          }
        } else {
          logger.debug('Attempting standard click');
          await element.click({ timeout: 5000 });
        }
      } catch (clickError) {
        logger.debug(`Standard interaction failed: ${clickError}`);
        try {
          logger.debug('Attempting click with JavaScript');
          await element.evaluate((el: HTMLElement) => {
            // Try multiple methods
            if (el.click) el.click();
            if (el.dispatchEvent) {
              el.dispatchEvent(new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
              }));
            }
          });
        } catch (jsClickError) {
          logger.debug(`JavaScript click failed: ${jsClickError}`);
          // Try pressing Enter key as last resort for form elements
          if (tagName === 'input' && type === 'submit') {
            logger.debug('Attempting Enter key press');
            await element.press('Enter');
          } else {
            throw jsClickError;
          }
        }
      }

      return new ActionResult({
        isDone: false,
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