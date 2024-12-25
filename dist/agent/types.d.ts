/**
 * Agent types and interfaces
 */
import type { BrowserState } from "../browser/types";
import type { BrowserContextConfig } from "../browser/context";
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
    is_done?: boolean;
    extracted_content?: string;
    error?: string;
    include_in_memory: boolean;
}
/**
 * Agent history - matches Python's AgentHistory
 */
export interface AgentHistory {
    step_number: number;
    browser_state: BrowserState;
    model_output: AgentOutput;
    action_result: ActionResult;
    timestamp: number;
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
export declare class AgentError extends Error {
    readonly type: "validation" | "execution" | "browser" | "llm";
    constructor(message: string, type?: "validation" | "execution" | "browser" | "llm");
}
/**
 * Agent status enum
 */
export declare enum AgentStatus {
    IDLE = "idle",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed"
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
