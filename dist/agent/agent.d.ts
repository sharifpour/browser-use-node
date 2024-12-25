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
     * Maximum number of steps
     */
    maxSteps?: number;
    /**
     * Maximum actions per step
     */
    maxActionsPerStep?: number;
}
export declare class Agent {
    private readonly config;
    private browserInstance?;
    private browserContextInstance?;
    private readonly controller;
    private readonly messageManager;
    private readonly systemPrompt;
    private lastResult;
    private ownsBrowser;
    private ownsBrowserContext;
    constructor(config: AgentRunConfig);
    run(maxSteps?: number): Promise<AgentOutput>;
    private runStep;
    private cleanup;
    private createSuccessOutput;
    private createErrorOutput;
}
