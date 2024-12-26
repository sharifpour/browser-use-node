/**
 * Action registry for browser actions
 */

import type { BrowserContext } from '../browser/context';
import type { ActionResult } from './types';
import { z } from 'zod';
import { ProductTelemetry } from '../telemetry/service';
import type { ControllerRegisteredFunctionsTelemetryEvent } from './types';

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
	private readonly actions: Map<string, RegisteredAction>;
	private readonly telemetry: ProductTelemetry;

	constructor() {
		this.actions = new Map();
		this.telemetry = new ProductTelemetry();
	}

	/**
	 * Create parameter model from function
	 */
	private createParamModel(func: ActionFunction): z.ZodType<unknown> {
		// Get function parameters excluding browser
		const params = new Map<string, z.ZodType<unknown>>();
		const funcStr = func.toString();
		const paramMatch = funcStr.match(/\((.*?)\)/);

		if (paramMatch) {
			const paramStr = paramMatch[1];
			const paramList = paramStr.split(',').map(p => p.trim()).filter(p => p !== 'browser');

			for (const param of paramList) {
				if (param) {
					// Default to any for now, in real implementation we'd infer types
					params.set(param, z.any());
				}
			}
		}

		return z.object(Object.fromEntries(params)).strict();
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
				name,
				description,
				function: wrappedFunc,
				paramModel,
				requiresBrowser
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
	public getAction(name: string): RegisteredAction | undefined {
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
			throw new Error(`Action "${name}" not registered`);
		}

		try {
			// Validate parameters
			const validatedParams = action.paramModel.parse(params);

			// Check browser requirement
			if (action.requiresBrowser && !browser) {
				throw new Error(`Action "${name}" requires browser context`);
			}

			// Execute action
			const result = await action.function(validatedParams as Record<string, unknown>, browser);

			// Validate result
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
	public getRegisteredActions(): RegisteredAction[] {
		return Array.from(this.actions.values());
	}

	/**
	 * Create dynamic action model
	 */
	public createActionModel(): z.ZodType<unknown> {
		const actionSchemas: Record<string, z.ZodType<unknown>> = {};
		for (const [name, action] of this.actions.entries()) {
			actionSchemas[name] = action.paramModel;
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
	private getActionPromptDescription(action: RegisteredAction): string {
		const skipKeys = ['title'];
		let description = `${action.description}:\n`;
		description += `{${action.name}: `;

		// Get schema properties excluding skipped keys
		const schema = action.paramModel.safeParse({});
		if (schema.success) {
			description += '{}';
		} else {
			const properties = Object.entries(action.paramModel['shape'] ?? {})
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
	private formatError(error: unknown): Error {
		if (error instanceof z.ZodError) {
			return new Error(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
		}
		if (error instanceof Error) {
			return error;
		}
		return new Error(String(error));
	}

	/**
	 * Validate action result
	 */
	private validateActionResult(result: unknown): ActionResult {
		if (!result || typeof result !== 'object') {
			throw new Error('Invalid action result: must be an object');
		}

		const { is_done, extracted_content, error, include_in_memory } = result as ActionResult;

		if (
			(typeof is_done !== 'boolean' && is_done !== undefined) ||
			(typeof extracted_content !== 'string' && extracted_content !== undefined) ||
			(typeof error !== 'string' && error !== undefined) ||
			typeof include_in_memory !== 'boolean'
		) {
			throw new Error('Invalid action result: invalid property types');
		}

		return result as ActionResult;
	}
}

export type { ActionResult } from "./types";
