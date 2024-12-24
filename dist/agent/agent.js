"use strict";
/**
 * Browser automation agent powered by LLMs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const schema_1 = require("langchain/schema");
const browser_1 = require("../browser");
const controller_1 = require("../controller");
const message_manager_1 = require("./message-manager");
const prompts_1 = require("./prompts");
const defaultConfig = {
    task: "",
    model: "gpt-4",
    maxSteps: 3,
    maxActionsPerStep: 10,
    maxFailures: 5,
    useVision: true,
    saveHistory: false,
    historyPath: undefined,
    maxInputTokens: 1000,
    validateOutput: false,
    includeAttributes: [
        "title",
        "type",
        "name",
        "role",
        "tabindex",
        "aria-label",
        "placeholder",
        "value",
        "alt",
        "aria-expanded",
    ],
    maxErrorLength: 400,
    retryDelay: 10,
};
/**
 * Estimate the number of tokens in a string
 * This is a rough estimate based on GPT tokenization rules
 */
function estimateTokens(text) {
    // Split on whitespace and punctuation
    const words = text.split(/[\s\p{P}]+/u).filter(Boolean);
    // Count special tokens (uppercase words, numbers, and non-ASCII characters)
    const specialTokens = (text.match(/[A-Z]{2,}|\d+|[^\x20-\x7E]/g)?.length || 0);
    // Base estimate: words + special tokens + some overhead
    return words.length + specialTokens + Math.ceil(text.length / 100);
}
/**
 * Extract text content from LangChain message content
 */
function getMessageText(content) {
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content
            .map(item => {
            if (typeof item === 'string') {
                return item;
            }
            if (item && typeof item === 'object') {
                if ('text' in item && typeof item.text === 'string') {
                    return item.text;
                }
                if ('image_url' in item) {
                    return ''; // Skip image URLs in token count
                }
            }
            return '';
        })
            .join(' ');
    }
    return '';
}
/**
 * Clean the LLM response by removing markdown code blocks and other formatting
 */
function cleanLLMResponse(text) {
    // Remove markdown code blocks and whitespace
    return text
        .replace(/```(?:json)?\n/g, '')
        .replace(/\n```/g, '')
        .trim();
}
/**
 * Browser automation agent powered by LLMs
 */
