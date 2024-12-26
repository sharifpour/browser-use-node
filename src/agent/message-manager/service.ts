import type { ChatOpenAI } from 'langchain/chat_models/openai';
import type { BaseMessage } from 'langchain/schema';
import type { SystemPrompt } from '../prompts';
import type { AgentOutput, AgentStepInfo } from '../types';
import type { BrowserState } from '../../browser/types';
import type { ActionResult } from '../../controller/types';
import { AgentMessagePrompt } from '../prompts';
import { AIMessage as AIMessageClass, HumanMessage as HumanMessageClass } from 'langchain/schema';
import { MessageHistoryImpl } from './types';
import type { MessageMetadata } from './types';

export interface MessageManagerConfig {
	llm: ChatOpenAI;
	task: string;
	actionDescriptions: string;
	systemPromptClass: typeof SystemPrompt;
	maxInputTokens?: number;
	estimatedTokensPerCharacter?: number;
	imageTokens?: number;
	includeAttributes?: string[];
	maxErrorLength?: number;
	maxActionsPerStep?: number;
}

export class MessageManager {
	private readonly llm: ChatOpenAI;
	private readonly systemPromptClass: typeof SystemPrompt;
	private maxInputTokens: number;
	private readonly history: MessageHistoryImpl;
	private readonly task: string;
	private readonly actionDescriptions: string;
	private readonly ESTIMATED_TOKENS_PER_CHARACTER: number;
	private readonly IMG_TOKENS: number;
	private readonly includeAttributes: string[];
	private readonly maxErrorLength: number;
	private readonly maxActionsPerStep: number;
	private readonly systemPrompt: BaseMessage;

	constructor(config: MessageManagerConfig) {
		this.llm = config.llm;
		this.systemPromptClass = config.systemPromptClass;
		this.maxInputTokens = config.maxInputTokens ?? 128000;
		this.history = new MessageHistoryImpl();
		this.task = config.task;
		this.actionDescriptions = config.actionDescriptions;
		this.ESTIMATED_TOKENS_PER_CHARACTER = config.estimatedTokensPerCharacter ?? 3;
		this.IMG_TOKENS = config.imageTokens ?? 800;
		this.includeAttributes = config.includeAttributes ?? [];
		this.maxErrorLength = config.maxErrorLength ?? 400;
		this.maxActionsPerStep = config.maxActionsPerStep ?? 10;

		// Initialize with system message
		const systemMessage = new this.systemPromptClass(
			this.actionDescriptions,
			new Date(),
			this.maxActionsPerStep
		).getSystemMessage();
		this.systemPrompt = systemMessage;
		this.addMessageWithTokensSync(systemMessage, 'system');

		// Add task message
		const taskMessage = new HumanMessageClass({ content: `Your task is: ${this.task}` });
		this.addMessageWithTokensSync(taskMessage, 'human');
	}

	public async addStateMessage(
		state: BrowserState,
		result: ActionResult[] | null = null,
		stepInfo: AgentStepInfo | null = null
	): Promise<void> {
		// If keep in memory, add to history and add state without result
		let currentResult = result;
		if (currentResult) {
			for (const r of currentResult) {
				if (r.include_in_memory) {
					if (r.extracted_content) {
						const msg = new HumanMessageClass({ content: String(r.extracted_content) });
						await this.addMessageWithTokens(msg, 'human');
					}
					if (r.error) {
						const msg = new HumanMessageClass({ content: String(r.error).slice(-this.maxErrorLength) });
						await this.addMessageWithTokens(msg, 'human');
					}
					currentResult = null; // if result in history, we don't want to add it again
					break;
				}
			}
		}

		// Create state message using AgentMessagePrompt
		const stateMessage = new AgentMessagePrompt(
			state,
			currentResult,
			this.includeAttributes,
			this.maxErrorLength,
			stepInfo
		).getUserMessage();

		await this.addMessageWithTokens(stateMessage, 'human');
	}

	public async addModelOutput(output: AgentOutput): Promise<void> {
		const content = JSON.stringify(output, (key, value) => {
			if (value === undefined || value === null) return undefined;
			if (Array.isArray(value) && value.length === 0) return undefined;
			if (typeof value === 'object' && Object.keys(value).length === 0) return undefined;
			return value;
		});
		await this.addMessageWithTokens(new AIMessageClass({ content }), 'assistant');
	}

	public getMessages(): BaseMessage[] {
		this.cutMessages();
		return this.history.messages.map(m => m.message);
	}

	public removeLastStateMessage(): void {
		if (
			this.history.messages.length > 2 &&
			this.history.messages[this.history.messages.length - 1].message instanceof HumanMessageClass
		) {
			this.history.removeMessage();
		}
	}

