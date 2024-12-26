/**
 * Agent types and interfaces
 */

import type { BrowserState, BrowserStateHistory } from '../browser/types';

/**
 * Agent configuration
 */
export interface AgentConfig {
	/**
	 * Maximum steps
	 */
	maxSteps?: number;

	/**
	 * Step timeout in milliseconds
	 */
	stepTimeout?: number;

	/**
	 * Whether to save screenshots
	 */
	saveScreenshots?: boolean;

	/**
	 * Whether to save state history
	 */
	saveHistory?: boolean;
}

/**
 * Agent status
 */
export type AgentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

/**
 * Agent message
 */
export interface AgentMessage {
	/**
	 * Message type
	 */
	type: 'info' | 'warning' | 'error';

	/**
	 * Message content
	 */
	content: string;

	/**
	 * Timestamp
	 */
	timestamp: number;
}

/**
 * Agent step information
 */
export interface AgentStepInfo {
	/**
	 * Step number
	 */
	step_number: number;

	/**
	 * Maximum steps
	 */
	max_steps: number;

	/**
	 * Action taken
	 */
	action: string;

	/**
	 * Result
	 */
	result: unknown;

	/**
	 * Duration in milliseconds
	 */
	duration: number;

	/**
	 * Browser state after step
	 */
	browser_state?: BrowserState;

	/**
	 * Screenshot (base64)
	 */
	screenshot?: string;

	/**
	 * Extracted content
	 */
	extracted_content?: string;

}

/**
 * Agent history entry
 */
export interface AgentHistoryEntry {
	/**
	 * Model output
	 */
	model_output: AgentOutput | null;

	/**
	 * Action results
	 */
	result: ActionResult[];

	/**
	 * Browser state
	 */
	state: BrowserStateHistory;
}

/**
 * Action result
 */
export interface ActionResult {
	/**
	 * Extracted content
	 */
	extracted_content?: string;

	/**
	 * Error message
	 */
	error?: string;

	/**
	 * Whether to include in memory
	 */
	include_in_memory?: boolean;
}

/**
 * Agent history
 */
export interface AgentHistory {
	/**
	 * Steps taken
	 */
	steps: AgentStepInfo[];

	/**
	 * Messages
	 */
	messages: AgentMessage[];

	/**
	 * Start time
	 */
	startTime: number;

	/**
	 * End time
	 */
	endTime?: number;
}

/**
 * Agent state
 */
export interface AgentState {
	/**
	 * Current status
	 */
	status: AgentStatus;

	/**
	 * Current step
	 */
	currentStep: number;

	/**
	 * History
	 */
	history: AgentHistory;
}

/**
 * Agent output
 */
export interface AgentOutput {
	/**
	 * Success status
	 */
	success: boolean;

	/**
	 * Current state
	 */
	current_state: {
		evaluation_previous_goal: string;
		memory: string;
		next_goal: string;
	};

	/**
	 * Actions to take
	 */
	action: Array<Record<string, unknown>>;

	/**
	 * Error message
	 */
	error?: string;

	/**
	 * Result data
	 */
	data?: unknown;

	/**
	 * Agent state
	 */
	state: AgentState;
}

/**
 * Agent error class
 */
export class AgentError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AgentError';
	}
}
