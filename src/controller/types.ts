import { z } from "zod";
import { ActionError } from "./errors";

/**
 * Result of executing an action
 */
export interface ActionResult {
	is_done?: boolean;
	extracted_content?: string;
	error?: string;
	include_in_memory: boolean;
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
 * Base telemetry event
 */
export interface TelemetryEvent {
	name: string;
	properties: Record<string, unknown>;
}

/**
 * Registered function telemetry
 */
export interface RegisteredFunction {
	name: string;
	params: Record<string, unknown>;
}

/**
 * Controller registered functions telemetry event
 */
export interface ControllerRegisteredFunctionsTelemetryEvent extends TelemetryEvent {
	properties: {
		registeredFunctions: RegisteredFunction[];
	};
	name: 'controller_registered_functions';
}

/**
 * Agent run telemetry event
 */
export interface AgentRunTelemetryEvent extends TelemetryEvent {
	properties: {
		agentId: string;
		task: string;
	};
	name: 'agent_run';
}

/**
 * Agent step error telemetry event
 */
export interface AgentStepErrorTelemetryEvent extends TelemetryEvent {
	properties: {
		agentId: string;
		error: string;
	};
	name: 'agent_step_error';
}

/**
 * Agent end telemetry event
 */
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

export { ActionError } from './errors';
export type { ActionValidationResult, ActionContext, ActionState, ActionOptions } from './errors';
