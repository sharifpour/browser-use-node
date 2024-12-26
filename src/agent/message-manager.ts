/**
 * Message manager for handling agent messages
 */

import { AIMessage, SystemMessage, HumanMessage } from "langchain/schema";
import type { BaseMessage } from "langchain/schema";
import type { BrowserState } from "../browser/types";
import type { ActionResult } from "../controller/types";
import type { AgentOutput, AgentStepInfo } from "./types";
import { SystemPrompt } from "./prompts";
import { AgentMessagePrompt } from "./prompts";

interface MessageMetadata {
	inputTokens: number;
}

interface ManagedMessage {
	message: BaseMessage;
	metadata: MessageMetadata;
}

interface MessageHistory {
	messages: ManagedMessage[];
	totalTokens: number;
}

/**
 * Message manager for handling agent messages
 */
export class MessageManager {
	private history: MessageHistory = {
		messages: [],
		totalTokens: 0
	};
	private readonly maxInputTokens: number;
	private readonly includeAttributes: string[];
	private readonly maxErrorLength: number;
	private readonly task: string;
	private readonly actionDescriptions: string;
	private readonly systemPromptClass: typeof SystemPrompt;
	private readonly ESTIMATED_TOKENS_PER_CHARACTER = 3;
	private readonly IMG_TOKENS = 800;
	private readonly maxActionsPerStep: number;

	constructor(config: {
		maxInputTokens?: number;
		includeAttributes?: string[];
		maxErrorLength?: number;
		task?: string;
		actionDescriptions?: string;
		systemPromptClass?: typeof SystemPrompt;
		maxActionsPerStep?: number;
	} = {}) {
		this.maxInputTokens = config.maxInputTokens ?? 128000;
		this.includeAttributes = config.includeAttributes ?? [];
		this.maxErrorLength = config.maxErrorLength ?? 400;
		this.task = config.task ?? '';
		this.actionDescriptions = config.actionDescriptions ?? '';
		this.systemPromptClass = config.systemPromptClass ?? SystemPrompt;
		this.maxActionsPerStep = config.maxActionsPerStep ?? 10;

		// Initialize with system message
		const systemMessage = new this.systemPromptClass({
			actionDescription: this.actionDescriptions,
			currentDate: new Date(),
			maxActionsPerStep: this.maxActionsPerStep
		}).getSystemMessage();

		this.addMessageWithTokens(systemMessage);

		// Add task message
		const taskMessage = new HumanMessage(`Your task is: ${this.task}`);
		this.addMessageWithTokens(taskMessage);
	}

	addStateMessage(
		state: BrowserState,
		result: ActionResult[] | null = null,
		stepInfo: AgentStepInfo | null = null
	): void {
		// If keep in memory, add to history and add state without result
		if (result) {
			for (const r of result) {
				if (r.include_in_memory) {
					if (r.extracted_content) {
						const msg = new HumanMessage(r.extracted_content);
						this.addMessageWithTokens(msg);
					}
					if (r.error) {
						const msg = new HumanMessage(r.error.slice(-this.maxErrorLength));
						this.addMessageWithTokens(msg);
					}
					result = null; // if result in history, we don't want to add it again
				}
			}
		}

		// Create state message using AgentMessagePrompt
		const stateMessage = new AgentMessagePrompt(
			state,
			result,
			this.includeAttributes,
			this.maxErrorLength,
			stepInfo
		).getUserMessage();

		this.addMessageWithTokens(stateMessage);
	}

	addModelOutput(output: AgentOutput): void {
		const content = JSON.stringify(output);
		this.addMessageWithTokens(new AIMessage(content));
	}

	getMessages(): BaseMessage[] {
		this.cutMessages();
		return this.history.messages.map(m => m.message);
	}

	removeLastStateMessage(): void {
		if (this.history.messages.length > 2 &&
			this.history.messages[this.history.messages.length - 1].message instanceof HumanMessage) {
			const msg = this.history.messages.pop();
			if (msg) {
				this.history.totalTokens -= msg.metadata.inputTokens;
			}
		}
	}

	cutMessages(): void {
		let diff = this.history.totalTokens - this.maxInputTokens;
		if (diff <= 0) {
			return;
		}

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

		if (diff <= 0) {
			return;
		}

		// If still over, remove text from state message proportionally
		const proportionToRemove = diff / lastMsg.metadata.inputTokens;
		if (proportionToRemove > 0.99) {
			throw new Error(
				`Max token limit reached - history is too long - reduce the system prompt or task less tasks or remove old messages. ` +
				`proportion_to_remove: ${proportionToRemove}`
			);
		}

		console.debug(
			`Removing ${proportionToRemove * 100}% of the last message (${proportionToRemove * lastMsg.metadata.inputTokens} / ${lastMsg.metadata.inputTokens} tokens)`
		);

		const content = typeof lastMsg.message.content === 'string' ? lastMsg.message.content : JSON.stringify(lastMsg.message.content);
		const charactersToRemove = Math.floor(content.length * proportionToRemove);
		const newContent = content.slice(0, -charactersToRemove);

		// Remove old message
		this.history.messages.pop();
		this.history.totalTokens -= lastMsg.metadata.inputTokens;

		// Add new message with updated content
		const newMsg = new HumanMessage(newContent);
		this.addMessageWithTokens(newMsg);

		const finalMsg = this.history.messages[this.history.messages.length - 1];
		console.debug(
			`Added message with ${finalMsg.metadata.inputTokens} tokens - total tokens now: ${this.history.totalTokens}/${this.maxInputTokens} - total messages: ${this.history.messages.length}`
		);
	}

	private addMessageWithTokens(message: BaseMessage): void {
		// Estimate tokens based on character count
		const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
		const tokens = content.length * this.ESTIMATED_TOKENS_PER_CHARACTER;

		const managedMessage: ManagedMessage = {
			message,
			metadata: {
				inputTokens: tokens
			}
		};

		this.history.messages.push(managedMessage);
		this.history.totalTokens += tokens;

		if (this.history.totalTokens > this.maxInputTokens) {
			this.cutMessages();
		}
	}
}
