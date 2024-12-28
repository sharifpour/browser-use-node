import type { ChatOpenAI } from '@langchain/openai';
import type { BrowserState } from '../browser/types';
import type { ActionModel } from '../controller/types';

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
	current_state: AgentBrain;
	actions: ActionModel[];
}

/**
 * Agent configuration
 */
export interface AgentConfig {
	task: string;
	llm: ChatOpenAI;
	action_descriptions: string;
	headless?: boolean;
	max_failures?: number;
	retry_delay?: number;
	use_vision?: boolean;
	save_conversation_path?: string;
	system_prompt_class?: SystemPromptClass;
	max_input_tokens?: number;
	validate_output?: boolean;
	include_attributes?: string[];
	max_error_length?: number;
	max_actions_per_step?: number;
	load_conversation_path?: string;
	load_history_path?: string;
	browser_options?: {
		defaultViewport?: {
			width: number;
			height: number;
		};
		args?: string[];
		executablePath?: string;
		userDataDir?: string;
	};
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
	is_done(): boolean;
	final_result(): string | null;
	save_to_file(path: string): void;
}
