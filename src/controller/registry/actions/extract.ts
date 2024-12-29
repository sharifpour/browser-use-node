import type { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class ExtractAction extends ActionModel {
  constructor(public index?: number) {
    super();
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

  getIndex(): number | undefined {
    return this.index;
  }

  setIndex(index: number): void {
    this.index = index;
  }

  static async execute(
    action: ExtractAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    if (action.index !== undefined) {
      const element = await browserContext.getDomElementByIndex(action.index);
      if (!element) {
        return { error: `Element with index ${action.index} not found` };
      }
      return { extractedContent: element.getAllTextTillNextClickableElement() };
    }

    const page = await browserContext.getCurrentPage();
    const content = await page.$eval('body', el => el.textContent || '');
    return { extractedContent: content };
  }
}