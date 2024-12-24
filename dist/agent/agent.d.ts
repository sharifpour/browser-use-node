/**
 * Browser automation agent powered by LLMs.
 */
import type { BaseChatModel } from "langchain/chat_models/base";
import { Browser, type BrowserContext } from "../browser";
import { Controller } from "../controller";
import type { AgentOutput } from "./types";
export interface AgentRunConfig {
    /**
     * The task to perform
     */
    task: string;
    /**
     * The LLM to use for decision making
     */
    llm: BaseChatModel;
    /**
     * Optional browser instance
     */
    browser?: Browser;
    /**
     * Optional browser context
     */
    browserContext?: BrowserContext;
    /**
     * Optional controller instance
     */
    controller?: Controller;
    /**
     * Whether to use vision capabilities
     */
    useVision?: boolean;
    /**
     * Path to save conversation history
     */
    saveConversationPath?: string;
    /**
     * Maximum number of failures before giving up
     */
    maxFailures?: number;
    /**
     * Delay between retries in seconds
     */
    retryDelay?: number;
    /**
     * Maximum number of input tokens
     */
    maxInputTokens?: number;
    /**
     * Whether to validate outputs
     */
    validateOutput?: boolean;
    /**
     * DOM attributes to include in observations
     */
    includeAttributes?: string[];
    /**
     * Maximum length of error messages
     */
    maxErrorLength?: number;
    /**
     * Maximum actions per step
     */
    maxActionsPerStep?: number;
}
/**
 * Browser automation agent powered by LLMs
 */
export declare class Agent {
    private readonly messageManager;
    private readonly systemPrompt;
    private readonly config;
    private readonly controller;
    private readonly llm;
    private browser;
    private browserContext;
    private lastResult;
    private ownsBrowser;
    private ownsBrowserContext;
    constructor(config: AgentRunConfig);
    /**
     * Run the agent with the given task
     */
    run(maxSteps?: number): Promise<AgentOutput>;
    /**
     * Run a single step of the agent
     */
    private runStep;
    /**
     * Clean up resources
     */
    private cleanup;
    /**
     * Create a GIF of the agent's history
     */
    createHistoryGif(): Promise<void>;
}
