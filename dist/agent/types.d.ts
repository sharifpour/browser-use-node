/**
 * Agent types and interfaces
 */
import type { BrowserState } from "../browser/types";
import type { ActionResult } from "../controller/types";
/**
 * Agent brain - current state of the agent
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
 * Agent output
 */
export interface AgentOutput {
    status: "success" | "error";
    message: string;
    data: unknown;
}
/**
 * Agent configuration
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
}
/**
 * Agent status
 */
export type AgentStatus = "idle" | "running" | "done" | "error";
/**
 * Agent state
 */
export interface AgentState {
    /**
     * Current status
     */
    status: AgentStatus;
    /**
     * Current step number
     */
    currentStep: number;
    /**
     * Total steps executed
     */
    totalSteps: number;
    /**
     * Error message if any
     */
    error?: string;
    /**
     * Browser state
     */
    browserState: BrowserState;
}
/**
 * Agent message
 */
export interface AgentMessage {
    /**
     * Message role
     */
    role: "system" | "user" | "assistant";
    /**
     * Message content
     */
    content: string;
}
/**
 * Agent history entry
 */
export interface AgentHistory {
    /**
     * Step number
     */
    step: number;
    /**
     * Browser state
     */
    browserState: BrowserState;
    /**
     * Action result
     */
    actionResult: ActionResult;
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
    step: number;
    /**
     * Browser state
     */
    browserState: BrowserState;
    /**
     * Action result
     */
    actionResult: ActionResult;
}
/**
 * Agent error
 */
export declare class AgentError extends Error {
    constructor(message: string);
}
/**
 * Browser state history
 */
export interface BrowserStateHistory {
    states: BrowserState[];
    timestamps: number[];
}
