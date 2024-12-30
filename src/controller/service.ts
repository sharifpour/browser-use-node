import { ActionResult } from '../agent/views';
import { BrowserContext } from '../browser/context';
import { Registry as ActionRegistry } from './registry/service';
import { ActionModel } from './registry/views';

export class Controller {
  private registry: ActionRegistry;
  private actionTypes: Map<string, typeof ActionModel> = new Map();

  constructor(registry?: ActionRegistry) {
    this.registry = registry || new ActionRegistry();
    this.registerDefaultActions();
  }

  private registerDefaultActions(): void {
  // TODO: Implement default actions registration
  }

  async multiAct(
    actions: ActionModel[],
    browserContext: BrowserContext
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const action of actions) {
      try {
        const result = await this.act(action, browserContext);
        results.push(result);
      } catch (error) {
        results.push(new ActionResult({
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: true
        }));
      }
    }
    return results;
  }

  async act(action: ActionModel, browserContext: BrowserContext): Promise<ActionResult> {
    const actionName = (action.constructor as typeof ActionModel).getName();
    return await this.registry.executeAction(actionName, action, browserContext);
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

  createActionModel(): typeof ActionModel {
    return this.registry.createActionModel();
  }
}
