import type { ActionResult } from '../../agent/views';
import type { BrowserContext } from '../../browser/context';

export abstract class ActionModel {
  static getName(): string {
    throw new Error('Method not implemented.');
  }

  static getPromptDescription(): string {
    throw new Error('Method not implemented.');
  }

  static execute(
    _action: ActionModel,
    _browserContext: BrowserContext
  ): Promise<ActionResult> {
    throw new Error('Method not implemented.');
  }

  abstract getIndex(): number | undefined;
  abstract setIndex(index: number): void;
}
