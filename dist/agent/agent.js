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
const MAX_TOKENS = 4000; // Default max tokens
const CHARS_PER_TOKEN = 4; // Approximate chars per token
function estimateTokens(text) {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
}
function getMessageText(content) {
    if (typeof content === 'string') {
        return content;
    }
    if (Array.isArray(content)) {
        return content
            .map(item => {
            if (typeof item === 'string')
                return item;
            if (item && typeof item === 'object' && 'text' in item) {
                return String(item.text);
            }
            return '';
        })
            .join('\n');
    }
    return JSON.stringify(content);
}
function cleanLLMResponse(text) {
    // Remove any markdown code block syntax
    const cleanedText = text.replace(/```json\s*|\s*```/g, '');
    // Ensure the text is valid JSON
    try {
        JSON.parse(cleanedText);
        return cleanedText;
    }
    catch {
        // If not valid JSON, try to extract JSON portion
        const match = cleanedText.match(/\{[\s\S]*\}/);
        return match ? match[0] : cleanedText;
    }
}
class Agent {
    constructor(config) {
        this.lastResult = null;
        this.ownsBrowser = false;
        this.ownsBrowserContext = false;
        this.config = config;
        this.browserInstance = config.browser;
        this.browserContextInstance = config.browserContext;
        this.controller = config.controller ?? new controller_1.Controller();
        this.messageManager = new message_manager_1.MessageManager();
        this.systemPrompt = new prompts_1.SystemPrompt({
            useVision: config.useVision,
            includeMemory: true,
            maxActionsPerStep: config.maxActionsPerStep
        });
    }
    async run(maxSteps = 3) {
        try {
            if (!this.browserContextInstance) {
                if (!this.browserInstance) {
                    this.browserInstance = new browser_1.Browser();
                    this.ownsBrowser = true;
                }
                this.browserContextInstance = await this.browserInstance.newContext();
                this.ownsBrowserContext = true;
            }
            const browserState = await this.browserContextInstance.getState();
            await this.messageManager.addMessage(new schema_1.SystemMessage(this.systemPrompt.getPrompt(browserState, { step_number: 1, max_steps: maxSteps }, this.config.task)));
            let step = 1;
            while (step <= maxSteps) {
                const result = await this.runStep(step);
                if (result.isDone) {
                    return result.output;
                }
                step++;
            }
            return this.createSuccessOutput({
                message: "Reached maximum steps",
                data: this.lastResult
            });
        }
        catch (error) {
            return this.createErrorOutput(error instanceof Error ? error.message : "Unknown error");
        }
        finally {
            await this.cleanup();
        }
    }
    async runStep(step) {
        if (!this.browserContextInstance) {
            throw new Error("Browser context not initialized");
        }
        try {
            const browserState = await this.browserContextInstance.getState();
            // Estimate tokens and truncate if needed
            const stateText = JSON.stringify(browserState);
            if (estimateTokens(stateText) > MAX_TOKENS) {
                console.warn('Browser state too large, truncating...');
                browserState.content = browserState.content.slice(0, MAX_TOKENS * CHARS_PER_TOKEN);
            }
            await this.messageManager.addMessage(new schema_1.SystemMessage(this.systemPrompt.getPrompt(browserState, { step_number: step, max_steps: this.config.maxSteps ?? 3 }, this.config.task)));
            const response = await this.config.llm.call(this.messageManager.getMessages());
            const responseText = cleanLLMResponse(getMessageText(response.content));
            const parsedResponse = JSON.parse(responseText);
            for (const action of parsedResponse.action) {
                const [actionName, parameters] = Object.entries(action)[0];
                console.log(`Executing action: ${actionName}`, parameters);
                const result = await this.controller.executeAction(actionName, parameters, this.browserContextInstance);
                this.lastResult = result;
                if (result.isDone) {
                    return {
                        isDone: true,
                        output: this.createSuccessOutput({
                            message: result.message || "Task completed",
                            data: result.data
                        })
                    };
                }
            }
            return {
                isDone: false,
                output: this.createSuccessOutput({
                    message: "Step completed",
                    data: this.lastResult
                })
            };
        }
        catch (error) {
            console.error('Step error:', error);
            throw new Error(`Step ${step} failed: ${error.message}`);
        }
    }
    async cleanup() {
        if (this.browserContextInstance && this.ownsBrowserContext) {
            await this.browserContextInstance.close();
            this.browserContextInstance = undefined;
        }
        if (this.browserInstance && this.ownsBrowser) {
            await this.browserInstance.close();
            this.browserInstance = undefined;
        }
    }
    createSuccessOutput(data) {
        return {
            current_state: {
                evaluation_previous_goal: "Success",
                memory: "Task completed successfully",
                next_goal: "None - task complete"
            },
            action: [{
                    done: {
                        message: "Task completed successfully",
                        data
                    }
                }]
        };
    }
    createErrorOutput(error) {
        return {
            current_state: {
                evaluation_previous_goal: "Failed",
                memory: `Error occurred: ${error}`,
                next_goal: "Handle error and retry"
            },
            action: [{
                    error: {
                        message: error
                    }
                }]
        };
    }
}
exports.Agent = Agent;
