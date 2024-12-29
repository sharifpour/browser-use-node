import type { ActionResult } from '../../../agent/views';
import type { BrowserContext } from '../../../browser/context';
import { ActionModel } from '../views';

export class DoneAction extends ActionModel {
  constructor(public result: string) {
    super();
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

  getIndex(): number | undefined {
    return undefined;
  }

  setIndex(_index: number): void {
    // No-op
  }

  static async execute(
    action: DoneAction,
    _browserContext: BrowserContext
  ): Promise<ActionResult> {
    return {
      extractedContent: action.result,
      isDone: true
    };
  }
}