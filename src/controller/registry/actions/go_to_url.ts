import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class GoToUrlAction extends ActionModel {
  private index = 0;

  constructor(public url: string) {
    super();
  }

  static getName(): string {
    return 'go_to_url';
  }

  static getPromptDescription(): string {
    return `go_to_url: Navigate to a URL
Parameters:
  - url: URL to navigate to
Example:
  {"go_to_url": {"url": "https://example.com"}}`;
  }

  async execute(action: GoToUrlAction, browserContext: BrowserContext): Promise<ActionResult> {
    try {
      await browserContext.navigateTo(action.url);
      return new ActionResult({
        isDone: true,
        extractedContent: `Navigated to ${action.url}`,
        includeInMemory: true
      });
    } catch (error) {
      return new ActionResult({
        error: `Failed to navigate: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  getIndex(): number {
    return this.index;
  }

  setIndex(index: number): void {
    this.index = index;
  }

  toJSON(): any {
    return {
      go_to_url: { url: this.url },
    };
  }

  static fromJSON(json: any): GoToUrlAction {
    return new GoToUrlAction(json.url);
  }
}
