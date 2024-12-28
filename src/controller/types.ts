import type { BrowserContext } from '../browser';

/**
 * Action result
 */
export interface ActionResult {
	error?: string;
	extracted_content?: string;
	is_done: boolean;
	include_in_memory?: boolean;
}

/**
 * Action model
 */
export interface ActionModel {
	type: string;
	action: string;
	args: Record<string, unknown>;
}

/**
 * Action function
 */
export type ActionFunction = (args: Record<string, unknown>, browser?: BrowserContext) => Promise<ActionResult[]>;

/**
 * Action registration
 */
export interface ActionRegistration {
	description: string;
	handler: ActionFunction;
	options: {
		requiresBrowser: boolean;
	};
}
