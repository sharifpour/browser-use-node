import { ActionResult } from '../../agent/views';
import type { BrowserContext } from '../../browser/context';
import { logger } from '../../utils/logging';
import * as actions from './actions';
import { ActionModel } from './views';

export class ActionRegistry {
  private actions: Map<string, typeof ActionModel> = new Map();

  constructor() {
    this.registerDefaultActions();
  }

  private registerDefaultActions() {
    Object.values(actions).forEach((action: any) => {
      if (action.prototype instanceof ActionModel) {
        this.registerAction(action);
      }
    });
  }

  registerAction(actionClass: typeof ActionModel): void {
    this.actions.set(actionClass.getName(), actionClass);
  }

  async executeAction(
    action: ActionModel,
    browserContext: BrowserContext
  ): Promise<ActionResult> {
    const actionClass = this.actions.get(action.constructor.name);
    if (!actionClass) {
      throw new Error(`Unknown action: ${action.constructor.name}`);
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
    for (const actionClass of this.actions.values()) {
      descriptions.push(actionClass.getPromptDescription());
    }
    return descriptions.join('\n\n');
  }
}