import { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class DoneAction extends ActionModel {
  result: string;

  constructor(data?: Record<string, any>) {
    super();
    if (data && typeof data.result === 'string') {
      this.result = data.result;
    } else {
      throw new Error('Result is required for done action');
    }
  }

  static getName(): string {
    return 'done';
  }

  static getPromptDescription(): string {
    return `done: Mark task as completed
Parameters:
  - result: Result of the task
Example:
  {"done": {"result": "Task completed successfully"}}`;
  }

  getIndex(): number | null {
    return null;
  }

  setIndex(_index: number): void {
    // No-op
  }

  static async execute(
    action: DoneAction,
    _browserContext: BrowserContext
  ): Promise<ActionResult> {
    return new ActionResult({
      extractedContent: action.result,
      isDone: true
    });
  }
}