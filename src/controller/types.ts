import { z } from "zod";
import type { BrowserContext } from '../browser/context';

/**
 * Base action types
 */
export interface ActionResult {
	is_done?: boolean;
	extracted_content?: string;
	error?: string;
	include_in_memory: boolean;
}

export interface ActionContext {
	requiresBrowser: boolean;
	paramModel?: z.ZodType<unknown>;
}

export interface ActionState {
	error?: string;
	validationError?: string;
}

export interface ActionValidationResult {
	isValid: boolean;
	error?: string;
	params?: Record<string, unknown>;
}

export interface ActionOptions {
	paramModel?: z.ZodType<unknown>;
	requiresBrowser?: boolean;
}

export type ActionFunction = (
	params: Record<string, unknown>,
	browser: BrowserContext
) => Promise<ActionResult>;

export interface ActionRegistration {
	name: string;
	handler: ActionFunction;
	options?: ActionOptions;
}

export interface ActionHandler {
	handle(params: Record<string, unknown>): Promise<ActionResult>;
	validate(params: Record<string, unknown>): Promise<ActionValidationResult>;
}

/**
 * Action model for dynamic actions
 */
export interface ActionModel {
	toJSON(): Record<string, unknown>;
	getIndex(): number | undefined;
	setIndex(index: number): void;
}

/**
 * Action model schema
 */
export const ActionResultSchema = z.object({
	is_done: z.boolean().optional(),
	extracted_content: z.string().optional(),
	error: z.string().optional(),
	include_in_memory: z.boolean()
}).strict();

/**
 * Specific action types
 */
export interface OpenTabAction {
	type: 'open_tab';
	url: string;
}

export interface ExtractPageContentAction {
	type: 'extract_page_content';
	selector?: string;
}

export interface ScrollAction {
	type: 'scroll';
	direction: 'up' | 'down';
	amount?: number;
}

/**
 * Telemetry types
 */
export interface TelemetryEvent {
	name: string;
	properties: Record<string, unknown>;
}

export interface RegisteredFunction {
	name: string;
	params: Record<string, unknown>;
}

export interface ControllerRegisteredFunctionsTelemetryEvent extends TelemetryEvent {
	properties: {
		registeredFunctions: RegisteredFunction[];
	};
	name: 'controller_registered_functions';
}

export interface AgentRunTelemetryEvent extends TelemetryEvent {
	properties: {
		agentId: string;
		task: string;
	};
	name: 'agent_run';
}

export interface AgentStepErrorTelemetryEvent extends TelemetryEvent {
	properties: {
		agentId: string;
		error: string;
	};
	name: 'agent_step_error';
}

export interface AgentEndTelemetryEvent extends TelemetryEvent {
	properties: {
		agentId: string;
		task: string;
		steps: number;
		success: boolean;
		error?: string;
	};
	name: 'agent_end';
}
