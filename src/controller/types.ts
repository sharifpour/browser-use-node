import type { BrowserContext } from '../browser/context';
import type { z } from 'zod';

/**
 * Action function type
 */
export type ActionFunction = (
	params: Record<string, unknown>,
	browser?: BrowserContext
) => Promise<ActionResult>;

/**
 * Action options
 */
export interface ActionOptions {
	paramModel?: z.ZodType;
	requiresBrowser?: boolean;
}

/**
 * Action registration
 */
export interface ActionRegistration {
	description: string;
	handler: ActionFunction;
	options?: ActionOptions;
}

/**
 * Action result
 */
export interface ActionResult {
	success: boolean;
	error?: string;
	data?: unknown;
	include_in_memory?: boolean;
	extracted_content?: string;
}
