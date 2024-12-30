import { ActionResult } from '../../agent/views';
import type { BrowserContext } from '../../browser/context';
import { logger } from '../../utils/logging';

import { ClickAction, DoneAction, ExtractAction, InputAction, NavigateAction, ScrollAction, TabAction } from './actions';
import { ActionModel } from './views';

export class ActionRegistry {
  private actionMap: Map<string, { new(...args: any[]): ActionModel; getName(): string; execute(action: any, browserContext: BrowserContext): Promise<ActionResult>; getPromptDescription(): string }> = new Map();

  constructor() {
    this.registerAction(NavigateAction);
    this.registerAction(ClickAction);
    this.registerAction(InputAction);
    this.registerAction(ExtractAction);
    this.registerAction(DoneAction);
    this.registerAction(ScrollAction);
    this.registerAction(TabAction);
  }

  registerAction(actionClass: { new(...args: any[]): ActionModel; getName(): string; execute(action: any, browserContext: BrowserContext): Promise<ActionResult>; getPromptDescription(): string }): void {
    this.actionMap.set(actionClass.getName(), actionClass);
  }

  getActionType(name: string) {
    return this.actionMap.get(name);
  }

  async executeAction(
    action: ActionModel,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    const actionType = action.getType();
    const actionClass = this.actionMap.get(actionType);
    if (!actionClass) {
      throw new Error(`Unknown action: ${actionType}`);
    }

    try {
      const result = await actionClass.execute(action, browserContext);
      return new ActionResult({
        isDone: result.isDone || false,
        extractedContent: result.extractedContent || null,
        error: result.error || null,
        includeInMemory: result.includeInMemory || false
      });
    } catch (error) {
      logger.error(`Error executing action: ${error}`);
      return new ActionResult({
        isDone: false,
        extractedContent: null,
        error: error instanceof Error ? error.message : String(error),
        includeInMemory: true
      });
    }
  }

  getPromptDescription(): string {
    const descriptions: string[] = [];
    for (const actionClass of this.actionMap.values()) {
      descriptions.push(actionClass.getPromptDescription());
    }
    return descriptions.join('\n\n');
  }
}