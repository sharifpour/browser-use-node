import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class ExtractAction extends ActionModel {
  index?: number;

  constructor(data?: Record<string, any>) {
    super();
    if (data && data.index !== undefined) {
      if (typeof data.index !== 'number') {
        throw new Error('Index must be a number');
      }
      this.index = data.index;
    }
  }

  static getName(): string {
    return 'extract_page_content';
  }

  static getPromptDescription(): string {
    return `extract_page_content: Extract content from the page
Parameters:
  - index: (Optional) Index of the element to extract content from. If not provided, extracts from the entire page.
Example:
  {"extract_page_content": {}}
  {"extract_page_content": {"index": 1}}`;
  }

  getIndex(): number | null {
    return this.index ?? null;
  }

  setIndex(index: number): void {
    this.index = index;
  }

  static async execute(
    action: ExtractAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    try {
      if (action.index !== undefined) {
        const element = await browserContext.getElementByIndex(action.index);
        if (!element) {
          return new ActionResult({
            error: `Element with index ${action.index} not found`,
            includeInMemory: true
          });
        }
        const text = await element.textContent() || '';
        return new ActionResult({
          isDone: false,
          extractedContent: text,
          error: null,
          includeInMemory: true
        });
      }

      const page = await browserContext.getCurrentPage();
      const content = await page.$eval('body', el => el.textContent || '');
      return new ActionResult({
        isDone: false,
        extractedContent: content,
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