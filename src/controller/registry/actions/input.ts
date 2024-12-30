import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { logger } from '../../../utils/logging';
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

  getIndex(): number {
    return this.index;
  }

  setIndex(index: number): void {
    this.index = index;
  }

  static getPromptDescription(): string {
    return `input_text: Input text into an element
Parameters:
  - index: Index of the element to input text into
  - text: Text to input
Example:
  {"input_text": {"index": 1, "text": "Hello, world!"}}`;
  }

  static async execute(
    action: InputAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    try {
      const session = await browserContext.getSession();
      const state = session.cachedState;

      const elementNode = state.selectorMap[action.index];
      if (!elementNode) {
        return new ActionResult({
          error: `Element index ${action.index} does not exist - retry or use alternative actions`
        });
      }

      await browserContext.inputTextElementNode(elementNode, action.text);
      const msg = `⌨️  Input "${action.text}" into index ${action.index}`;
      logger.info(msg);
      logger.debug(`Element xpath: ${elementNode.xpath}`);

      return new ActionResult({
        isDone: true,
        extractedContent: msg,
        includeInMemory: true
      });
    } catch (error) {
      return new ActionResult({
        error: `Failed to input text: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}