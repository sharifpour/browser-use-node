/**
 * Agent types and interfaces
 */

import type { BrowserState, BrowserStateHistory } from "../browser/types";
import type { BrowserContextConfig } from "../browser/config";
import type { DOMHistoryElement } from "../dom/types";

/**
 * Agent brain - matches Python's AgentBrain model
 */
export interface AgentBrain {
	/**
	 * Evaluation of the previous goal
	 */
	evaluation_previous_goal: string;

	/**
	 * Memory of what has been done
	 */
	memory: string;

	/**
	 * Next goal to achieve
	 */
	next_goal: string;
}

/**
 * Action result - matches Python's ActionResult model
 */
export interface ActionResult {
	/**
	 * Whether the action is done
	 */
	is_done?: boolean;

	/**
	 * Content extracted from the action
	 */
	extracted_content?: string;

	/**
	 * Error message if the action failed
	 */
	error?: string;

	/**
	 * Whether to include the result in memory
	 */
	include_in_memory: boolean;
}

/**
 * Agent history - matches Python's AgentHistory
 */
export interface AgentHistory {
	/**
	 * Model output from this step
	 */
	model_output: AgentOutput | null;

	/**
	 * Results from executing actions
	 */
	result: ActionResult[];

	/**
	 * Browser state during this step
	 */
	state: BrowserStateHistory;

	/**
	 * Convert to dictionary
	 */
	toDict(): Record<string, unknown>;

	/**
	 * Get interacted elements from this step
	 */
	getInteractedElement(model_output: AgentOutput, selector_map: Record<number, unknown>): Array<DOMHistoryElement | null>;
}

/**
 * Agent history list - matches Python's AgentHistoryList
 */
export interface AgentHistoryList {
	/**
	 * List of history items
	 */
	history: AgentHistory[];

	/**
	 * Get last action in history
	 */
	lastAction(): Record<string, unknown> | null;

	/**
	 * Get all errors from history
	 */
	errors(): string[];

	/**
	 * Get final result from history
	 */
	finalResult(): string | null;

	/**
	 * Check if agent is done
	 */
	isDone(): boolean;

	/**
	 * Check if agent has errors
	 */
	hasErrors(): boolean;

	/**
	 * Get all unique URLs from history
	 */
	urls(): string[];

	/**
	 * Get all screenshots from history
	 */
	screenshots(): string[];

	/**
	 * Save history to file
	 */
	saveToFile(path: string): Promise<void>;

	/**
	 * Load history from file
	 */
	loadFromFile(path: string): Promise<void>;

	/**
	 * Convert to dictionary
	 */
	toDict(): Record<string, unknown>;
}

/**
 * Agent output - matches Python's AgentOutput
 */
export interface AgentOutput {
	current_state: AgentBrain;
	action: Array<{
		[key: string]: Record<string, unknown>;
	}>;
}

/**
 * Agent step info - matches Python's AgentStepInfo
 */
export interface AgentStepInfo {
	step_number: number;
	max_steps: number;
}

/**
 * Agent error types - enhanced error handling
 */
export class AgentError extends Error {
	static readonly VALIDATION_ERROR = 'Invalid model output format. Please follow the correct schema.';
	static readonly RATE_LIMIT_ERROR = 'Rate limit reached. Waiting before retry.';
	static readonly NO_VALID_ACTION = 'No valid action found';

	constructor(
		message: string,
		public readonly type: "validation" | "execution" | "browser" | "llm" = "execution",
		public readonly includeTrace = false
	) {
		super(message);
		this.name = "AgentError";
	}

	/**
	 * Format error message
	 */
	static formatError(error: Error, includeTrace = false): string {
		if (error instanceof AgentError) {
			return error.message;
		}
		if (error.name === 'ValidationError') {
			return `${AgentError.VALIDATION_ERROR}\nDetails: ${error.message}`;
		}
		if (error.name === 'RateLimitError') {
			return AgentError.RATE_LIMIT_ERROR;
		}
		return includeTrace ? `${error.message}\nStacktrace:\n${error.stack}` : error.message;
	}
}

/**
 * Agent status enum
 */
export enum AgentStatus {
	IDLE = 'idle',
	RUNNING = 'running',
	COMPLETED = 'completed',
	FAILED = 'failed'
}

/**
 * Agent state interface
 */
export interface AgentState {
	status: AgentStatus;
	currentStep: number;
	history: AgentHistory[];
}

/**
 * Agent message interface
 */
export interface AgentMessage {
	type: 'info' | 'error' | 'success';
	content: string;
	timestamp: number;
}

/**
 * Agent telemetry event interface
 */
export interface AgentTelemetryEvent {
	agent_id: string;
	task: string;
	success?: boolean;
	steps?: number;
	error?: string;
	timestamp: number;
}

/**
 * Agent validation result interface
 */
export interface ValidationResult {
	is_valid: boolean;
	reason: string;
}

/**
 * Agent configuration - enhanced to match Python capabilities
 */
export interface AgentConfig {
	/**
	 * Task description
	 */
	task: string;

	/**
	 * LLM model to use
	 */
	model?: string;

	/**
	 * Maximum number of steps
	 */
	maxSteps?: number;

	/**
	 * Maximum number of actions per step
	 */
	maxActionsPerStep?: number;

	/**
	 * Maximum number of failures before giving up
	 */
	maxFailures?: number;

	/**
	 * Whether to use vision capabilities
	 */
	useVision?: boolean;

	/**
	 * Whether to save history
	 */
	saveHistory?: boolean;

	/**
	 * Path to save history
	 */
	historyPath?: string;

	/**
	 * Maximum input tokens
	 */
	maxInputTokens?: number;

	/**
	 * Whether to validate outputs
	 */
	validateOutput?: boolean;

	/**
	 * DOM attributes to include
	 */
	includeAttributes?: string[];

	/**
	 * Maximum length of error messages
	 */
	maxErrorLength?: number;

	/**
	 * Delay between retries in seconds
	 */
	retryDelay?: number;

	/**
	 * Browser configuration
	 */
	browserConfig?: {
		headless?: boolean;
		disableSecurity?: boolean;
		extraChromiumArgs?: string[];
		newContextConfig?: BrowserContextConfig;
		tracePath?: string;
		recordingPath?: string;
	};

	/**
	 * Telemetry configuration
	 */
	telemetry?: {
		enabled: boolean;
		provider: "posthog" | "custom";
		options?: Record<string, unknown>;
	};

	/**
	 * Vision configuration
	 */
	vision?: {
		enabled: boolean;
		model?: string;
		maxTokens?: number;
	};
}
