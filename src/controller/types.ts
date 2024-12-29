import type { BrowserContext } from '../browser';

/**
 * Action result
 */
export interface ActionResult {
	error?: string;
	extracted_content?: string;
	include_in_memory?: boolean;
	is_done: boolean;
}

/**
 * Action model
 */
export interface ActionModel {
	action: string;
	args: Record<string, unknown>;
}

/**
 * Action Parameter Models
 */
export interface SearchGoogleAction {
	query: string;
}

export interface GoToUrlAction {
	url: string;
}

export interface ClickElementAction {
	index: number;
}

export interface InputTextAction {
	index: number;
	text: string;
}

export interface SwitchTabAction {
	page_id: number;
}

export interface OpenTabAction {
	url: string;
}

export interface ExtractPageContentAction {
	value: 'text' | 'markdown';
}

export interface DoneAction {
	text: string;
}

export interface ScrollAction {
	amount?: number;
}

export interface SendKeysAction {
	keys: string;
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
