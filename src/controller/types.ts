import type { BrowserContext } from '../browser';

/**
 * Base action model
 */
export interface ActionModel {
	type: string;
	action: string;
	args: Record<string, unknown>;
}

/**
 * Action result
 */
export interface ActionResult {
	is_done?: boolean;
	extracted_content?: string;
	error?: string;
	include_in_memory?: boolean;
}

/**
 * Action handler function type
 */
export type ActionHandler = (args: Record<string, unknown>, context: BrowserContext) => Promise<ActionResult[]>;

/**
 * Action registry entry
 */
export interface ActionRegistryEntry {
	description: string;
	handler: ActionHandler;
	requires_browser?: boolean;
}
