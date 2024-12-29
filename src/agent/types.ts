import type { ChatOpenAI } from '@langchain/openai';
import type { Browser } from '../browser';
import type { BrowserContext, BrowserState } from '../browser/types/types';
import type { Controller } from '../controller';
import type { ActionModel, ActionResult } from '../controller/types';

/**
 * System prompt class type
 */
export interface SystemPromptClass {
	new(): {
		get_prompt(): string;
	};
}

/**
 * Agent step information
 */
export interface AgentStepInfo {
	step_number: number;
	max_steps: number;
}

/**
 * Agent brain state
 */
export interface AgentBrain {
	evaluation_previous_goal: string;
	memory: string;
	next_goal: string;
}

/**
 * Action execution result
 */
export interface ActionResult {
	is_done?: boolean;
	extracted_content?: string;
	error?: string;
	include_in_memory?: boolean;
}

/**
 * Agent output
 */
export interface AgentOutput {
	current_state: {
		evaluation_previous_goal: string;
		memory: string;
		next_goal: string;
	};
	action: ActionModel[];
}

/**
 * Agent configuration
 */
export interface AgentConfig {
	task: string;
	llm?: ChatOpenAI;
	browser?: Browser;
	browser_context?: BrowserContext;
	controller?: Controller;
	use_vision?: boolean;
	save_conversation_path?: string;
	max_failures?: number;
	retry_delay?: number;
	max_input_tokens?: number;
	validate_output?: boolean;
	include_attributes?: string[];
	max_error_length?: number;
	max_actions_per_step?: number;
	load_conversation_path?: string;
	load_history_path?: string;
	action_descriptions?: string;
	browser_options?: Record<string, unknown>;
	headless?: boolean;
}

/**
 * Agent history item
 */
export interface AgentHistory {
	step_number: number;
	state: BrowserState;
	model_output?: AgentOutput;
	result: ActionResult[];
}

/**
 * Agent history list
 */
export interface AgentHistoryList {
	history: AgentHistory[];
	is_done: () => boolean;
	final_result: () => string | null;
	save_to_file: (path: string) => void;
}
