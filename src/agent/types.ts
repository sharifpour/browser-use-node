import type { ActionModel } from '../controller/registry/types';
import type { BrowserStateHistory } from '../browser/types';

/**
 * Agent step information
 */
export interface AgentStepInfo {
	step_number: number;
	step_description: string;
}

/**
 * Action result
 */
export interface ActionResult {
	success: boolean;
	extracted_content?: string;
	error?: string;
	include_in_memory: boolean;
	is_done?: boolean;
}

/**
 * Agent brain
 */
export interface AgentBrain {
	evaluation_previous_goal: string;
	memory: string;
	next_goal: string;
}

/**
 * Agent history
 */
export interface AgentHistory {
	model_output: AgentOutput | null;
	result: ActionResult[];
	state: BrowserStateHistory;
}

/**
 * Agent history list
 */
export class AgentHistoryList {
	constructor(public history: AgentHistory[] = []) {}

	finalResult(): string | null {
		const lastHistory = this.history[this.history.length - 1];
		if (!lastHistory) return null;
		const lastResult = lastHistory.result[lastHistory.result.length - 1];
		return lastResult?.extracted_content || null;
	}
}

/**
 * Agent action
 */
export interface AgentAction {
	name: string;
	args: Record<string, unknown>;
}

/**
 * Agent output
 */
export interface AgentOutput {
	current_state: AgentBrain;
	actions: AgentAction[];
}

/**
 * Agent errors
 */
