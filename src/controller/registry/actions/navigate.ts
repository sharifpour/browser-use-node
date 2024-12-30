import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class NavigateAction extends ActionModel {
  url: string;

  constructor(data?: Record<string, any>) {
    super();
    if (data && typeof data.url === 'string') {
      this.url = data.url;
    } else {
      throw new Error('URL is required for navigate action');
    }
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

  getIndex(): number | null {
    return null;
  }

  setIndex(_index: number): void {
    // No-op
  }

  static async execute(
    action: NavigateAction,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    try {
      await browserContext.navigateTo(action.url);
      return new ActionResult({});
    } catch (error) {
      return new ActionResult({ error: error instanceof Error ? error.message : String(error) });
    }
  }
}