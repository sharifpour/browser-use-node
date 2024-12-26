/**
 * Browser automation agent powered by LLMs.
 */

import { v4 as uuidv4 } from 'uuid';
import { Browser } from '../browser/browser';
import { BrowserContext } from '../browser/context';
import { Controller } from '../controller/controller';
import { BaseChatModel } from '../types/llm';
import { AgentOutput, AgentBrain, ActionResult, AgentHistoryList, AgentHistory } from './types';
import { MessageManager } from './message-manager';
import path from 'path';
import fs from 'fs';

export interface AgentConfig {
	task: string;
	llm: BaseChatModel;
	browser?: Browser;
	browserContext?: BrowserContext;
	controller?: Controller;
	useVision?: boolean;
	saveConversationPath?: string;
	maxFailures?: number;
	retryDelay?: number;
	maxInputTokens?: number;
	validateOutput?: boolean;
	includeAttributes?: string[];
	maxErrorLength?: number;
	maxActionsPerStep?: number;
}

export class Agent {
	private readonly agentId: string;
	private readonly task: string;
	private readonly useVision: boolean;
	private readonly llm: BaseChatModel;
	private readonly saveConversationPath?: string;
	private readonly controller: Controller;
	private readonly maxActionsPerStep: number;
	private readonly maxFailures: number;
	private readonly retryDelay: number;
	private readonly validateOutput: boolean;
	private readonly includeAttributes: string[];
	private readonly maxErrorLength: number;

	private browserInstance?: Browser;
	private browserContextInstance?: BrowserContext;
	private readonly ownsBrowser: boolean;
	private readonly ownsBrowserContext: boolean;
	private messageManager: MessageManager;
	private history: AgentHistoryList;
	private nSteps: number;
	private consecutiveFailures: number;
	private lastResult?: ActionResult[];

	constructor(config: AgentConfig) {
		this.agentId = uuidv4();
		this.task = config.task;
		this.useVision = config.useVision ?? true;
		this.llm = config.llm;
		this.saveConversationPath = config.saveConversationPath;
		this.controller = config.controller ?? new Controller();
		this.maxActionsPerStep = config.maxActionsPerStep ?? 10;
		this.maxFailures = config.maxFailures ?? 5;
		this.retryDelay = config.retryDelay ?? 10;
		this.validateOutput = config.validateOutput ?? false;
		this.includeAttributes = config.includeAttributes ?? [
			'title',
			'type',
			'name',
			'role',
			'tabindex',
			'aria-label',
			'placeholder',
			'value',
			'alt',
			'aria-expanded'
		];
		this.maxErrorLength = config.maxErrorLength ?? 400;

		// Browser setup
		this.ownsBrowser = !config.browser;
		this.ownsBrowserContext = !config.browserContext;
		this.setupBrowser(config.browser, config.browserContext);

		// Initialize tracking variables
		this.history = { history: [] };
		this.nSteps = 1;
		this.consecutiveFailures = 0;

		// Initialize message manager
		this.messageManager = new MessageManager({
			llm: this.llm,
			task: this.task,
			actionDescriptions: this.controller.registry.getPromptDescription(),
			maxInputTokens: config.maxInputTokens ?? 128000,
			includeAttributes: this.includeAttributes,
			maxErrorLength: this.maxErrorLength,
			maxActionsPerStep: this.maxActionsPerStep
		});
	}

	private setupBrowser(browser?: Browser, browserContext?: BrowserContext): void {
		if (browserContext) {
			this.browserContextInstance = browserContext;
		} else if (browser) {
			this.browserInstance = browser;
			this.browserContextInstance = new BrowserContext(browser);
		} else {
			this.browserInstance = new Browser();
			this.browserContextInstance = new BrowserContext(this.browserInstance);
		}
	}

	public async run(maxSteps: number = 50): Promise<AgentHistoryList> {
		try {
			while (this.nSteps <= maxSteps && this.consecutiveFailures < this.maxFailures) {
				await this.step();

				if (this.lastResult?.some(r => r.isDone)) {
					break;
				}
			}

			if (this.validateOutput) {
				await this.validateFinalOutput();
			}

			return this.history;
		} finally {
			await this.cleanup();
		}
	}

