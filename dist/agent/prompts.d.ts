/**
 * Agent prompts and templates
 */
import type { AgentStepInfo } from "./types";
import type { BrowserState } from "../browser/types";
/**
 * System prompt for the agent
 */
export declare class SystemPrompt {
    private readonly promptConfig;
    constructor(promptConfig?: {
        useVision?: boolean;
        includeMemory?: boolean;
        maxActionsPerStep?: number;
    });
    /**
     * Get the system prompt
     */
    getPrompt(browserState: BrowserState, stepInfo: AgentStepInfo, task: string, memory?: string): string;
    /**
     * Vision capabilities description
     */
    private visionCapabilities;
    /**
     * Convert the prompt to a string
     */
    toString(): string;
    /**
     * Get the task description
     */
    private taskDescription;
    /**
     * Get the important rules
     */
    private importantRules;
    /**
     * Get the input format description
     */
    private inputFormat;
    /**
     * Get the available actions description
     */
    private availableActions;
}