	private cutMessages(): void {
		let diff = this.history.totalTokens - this.maxInputTokens;
		if (diff <= 0) return;

		const lastMsg = this.history.messages[this.history.messages.length - 1];

		// If list with image remove image
		if (Array.isArray(lastMsg.message.content)) {
			let text = '';
			for (const item of lastMsg.message.content) {
				if ('image_url' in item) {
					lastMsg.message.content.splice(lastMsg.message.content.indexOf(item), 1);
					const imgTokens = this.IMG_TOKENS;
					diff -= imgTokens;
					lastMsg.metadata.inputTokens -= imgTokens;
					this.history.totalTokens -= imgTokens;
					console.debug(`Removed image with ${imgTokens} tokens - total tokens now: ${this.history.totalTokens}/${this.maxInputTokens}`);
				} else if ('text' in item && typeof item === 'object') {
					text += item.text;
				}
			}
			lastMsg.message.content = text;
			this.history.messages[this.history.messages.length - 1] = lastMsg;
		}

		if (diff <= 0) return;

		// If still over, remove text from state message proportionally
		const proportionToRemove = diff / lastMsg.metadata.inputTokens;
		if (proportionToRemove > 0.99) {
			throw new Error(
				`Max token limit reached - history is too long - reduce the system prompt or task less tasks or remove old messages. proportion_to_remove: ${proportionToRemove}`
			);
		}

		console.debug(
			`Removing ${proportionToRemove * 100}% of the last message (${proportionToRemove * lastMsg.metadata.inputTokens} / ${lastMsg.metadata.inputTokens} tokens)`
		);

		const content = typeof lastMsg.message.content === 'string' ? lastMsg.message.content : JSON.stringify(lastMsg.message.content);
		const charactersToRemove = Math.floor(content.length * proportionToRemove);
		const newContent = content.slice(0, -charactersToRemove);

		// Remove old message
		this.history.removeMessage();

		// Add new message with updated content
		const newMsg = new HumanMessageClass({ content: newContent });
		this.addMessageWithTokensSync(newMsg, 'human');

		const finalMsg = this.history.messages[this.history.messages.length - 1];
		console.debug(
			`Added message with ${finalMsg.metadata.inputTokens} tokens - total tokens now: ${this.history.totalTokens}/${this.maxInputTokens} - total messages: ${this.history.messages.length}`
		);
	}

	private async countTextTokens(text: string): Promise<number> {
		try {
			return await this.llm.getNumTokens(text);
		} catch {
			// Rough estimate if no tokenizer available
			return Math.floor(text.length / this.ESTIMATED_TOKENS_PER_CHARACTER);
		}
	}

	private countTextTokensSync(text: string): number {
		// Only used in constructor and other sync contexts
		return Math.floor(text.length / this.ESTIMATED_TOKENS_PER_CHARACTER);
	}

	private async countTokens(message: BaseMessage): Promise<number> {
		let tokens = 0;
		if (Array.isArray(message.content)) {
			for (const item of message.content) {
				if ('image_url' in item) {
					tokens += this.IMG_TOKENS;
				} else if (typeof item === 'object' && 'text' in item) {
					tokens += await this.countTextTokens(item.text);
				}
			}
		} else {
			tokens += await this.countTextTokens(message.content);
		}
		return tokens;
	}

	private countTokensSync(message: BaseMessage): number {
		// Only used in constructor and other sync contexts
		let tokens = 0;
		if (Array.isArray(message.content)) {
			for (const item of message.content) {
				if ('image_url' in item) {
					tokens += this.IMG_TOKENS;
				} else if (typeof item === 'object' && 'text' in item) {
					tokens += this.countTextTokensSync(item.text);
				}
			}
		} else {
			tokens += this.countTextTokensSync(message.content);
		}
		return tokens;
	}

	private async addMessageWithTokens(message: BaseMessage, type: MessageMetadata['type']): Promise<void> {
		const tokens = await this.countTokens(message);
		const managedMessage = {
			message,
			metadata: {
				inputTokens: tokens,
				timestamp: new Date().toISOString(),
				type
			}
		};

		this.history.messages.push(managedMessage);
		this.history.totalTokens += tokens;

		if (this.history.totalTokens > this.maxInputTokens) {
			this.cutMessages();
		}
	}

	private addMessageWithTokensSync(message: BaseMessage, type: MessageMetadata['type']): void {
		// Only used in constructor and other sync contexts
		const tokens = this.countTokensSync(message);
		const managedMessage = {
			message,
			metadata: {
				inputTokens: tokens,
				timestamp: new Date().toISOString(),
				type
			}
		};

		this.history.messages.push(managedMessage);
		this.history.totalTokens += tokens;

		if (this.history.totalTokens > this.maxInputTokens) {
			this.cutMessages();
		}
	}

	public reduceTokenLimit(reduction: number): void {
		this.maxInputTokens = this.maxInputTokens - reduction;
		console.log(`Cutting tokens from history - new max input tokens: ${this.maxInputTokens}`);
		this.cutMessages();
	}
}