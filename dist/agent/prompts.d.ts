/**
 * Agent prompts and templates
 */
/**
 * System prompt for the agent
 */
export declare class SystemPrompt {
    private readonly actionDescription;
    private readonly currentDate;
    private readonly maxActionsPerStep;
    constructor(actionDescription: string, maxActionsPerStep?: number);
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
