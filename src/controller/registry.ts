/**
 * Action registry for browser actions
 */

import type { BrowserContext } from '../browser/context';
import type { ActionResult, ActionFunction, ActionRegistration } from './types';
import { z } from 'zod';
import { ProductTelemetry } from '../telemetry/service';
import type { ControllerRegisteredFunctionsTelemetryEvent } from './types';
import { ActionError } from '../errors';

/**
 * Registered action function type
 */
export type ActionFunction = (params: Record<string, unknown>, browser?: BrowserContext) => Promise<ActionResult>;

/**
 * Registered action
 */
export interface RegisteredAction {
	name: string;
	description: string;
	function: ActionFunction;
	paramModel: z.ZodType<unknown>;
	requiresBrowser: boolean;
}

/**
 * Action registry for browser automation
 */
export class Registry {
	private readonly actions: Map<string, ActionRegistration>;
	private readonly telemetry: ProductTelemetry;

	constructor() {
		this.actions = new Map();
		this.telemetry = new ProductTelemetry();
	}

	/**
	 * Create parameter model from function
	 */
	private createParamModel(func: ActionFunction): z.ZodType {
		// Extract parameter types from function
		const params = new Map<string, z.ZodType>();
		const paramNames = this.extractParamNames(func);

		for (const param of paramNames) {
			// For now, we'll use a generic object schema
			// In a real implementation, we'd use TypeScript's type system to infer types
			params.set(param, z.object({}));
		}

		return z.object(Object.fromEntries(params));
	}

	private extractParamNames(func: ActionFunction): string[] {
		const funcStr = func.toString();
		const match = funcStr.match(/\((.*?)\)/);
		if (!match) return [];

		const params = match[1].split(',').map(p => p.trim());
		if (params.length === 0 || params[0] === '') return [];

		return params.map(p => p.split(':')[0].trim());
	}

	/**
	 * Register an action
	 */
	public action(
		description: string,
		options: { paramModel?: z.ZodType<unknown>; requiresBrowser?: boolean } = {}
	): (func: ActionFunction) => ActionFunction {
		return (func: ActionFunction): ActionFunction => {
			const name = this.getFunctionName(func);
			const paramModel = options.paramModel ?? this.createParamModel(func);
			const requiresBrowser = options.requiresBrowser ?? false;

			this.validateActionRegistration(name, description, func, paramModel);

			// Wrap function to handle async/sync
			const wrappedFunc = async (params: Record<string, unknown>, browser?: BrowserContext): Promise<ActionResult> => {
				try {
					const result = await func(params, browser);
					return this.validateActionResult(result);
				} catch (error) {
					throw this.formatError(error);
				}
			};

			this.actions.set(name, {
				function: wrappedFunc,
				options: {
					paramModel: options.paramModel ?? this.createParamModel(func),
					requiresBrowser: options.requiresBrowser ?? true
				}
			});

			// Send telemetry
			this.telemetry.capture({
				name: 'controller_registered_functions',
				properties: {
					registeredFunctions: [{
						name,
						params: paramModel.safeParse({}).success ? {} : paramModel
					}]
				}
			} as ControllerRegisteredFunctionsTelemetryEvent);

			return func;
		};
	}

	/**
	 * Get a registered action
	 */
	public getAction(name: string): ActionRegistration | undefined {
		return this.actions.get(name);
	}

	/**
	 * Execute a registered action
	 */
	public async executeAction(
		name: string,
		params: Record<string, unknown>,
		browser?: BrowserContext
	): Promise<ActionResult> {
		const action = this.actions.get(name);
		if (!action) {
			throw new Error(`Action ${name} is not registered`);
		}

		if (action.options.requiresBrowser && !browser) {
			throw new Error(`Action ${name} requires a browser context`);
		}

		try {
			const result = await action.function(params, browser);
			return this.validateActionResult(result);
		} catch (error) {
			throw this.formatError(error);
		}
	}

	/**
	 * Get prompt description for all registered actions
	 */
	public getPromptDescription(): string {
		let description = '';
		for (const action of this.actions.values()) {
			description += this.getActionPromptDescription(action) + '\n';
		}
		return description;
	}

	/**
	 * Get all registered actions
	 */
	public getRegisteredActions(): ActionRegistration[] {
		return Array.from(this.actions.values());
	}

	/**
	 * Create dynamic action model
	 */
	public createActionModel(): z.ZodType<unknown> {
		const actionSchemas: Record<string, z.ZodType<unknown>> = {};
		for (const [name, action] of this.actions.entries()) {
			actionSchemas[name] = action.options.paramModel;
		}
		return z.object(actionSchemas).partial().strict();
	}

	/**
	 * Get function name
	 */
	private getFunctionName(func: ActionFunction): string {
		return func.name || 'anonymous';
	}

	/**
	 * Validate action registration
	 */
	private validateActionRegistration(
		name: string,
		description: string,
		func: ActionFunction,
		paramModel: z.ZodType<unknown>
	): void {
		if (!name) {
			throw new Error('Action name is required');
		}

		if (!description) {
			throw new Error('Action description is required');
		}

		if (typeof func !== 'function') {
			throw new Error('Action function is required');
		}

		if (!(paramModel instanceof z.ZodType)) {
			throw new Error('Action parameter model must be a Zod schema');
		}

		if (this.actions.has(name)) {
			throw new Error(`Action "${name}" already registered`);
		}
	}

	/**
	 * Get action prompt description
	 */
	private getActionPromptDescription(action: ActionRegistration): string {
		const skipKeys = ['title'];
		let description = `${action.description}:\n`;
		description += `{${action.name}: `;

		// Get schema properties excluding skipped keys
		const schema = action.options.paramModel.safeParse({});
		if (schema.success) {
			description += '{}';
		} else {
			const properties = Object.entries(action.options.paramModel['shape'] ?? {})
				.filter(([key]) => !skipKeys.includes(key))
				.reduce((acc, [key, value]) => {
					acc[key] = value;
					return acc;
				}, {} as Record<string, unknown>);
			description += JSON.stringify(properties);
		}

		description += '}';
		return description;
	}

	/**
	 * Format error message
	 */
	private formatError(error: Error | unknown): Error {
		if (error instanceof Error) {
			return new ActionError(error.message, 'execution', true);
		}
		return new ActionError('Unknown error occurred', 'execution', true);
	}

	/**
	 * Validate action result
	 */
	private validateActionResult(result: ActionResult): ActionResult {
		if (!result || typeof result !== 'object') {
			throw new Error('Invalid action result: must be an object');
		}

		if (typeof result.success !== 'boolean') {
			throw new Error('Invalid action result: missing success property');
		}

		return result;
	}
}

export type { ActionResult } from "./types";
