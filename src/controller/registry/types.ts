/**
 * Base model for dynamically created action models
 */
export interface ActionModel {
	[key: string]: {
		index?: number;
		[key: string]: unknown;
	};
}

/**
 * Base interface for action parameters
 */
export interface BaseActionParams {
	[key: string]: unknown;
}

/**
 * Action function type
 */
export type ActionFunction<T extends BaseActionParams = BaseActionParams> = (params: T) => Promise<unknown>;

/**
 * Model for a registered action
 */
export interface RegisteredAction<T extends BaseActionParams = BaseActionParams> {
	name: string;
	description: string;
	function: ActionFunction<T>;
	paramModel: new () => T;
	requiresBrowser?: boolean;

	promptDescription(): string;
}

/**
 * Model representing the action registry
 */
export interface ActionRegistry {
	actions: Record<string, RegisteredAction>;
	getPromptDescription(): string;
}