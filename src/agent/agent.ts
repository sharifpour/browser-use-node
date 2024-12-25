/**
 * Browser automation agent powered by LLMs.
 */

import type { BaseChatModel } from "langchain/chat_models/base";
import { SystemMessage } from "langchain/schema";
import { Browser, type BrowserContext } from "../browser";
import { Controller } from "../controller";
import { MessageManager } from "./message-manager";
import { SystemPrompt } from "./prompts";
import type { AgentBrain, AgentOutput } from "./types";
import type { ActionResult } from "../controller/types";

interface LLMResponse {
	current_state: AgentBrain;
	action: Array<{
		[key: string]: Record<string, unknown>;
	}>;
}

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

const MAX_TOKENS = 4000;  // Default max tokens
const CHARS_PER_TOKEN = 4;  // Approximate chars per token

function estimateTokens(text: string): number {
	return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function getMessageText(content: unknown): string {
	if (typeof content === 'string') {
		return content;
	}
	if (Array.isArray(content)) {
		return content
			.map(item => {
				if (typeof item === 'string') return item;
				if (item && typeof item === 'object' && 'text' in item) {
					return String(item.text);
				}
				return '';
			})
			.join('\n');
	}
	return JSON.stringify(content);
}

function cleanLLMResponse(text: string): string {
	// Remove any markdown code block syntax
	const cleanedText = text.replace(/```json\s*|\s*```/g, '');

	// Ensure the text is valid JSON
	try {
		JSON.parse(cleanedText);
		return cleanedText;
	} catch {
		// If not valid JSON, try to extract JSON portion
		const match = cleanedText.match(/\{[\s\S]*\}/);
		return match ? match[0] : cleanedText;
	}
}

export class Agent {
	private readonly config: AgentRunConfig;
	private browserInstance?: Browser;
	private browserContextInstance?: BrowserContext;
	private readonly controller: Controller;
	private readonly messageManager: MessageManager;
	private readonly systemPrompt: SystemPrompt;
	private lastResult: ActionResult | null = null;
	private ownsBrowser = false;
	private ownsBrowserContext = false;

	constructor(config: AgentRunConfig) {
		this.config = config;
		this.browserInstance = config.browser;
		this.browserContextInstance = config.browserContext;
		this.controller = config.controller ?? new Controller();
		this.messageManager = new MessageManager();
		this.systemPrompt = new SystemPrompt({
			useVision: config.useVision,
			includeMemory: true,
			maxActionsPerStep: config.maxActionsPerStep
		});
	}

	async run(maxSteps = 3): Promise<AgentOutput> {
		try {
			if (!this.browserContextInstance) {
				if (!this.browserInstance) {
					this.browserInstance = new Browser();
					this.ownsBrowser = true;
				}
				this.browserContextInstance = await this.browserInstance.newContext();
				this.ownsBrowserContext = true;
			}

			const browserState = await this.browserContextInstance.getState();
			await this.messageManager.addMessage(
				new SystemMessage(this.systemPrompt.getPrompt(
					browserState,
					{ step_number: 1, max_steps: maxSteps },
					this.config.task
				))
			);

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

		} catch (error) {
			return this.createErrorOutput(
				error instanceof Error ? error.message : "Unknown error"
			);
		} finally {
			await this.cleanup();
		}
	}

	private async runStep(step: number): Promise<{ isDone: boolean; output: AgentOutput }> {
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

			await this.messageManager.addMessage(
				new SystemMessage(this.systemPrompt.getPrompt(
					browserState,
					{ step_number: step, max_steps: this.config.maxSteps ?? 3 },
					this.config.task
				))
			);

			const response = await this.config.llm.call(this.messageManager.getMessages());
			const responseText = cleanLLMResponse(getMessageText(response.content));
			const parsedResponse = JSON.parse(responseText) as LLMResponse;

			for (const action of parsedResponse.action) {
				const [actionName, parameters] = Object.entries(action)[0];
				console.log(`Executing action: ${actionName}`, parameters);

				const result = await this.controller.executeAction(
					actionName,
					parameters,
					this.browserContextInstance
				);

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

		} catch (error) {
			console.error('Step error:', error);
			throw new Error(`Step ${step} failed: ${error.message}`);
		}
	}

	private async cleanup(): Promise<void> {
		if (this.browserContextInstance && this.ownsBrowserContext) {
				await this.browserContextInstance.close();
				this.browserContextInstance = undefined;
		}
		if (this.browserInstance && this.ownsBrowser) {
				await this.browserInstance.close();
				this.browserInstance = undefined;
		}
	}

	private createSuccessOutput(data: unknown): AgentOutput {
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

	private createErrorOutput(error: string): AgentOutput {
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