class Agent {
    constructor(config) {
        this.browser = null;
        this.browserContext = null;
        this.lastResult = null;
        this.ownsBrowser = false;
        this.ownsBrowserContext = false;
        this.config = {
            ...defaultConfig,
            task: config.task,
            useVision: config.useVision ?? defaultConfig.useVision,
            maxFailures: config.maxFailures ?? defaultConfig.maxFailures,
            retryDelay: config.retryDelay ?? defaultConfig.retryDelay,
            maxInputTokens: config.maxInputTokens ?? defaultConfig.maxInputTokens,
            validateOutput: config.validateOutput ?? defaultConfig.validateOutput,
            includeAttributes: config.includeAttributes ?? defaultConfig.includeAttributes,
            maxErrorLength: config.maxErrorLength ?? defaultConfig.maxErrorLength,
            maxActionsPerStep: config.maxActionsPerStep ?? defaultConfig.maxActionsPerStep,
        };
        this.llm = config.llm;
        this.controller = config.controller ?? new controller_1.Controller();
        this.messageManager = new message_manager_1.MessageManager();
        this.systemPrompt = new prompts_1.SystemPrompt(config.task, this.config.maxActionsPerStep);
        if (config.browser) {
            this.browser = config.browser;
        }
        if (config.browserContext) {
            this.browserContext = config.browserContext;
        }
    }
    /**
     * Run the agent with the given task
     */
    async run(maxSteps = 3) {
        try {
            // Initialize browser if needed
            if (!this.browserContext) {
                if (!this.browser) {
                    this.browser = new browser_1.Browser();
                    this.ownsBrowser = true;
                }
                this.browserContext = await this.browser.newContext();
                this.ownsBrowserContext = true;
            }
            // Initialize system prompt
            await this.messageManager.addMessage(new schema_1.SystemMessage(this.systemPrompt.toString()));
            // Run steps
            let step = 1;
            while (step <= maxSteps) {
                const result = await this.runStep(step);
                if (result.isDone) {
                    return result.output;
                }
                step++;
            }
            return {
                status: "success",
                message: "Reached maximum steps",
                data: this.lastResult,
            };
        }
        catch (error) {
            return {
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
                data: null,
            };
        }
        finally {
            await this.cleanup();
        }
    }
    /**
     * Run a single step of the agent
     */
    async runStep(step) {
        if (!this.browserContext) {
            throw new Error("Browser context not initialized");
        }
        try {
            // Get current browser state
            const state = await this.browserContext.getState(this.config.useVision);
            // Create state for LLM without screenshot if needed
            const stateForLLM = this.config.maxInputTokens && state.screenshot
                ? {
                    ...state,
                    screenshot: undefined, // This will be omitted in JSON.stringify
                }
                : state;
            // Add state to message history
            await this.messageManager.addMessage(new schema_1.SystemMessage(JSON.stringify(stateForLLM)));
            // Get agent response
            const messages = this.messageManager.getMessages();
            // Estimate total tokens
            const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(getMessageText(msg.content)), 0);
            if (this.config.maxInputTokens && totalTokens > this.config.maxInputTokens) {
                // Keep system prompt and last few messages
                const systemPrompt = messages[0];
                const recentMessages = messages.slice(-3); // Keep last 3 messages
                this.messageManager.clear();
                await this.messageManager.addMessage(systemPrompt);
                for (const msg of recentMessages) {
                    await this.messageManager.addMessage(msg);
                }
            }
            const response = await this.llm.call(this.messageManager.getMessages());
            const responseText = cleanLLMResponse(response.content.toString());
            // Parse and validate response
            let parsedResponse;
            try {
                parsedResponse = JSON.parse(responseText);
            }
            catch (error) {
                throw new Error(`Invalid JSON response: ${responseText}`);
            }
            // Add default current_state if missing
            if (!parsedResponse.current_state) {
                parsedResponse.current_state = {
                    evaluation_previous_goal: "Unknown - No previous goal evaluation provided",
                    memory: "No memory provided",
                    next_goal: "Execute the provided actions",
                };
            }
            if (!parsedResponse.action || !Array.isArray(parsedResponse.action)) {
                throw new Error(`Invalid response format. Expected 'action' array, got: ${responseText}`);
            }
            // Add agent's thoughts to message history
            await this.messageManager.addMessage(new schema_1.SystemMessage(JSON.stringify(parsedResponse.current_state)));
            // Execute actions
            for (const action of parsedResponse.action) {
                if (!action || typeof action !== 'object') {
                    throw new Error(`Invalid action format: ${JSON.stringify(action)}`);
                }
                const [actionName, parameters] = Object.entries(action)[0];
                const result = await this.controller.executeAction(actionName, parameters, this.browserContext);
                this.lastResult = result;
                if (result.isDone) {
                    return {
                        isDone: true,
                        output: {
                            status: "success",
                            message: result.message || "Task completed",
                            data: result.data,
                        },
                    };
                }
            }
            return {
                isDone: false,
                output: {
                    status: "success",
                    message: "Step completed",
                    data: this.lastResult,
                },
            };
        }
        catch (error) {
            throw new Error(`Step ${step} failed: ${error.message}`);
        }
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.browserContext && this.ownsBrowserContext) {
            await this.browserContext.close();
            this.browserContext = null;
        }
        if (this.browser && this.ownsBrowser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    /**
     * Create a GIF of the agent's history
     */
    async createHistoryGif() {
        // TODO: Implement history GIF creation
        throw new Error("Not implemented");
    }
}
exports.Agent = Agent;
