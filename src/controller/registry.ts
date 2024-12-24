/**
 * Action registry for browser actions
 */

import type { BrowserContext } from "../browser/context";

export interface ActionResult {
	/**
	 * Whether the action was successful
	 */
	success?: boolean;

	/**
	 * Message describing the result
	 */
	message?: string;

	/**
	 * Content extracted from the action
	 */
	extractedContent?: string;

	/**
	 * Whether to include the result in memory
	 */
	includeInMemory?: boolean;

	/**
	 * Additional data from the action
	 */
	data?: any;

	/**
	 * Whether the action is done
	 */
	isDone?: boolean;

	/**
	 * Error message if the action failed
	 */
	error?: string;
}

export type ActionHandler = {
	(params: any, browser: BrowserContext | undefined): Promise<ActionResult>;
	requiresBrowser?: boolean;
};

export interface ActionRegistration {
	name: string;
	description: string;
	handler: ActionHandler;
	requiresBrowser?: boolean;
}

/**
 * Decorator for registering actions
 */
export function action(description: string, requiresBrowser = false) {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		if (!target.constructor._actions) {
			target.constructor._actions = new Map<string, ActionRegistration>();
		}

		target.constructor._actions.set(propertyKey, {
			name: propertyKey,
			description,
			handler: originalMethod,
			requiresBrowser,
		});

		return descriptor;
	};
}

/**
 * Registry for browser actions
 */
export class Registry {
	private actions: Map<string, ActionRegistration> = new Map();

	/**
	 * Register an action
	 */
	registerAction(registration: ActionRegistration): void {
		this.actions.set(registration.name, registration);
	}

	/**
	 * Register multiple actions
	 */
	registerActions(registrations: ActionRegistration[]): void {
		for (const registration of registrations) {
			this.registerAction(registration);
		}
	}

	/**
	 * Register actions from a class
	 */
	registerFromClass(target: any): void {
		const actions = target.constructor._actions;
		if (actions) {
			for (const [_, registration] of actions) {
				this.registerAction(registration);
			}
		}
	}

	/**
	 * Get an action by name
	 */
	getAction(name: string): ActionRegistration | undefined {
		return this.actions.get(name);
	}

	/**
	 * Get all registered actions
	 */
	getAllActions(): ActionRegistration[] {
		return Array.from(this.actions.values());
	}

	/**
	 * Check if an action exists
	 */
	hasAction(name: string): boolean {
		return this.actions.has(name);
	}

	/**
	 * Remove an action
	 */
	removeAction(name: string): void {
		this.actions.delete(name);
	}

	/**
	 * Clear all actions
	 */
	clear(): void {
		this.actions.clear();
	}
}
