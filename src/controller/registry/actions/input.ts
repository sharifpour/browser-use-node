import type { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class InputAction extends ActionModel {
  constructor(
    public index: number,
    public text: string
  ) {
    super();
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
  {"input_text": {"index": 1, "text": "Hello, world!"}}`;
  }

  getIndex(): number {
    return this.index;
  }

  setIndex(index: number): void {
    this.index = index;
  }

  static async execute(
    action: InputAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    const element = await browserContext.getDomElementByIndex(action.index);
    if (!element) {
      return { error: `Element with index ${action.index} not found` };
    }

    try {
      await browserContext.inputTextElementNode(element, action.text);
      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}