import "reflect-metadata";
import { z } from 'zod';
import type { BrowserContext } from '../../browser/context';
import { createError } from '../../errors';
import { ProductTelemetry } from '../../telemetry/service';
import type {
  ActionFunction,
  ActionResult,
  IRegistry,
  RegisteredAction
} from './types';

/**
 * Registry for browser automation actions
 */
class Registry implements IRegistry {
  private static instance: Registry | null = null;
  private actions = new Map<string, RegisteredAction>();
  private readonly telemetry: ProductTelemetry;

  private constructor() {
    this.telemetry = ProductTelemetry.getInstance();
  }

  public static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  /**
   * Register an action
   */
  public registerAction(name: string, action: RegisteredAction): void {
    if (!name) {
      throw new Error('Action name is required');
    }

    if (!action.description) {
      throw new Error('Action description is required');
    }

    if (typeof action.handler !== 'function') {
      throw new Error('Action handler must be a function');
    }

    if (!(action.paramSchema instanceof z.ZodType)) {
      throw new Error('Action parameter schema must be a Zod schema');
    }

    if (this.actions.has(name)) {
      throw new Error(`Action "${name}" already registered`);
    }

    this.actions.set(name, action);

    // Send telemetry
    this.telemetry.capture({
      name: 'controller_registered_functions',
      properties: {
        registeredFunctions: [{
          name,
          params: action.paramSchema.safeParse({}).success ? {} : action.paramSchema
        }]
      }
    });
  }

  /**
   * Get registered action by name
   */
  public getAction(name: string): RegisteredAction | undefined {
    return this.actions.get(name);
  }

  /**
   * Get all registered actions
   */
  public getRegisteredActions(): RegisteredAction[] {
    return Array.from(this.actions.values());
  }

  /**
   * Get prompt description of all actions
   */
  public getPromptDescription(): string {
    const descriptions = this.getRegisteredActions().map(action => {
      const params = action.paramSchema.safeParse({}).success ? '{}' : action.paramSchema;
      return `${action.name}: ${action.description}\nParameters: ${JSON.stringify(params, null, 2)}`;
    });

    return descriptions.join('\n\n');
  }

  /**
   * Execute an action
   */
  public async executeAction(
    actionName: string,
    params: Record<string, unknown>,
    browserContext?: BrowserContext
  ): Promise<ActionResult> {
    const action = this.getAction(actionName);
    if (!action) {
      throw new Error(`Action "${actionName}" not found`);
    }

    if (action.requiresBrowser && !browserContext) {
      throw new Error(`Action "${actionName}" requires browser context`);
    }

    try {
      const result = await action.handler(params, browserContext);
      return {
        success: true,
        ...result,
        include_in_memory: result.include_in_memory ?? true
      };
    } catch (error) {
      throw createError(`Failed to execute action "${actionName}": ${error}`);
    }
  }
}

// Export the class
export { Registry };

