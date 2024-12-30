import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class InputTextAction extends ActionModel {
  index: number;
  text: string;

  constructor(data?: Record<string, any>) {
    super();
    if (data && typeof data.index === 'number' && typeof data.text === 'string') {
      this.index = data.index;
      this.text = data.text;
    } else {
      throw new Error('Index and text are required for input text action');
    }
  }

  static getName(): string {
    return 'input_text';
  }

  static getPromptDescription(): string {
    return `input_text: Input text into an element
Parameters:
  - index: Index of the element to input text into
  - text: Text to input
Example:
  {"input_text": {"index": 1, "text": "Hello World"}}`;
  }

  getIndex(): number {
    return this.index;
  }

  setIndex(index: number): void {
    this.index = index;
  }

  static async execute(
    action: InputTextAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    try {
      const element = await browserContext.getElementByIndex(action.index);
      if (!element) {
        return new ActionResult({
          error: `Element with index ${action.index} not found`,
          includeInMemory: true
        });
      }

      await element.fill(action.text);
      return new ActionResult({
        isDone: false,
        extractedContent: `Input text "${action.text}" into element ${action.index}`,
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