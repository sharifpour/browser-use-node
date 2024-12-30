import type { BrowserContext } from '../../browser/context';
import { ClickAction, DoneAction, ExtractAction, InputTextAction, NavigateAction, ScrollAction, TabAction } from './actions';
import { ActionModel, type RegisteredAction } from './views';

export class Registry {
  private actions: Map<string, RegisteredAction> = new Map();

  constructor() {
    this.actions = new Map();
    this.registerDefaultActions();
  }

  private registerDefaultActions(): void {
    // Register click action
    this.actions.set(ClickAction.getName(), {
      name: ClickAction.getName(),
      description: ClickAction.getPromptDescription(),
      function: ClickAction.execute,
      paramModel: ClickAction,
      requiresBrowser: true,
      promptDescription: () => ClickAction.getPromptDescription()
    });

    // Register done action
    this.actions.set(DoneAction.getName(), {
      name: DoneAction.getName(),
      description: DoneAction.getPromptDescription(),
      function: DoneAction.execute,
      paramModel: DoneAction,
      requiresBrowser: false,
      promptDescription: () => DoneAction.getPromptDescription()
    });

    // Register navigate action
    this.actions.set(NavigateAction.getName(), {
      name: NavigateAction.getName(),
      description: NavigateAction.getPromptDescription(),
      function: NavigateAction.execute,
      paramModel: NavigateAction,
      requiresBrowser: true,
      promptDescription: () => NavigateAction.getPromptDescription()
    });

    // Register tab action
    this.actions.set(TabAction.getName(), {
      name: TabAction.getName(),
      description: TabAction.getPromptDescription(),
      function: TabAction.execute,
      paramModel: TabAction,
      requiresBrowser: true,
      promptDescription: () => TabAction.getPromptDescription()
    });

    // Register input text action
    this.actions.set(InputTextAction.getName(), {
      name: InputTextAction.getName(),
      description: InputTextAction.getPromptDescription(),
      function: InputTextAction.execute,
      paramModel: InputTextAction,
      requiresBrowser: true,
      promptDescription: () => InputTextAction.getPromptDescription()
    });

    // Register scroll action
    this.actions.set(ScrollAction.getName(), {
      name: ScrollAction.getName(),
      description: ScrollAction.getPromptDescription(),
      function: ScrollAction.execute,
      paramModel: ScrollAction,
      requiresBrowser: true,
      promptDescription: () => ScrollAction.getPromptDescription()
    });

    // Register extract action
    this.actions.set(ExtractAction.getName(), {
      name: ExtractAction.getName(),
      description: ExtractAction.getPromptDescription(),
      function: ExtractAction.execute,
      paramModel: ExtractAction,
      requiresBrowser: true,
      promptDescription: () => ExtractAction.getPromptDescription()
    });
  }

  action(
    description: string,
    paramModel?: new (data?: Record<string, any>) => ActionModel,
    requiresBrowser: boolean = false
  ): (target: (...args: any[]) => Promise<any>) => void {
    return (target: (...args: any[]) => Promise<any>) => {
      const action: RegisteredAction = {
        name: target.name,
        description,
        function: target,
        paramModel: paramModel || ActionModel,
        requiresBrowser,
        promptDescription: () => {
          const skipKeys = ['title'];
          let s = `${description}: \n`;
          s += '{' + target.name + ': ';
          s += JSON.stringify(
            Object.fromEntries(
              Object.entries(paramModel?.prototype || {})
                .filter(([k]) => !skipKeys.includes(k))
                .map(([k, v]) => [k, v])
            )
          );
          s += '}';
          return s;
        }
      };
      this.actions.set(target.name, action);
      return target;
    };
  }

  async executeAction(
    actionName: string,
    params: ActionModel,
    browser?: BrowserContext
  ): Promise<any> {
    const action = this.actions.get(actionName);
    if (!action) {
      throw new Error(`Action ${actionName} not found`);
    }

    if (action.requiresBrowser && !browser) {
      throw new Error(`Action ${actionName} requires browser context`);
    }

    const args = action.requiresBrowser ? [params, browser] : [params];
    return await action.function(...args);
  }

  getPromptDescription(): string {
    return Array.from(this.actions.values())
      .map(action => action.promptDescription())
      .join('\n');
  }

  createActionModel(): typeof ActionModel {
    const actionTypes = Array.from(this.actions.values()).map(action => action.paramModel);
    return class DynamicActionModel extends ActionModel {
      static getName(): string {
        return 'DynamicActionModel';
      }

      constructor(data?: Record<string, any>) {
        super();
        if (data) {
          const actionName = Object.keys(data)[0];
          const actionData = data[actionName];
          const actionClass = actionTypes.find(type => {
            try {
              return (type as any).getName() === actionName;
            } catch {
              return false;
            }
          });
          if (actionClass) {
            return new actionClass(actionData);
          }
          throw new Error(`Unknown action type: ${actionName}`);
        }
      }
    };
  }
}