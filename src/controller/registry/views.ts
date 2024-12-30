import type { ActionResult } from '../../agent/views';
import type { BrowserContext } from '../../browser/context';

export abstract class ActionModel {
  abstract static getName(): string;
  abstract static execute(action: ActionModel, browserContext: BrowserContext): Promise<ActionResult>;

  abstract getIndex(): number | undefined;
  abstract setIndex(index: number): void;

  getType(): string {
    return (this.constructor as typeof ActionModel).getName();
  }
}