	private async step(): Promise<void> {
		console.log(`\n📍 Step ${this.nSteps}`);
		let state = null;
		let modelOutput = null;
		let result: ActionResult[] = [];

		try {
			state = await this.browserContextInstance?.getState(this.useVision);
			if (!state) throw new Error('Failed to get browser state');

			this.messageManager.addStateMessage(state, this.lastResult, {
				step_number: this.nSteps,
				max_steps: this.maxActionsPerStep
			});
			const inputMessages = this.messageManager.getMessages();
			modelOutput = await this.getNextAction(inputMessages);

			if (this.saveConversationPath) {
				await this.saveConversation(inputMessages, modelOutput);
			}

			this.messageManager.removeLastStateMessage();
			this.messageManager.addModelOutput(modelOutput);

			result = await this.controller.multiAct(modelOutput.action, this.browserContextInstance!);
			this.lastResult = result;

			if (result.length > 0 && result[result.length - 1].isDone) {
				console.log(`📄 Result: ${result[result.length - 1].extractedContent}`);
			}

			this.consecutiveFailures = 0;
		} catch (error) {
			result = this.handleStepError(error);
			this.lastResult = result;
		} finally {
			if (result.length > 0 && state) {
				this.makeHistoryItem(modelOutput, state, result);
			}
		}
	}

	private async getNextAction(inputMessages: any[]): Promise<AgentOutput> {
		const response = await this.llm.generateStructuredOutput(inputMessages, 'AgentOutput');
		const parsed = response.parsed as AgentOutput;
		parsed.action = parsed.action.slice(0, this.maxActionsPerStep);
		this.logResponse(parsed);
		this.nSteps++;
		return parsed;
	}

	private logResponse(response: AgentOutput): void {
		const emoji = response.current_state.evaluation_previous_goal.includes('Success') ? '👍' :
			response.current_state.evaluation_previous_goal.includes('Failed') ? '���️' : '🤷';

		console.log(`${emoji} Eval: ${response.current_state.evaluation_previous_goal}`);
		console.log(`🧠 Memory: ${response.current_state.memory}`);
		console.log(`🎯 Next goal: ${response.current_state.next_goal}`);

		response.action.forEach((action, i) => {
			console.log(`🛠️  Action ${i + 1}/${response.action.length}: ${JSON.stringify(action)}`);
		});
	}

	private handleStepError(error: unknown): ActionResult[] {
		const errorMsg = this.formatError(error);
		const prefix = `❌ Result failed ${this.consecutiveFailures + 1}/${this.maxFailures} times:\n `;

		if (error instanceof Error) {
			if (error.message.includes('Max token limit reached')) {
				// Let the message manager handle token limit errors
				console.log('Token limit reached - messages will be pruned automatically');
			}
			this.consecutiveFailures++;
		}

		return [{
			error: errorMsg,
			includeInMemory: true
		}];
	}

	private formatError(error: unknown): string {
		if (error instanceof Error) {
			return error.message;
		}
		return String(error);
	}

	private makeHistoryItem(modelOutput: AgentOutput | null, state: any, result: ActionResult[]): void {
		const interactedElements = modelOutput ?
			this.getInteractedElements(modelOutput, state.selectorMap) :
			[null];

		const stateHistory = {
			url: state.url,
			title: state.title,
			tabs: state.tabs,
			interactedElement: interactedElements,
			screenshot: state.screenshot
		};

		const historyItem: AgentHistory = {
			modelOutput,
			result,
			state: stateHistory
		};

		this.history.history.push(historyItem);
	}

	private getInteractedElements(modelOutput: AgentOutput, selectorMap: Record<number, any>): Array<any | null> {
		return modelOutput.action.map(action => {
			const index = this.controller.registry.getActionIndex(action);
			if (index && index in selectorMap) {
				return this.convertDOMElementToHistoryElement(selectorMap[index]);
			}
			return null;
		});
	}

	private async validateFinalOutput(): Promise<boolean> {
		// Implementation similar to Python's _validate_output
		return true;
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

	private async saveConversation(inputMessages: BaseMessage[], response: AgentOutput): Promise<void> {
		if (!this.saveConversationPath) {
			return;
		}

		const dir = path.dirname(this.saveConversationPath);
		await fs.promises.mkdir(dir, { recursive: true });

		const filepath = `${this.saveConversationPath}_${this.nSteps}.txt`;
		const content: string[] = [];

		// Write messages
		for (const message of inputMessages) {
			content.push(` ${message.constructor.name} `);
			if (Array.isArray(message.content)) {
				for (const item of message.content) {
					if (typeof item === 'object' && 'type' in item && item.type === 'text') {
						content.push(item.text.trim());
					}
				}
			} else if (typeof message.content === 'string') {
				try {
					const parsed = JSON.parse(message.content);
					content.push(JSON.stringify(parsed, null, 2));
				} catch {
					content.push(message.content.trim());
				}
			}
			content.push('');
		}

		// Write response
		content.push(' RESPONSE');
		content.push(JSON.stringify(response, null, 2));

		await fs.promises.writeFile(filepath, content.join('\n'));
	}
}
