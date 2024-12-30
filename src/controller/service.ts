import type { ActionResult } from '../agent/views';
import type { BrowserContext } from '../browser/context';
import { logger } from '../utils/logging';
import { ActionRegistry } from './registry/service';
import { ActionModel } from './registry/views';

export class Controller {
  private registry: ActionRegistry;
  private actionTypes: Map<string, typeof ActionModel> = new Map();

  constructor(registry?: ActionRegistry) {
    this.registry = registry || new ActionRegistry();
  }

  async multiAct(
    actions: ActionModel[],
    browserContext: BrowserContext
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const action of actions) {
      try {
        const result = await this.registry.executeAction(action, browserContext);
        results.push(result);
      } catch (error) {
        logger.error(`Error executing action: ${error}`);
        results.push({ error: error instanceof Error ? error.message : String(error) });
        break;
      }
    }
    return results;
  }

  getPromptDescription(): string {
    return this.registry.getPromptDescription();
  }

  registerActionType(name: string, actionClass: typeof ActionModel) {
    this.actionTypes.set(name, actionClass);
  }

  getActionType(name: string): typeof ActionModel | undefined {
    return this.actionTypes.get(name);
  }
}
