import { type BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ChatOpenAI } from '@langchain/openai';
import type { BrowserState } from '../../browser/types';
import { logger } from '../../utils/logger';
import { AgentMessagePrompt } from '../prompts/message';
import type { SystemPrompt } from '../prompts/system';
import type { ActionResult, AgentOutput, AgentStepInfo } from '../types';
import { MessageHistory } from './views';

export class MessageManager {
	private readonly task: string;
	private readonly llm: ChatOpenAI;
	private readonly system_prompt: SystemPrompt;
	private readonly history: MessageHistory;
	private readonly max_input_tokens: number;
	private readonly ESTIMATED_TOKENS_PER_CHARACTER = 3;
	private readonly IMG_TOKENS = 800;
	private readonly include_attributes: string[];
	private readonly max_error_length: number;
	private readonly max_actions_per_step: number;

	constructor(
		task: string,
		llm: ChatOpenAI,
		action_descriptions: string,
		system_prompt_class: typeof SystemPrompt,
		max_input_tokens = 128000,
		include_attributes: string[] = [],
		max_error_length = 400,
		max_actions_per_step = 10
	) {
		this.task = task;
		this.llm = llm;
		this.max_input_tokens = max_input_tokens;
		this.include_attributes = include_attributes;
		this.max_error_length = max_error_length;
		this.max_actions_per_step = max_actions_per_step;
		this.history = new MessageHistory();

		// Initialize system prompt
		this.system_prompt = new system_prompt_class(
			action_descriptions,
			new Date(),
			max_actions_per_step
		);

		// Add initial messages
		const system_message = this.system_prompt.get_system_message();
		this._add_message_with_tokens(system_message);

		const task_message = new HumanMessage({ content: `Your task is: ${task}` });
		this._add_message_with_tokens(task_message);
	}

	private _add_message_with_tokens(message: BaseMessage): void {
		let tokens = 0;
		if (typeof message.content === 'string') {
			tokens = message.content.length * this.ESTIMATED_TOKENS_PER_CHARACTER;
		} else if (Array.isArray(message.content)) {
			for (const item of message.content) {
				if ('text' in item) {
					tokens += (item.text as string).length * this.ESTIMATED_TOKENS_PER_CHARACTER;
				}
				if ('image_url' in item) {
					tokens += this.IMG_TOKENS;
				}
			}
		}

		this.history.add_message(message, { input_tokens: tokens });
	}

	public add_state_message(state: BrowserState, last_result: ActionResult[] | null, step_info: AgentStepInfo): void {
		// If keep in memory, add to directly to history and add state without result
		let current_result = last_result;
		if (current_result) {
			for (const r of current_result) {
				if (r.include_in_memory) {
					if (r.extracted_content) {
						const msg = new HumanMessage({ content: String(r.extracted_content) });
						this._add_message_with_tokens(msg);
					}
					if (r.error) {
						const msg = new HumanMessage({ content: r.error.slice(-this.max_error_length) });
						this._add_message_with_tokens(msg);
					}
					current_result = null; // if result in history, we dont want to add it again
				}
			}
		}

		// Create and add new state message
		const message_prompt = new AgentMessagePrompt(
			state,
			current_result,
			this.include_attributes,
			this.max_error_length,
			step_info
		);
		const message = message_prompt.get_user_message();
		this._add_message_with_tokens(message);
	}

	public remove_last_state_message(): void {
		const messages = this.history.get_messages();
		if (messages.length > 2 && messages[messages.length - 1].message instanceof HumanMessage) {
			this.history.remove_message();
		}
	}

	public get_messages(): BaseMessage[] {
		this.cut_messages();
		return this.history.get_messages().map(m => m.message);
	}

	private validate_action(action: Record<string, unknown>, index: number): void {
		// Validate type
		if (typeof action.type !== 'string') {
			logger.error(`Missing or invalid type at index ${index}:`, action);
			throw new Error(`Invalid action format at index ${index}: missing or invalid type`);
		}

		// Validate action name
		if (typeof action.action !== 'string') {
			logger.error(`Missing or invalid action at index ${index}:`, action);
			throw new Error(`Invalid action format at index ${index}: missing or invalid action`);
		}

		// Validate args
		if (typeof action.args !== 'object' || !action.args) {
			logger.error(`Missing or invalid args at index ${index}:`, action);
			throw new Error(`Invalid action format at index ${index}: missing or invalid args`);
		}

		// Validate specific actions
		switch (action.action) {
			case 'go_to_url':
				if (typeof (action.args as Record<string, unknown>).url !== 'string') {
					logger.error(`Missing or invalid URL for go_to_url at index ${index}:`, action);
					throw new Error(`Invalid action format at index ${index}: go_to_url requires a URL string`);
				}
				break;
			case 'click_element':
				if (typeof (action.args as Record<string, unknown>).index !== 'number') {
					logger.error(`Missing or invalid index for click_element at index ${index}:`, action);
					throw new Error(`Invalid action format at index ${index}: click_element requires an index number`);
				}
				break;
			case 'input_text':
				if (typeof (action.args as Record<string, unknown>).index !== 'number' ||
					typeof (action.args as Record<string, unknown>).text !== 'string') {
					logger.error(`Missing or invalid args for input_text at index ${index}:`, action);
					throw new Error(`Invalid action format at index ${index}: input_text requires index and text`);
				}
				break;
		}
	}

	public async get_next_action(_state: BrowserState): Promise<AgentOutput> {
		try {
			// Get the model's response
			const response = await this.llm.call(this.get_messages());
			const content = response.content as string;

			// Try to extract JSON from the response
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				logger.error('Model response:', content);
				throw new Error('No valid JSON found in response');
			}

			let output: unknown;
			try {
				output = JSON.parse(jsonMatch[0]);
			} catch (error) {
				logger.error('Failed to parse JSON from:', jsonMatch[0]);
				throw new Error(`Failed to parse JSON: ${error}`);
			}

			// Validate output structure
			if (!output || typeof output !== 'object') {
				logger.error('Invalid output:', output);
				throw new Error('Invalid output format: expected object');
			}

			const typedOutput = output as Record<string, unknown>;

			// Validate current_state
			if (!typedOutput.current_state || typeof typedOutput.current_state !== 'object') {
				logger.error('Invalid current_state:', typedOutput.current_state);
				throw new Error('Invalid output format: missing or invalid current_state');
			}

			const currentState = typedOutput.current_state as Record<string, unknown>;
			if (typeof currentState.evaluation_previous_goal !== 'string' ||
				typeof currentState.memory !== 'string' ||
				typeof currentState.next_goal !== 'string') {
				logger.error('Invalid current_state fields:', currentState);
				throw new Error('Invalid current_state format: missing required fields');
			}

			// Validate actions
			if (!Array.isArray(typedOutput.actions)) {
				logger.error('Invalid actions:', typedOutput.actions);
				throw new Error('Invalid output format: actions must be an array');
			}

			if (typedOutput.actions.length === 0) {
				logger.error('Empty actions array');
				throw new Error('Invalid output format: actions array must not be empty');
			}

			// Validate each action
			typedOutput.actions.forEach((action, index) => {
				if (!action || typeof action !== 'object') {
					logger.error(`Invalid action at index ${index}:`, action);
					throw new Error(`Invalid action format at index ${index}: expected object`);
				}
				this.validate_action(action as Record<string, unknown>, index);
			});

			const actions = typedOutput.actions.map(action => ({
				type: action.type as string,
				action: action.action as string,
				args: action.args as Record<string, unknown>
			}));

			// Log successful parsing
			logger.debug('Successfully parsed model output:', {
				current_state: {
					evaluation_previous_goal: currentState.evaluation_previous_goal,
					memory: currentState.memory,
					next_goal: currentState.next_goal
				},
				actions: actions.map(a => ({ type: a.type, action: a.action }))
			});

			return {
				current_state: {
					evaluation_previous_goal: currentState.evaluation_previous_goal as string,
					memory: currentState.memory as string,
					next_goal: currentState.next_goal as string
				},
				actions
			};
		} catch (error) {
			// Add context to the error
			const enhancedError = new Error(`Failed to get next action: ${error instanceof Error ? error.message : String(error)}`);
			(enhancedError as any).originalError = error;
			throw enhancedError;
		}
	}

	public add_model_output(output: AgentOutput): void {
		const message = new SystemMessage({
			content: JSON.stringify(output, null, 2)
		});
		this._add_message_with_tokens(message);
	}

	private cut_messages(): void {
		const diff = this.history.get_total_tokens() - this.max_input_tokens;
		if (diff <= 0) return;

		const messages = this.history.get_messages();
		const last_msg = messages[messages.length - 1];

		// If list with image remove image
		if (Array.isArray(last_msg.message.content)) {
			let text = '';
			for (const item of last_msg.message.content) {
				if ('image_url' in item) {
					last_msg.message.content.splice(last_msg.message.content.indexOf(item), 1);
					last_msg.metadata.input_tokens -= this.IMG_TOKENS;
					console.debug(`Removed image with ${this.IMG_TOKENS} tokens`);
				} else if ('text' in item) {
					text += item.text;
				}
			}
			last_msg.message.content = text;
		}

		if (this.history.get_total_tokens() - this.max_input_tokens <= 0) return;

		// If still over, remove text from state message proportionally
		const proportion_to_remove = diff / last_msg.metadata.input_tokens;
		if (proportion_to_remove > 0.99) {
			throw new Error(
				'Max token limit reached - history is too long - reduce the system prompt or task less tasks or remove old messages.'
			);
		}

		console.debug(
			`Removing ${proportion_to_remove * 100}% of the last message (${proportion_to_remove * last_msg.metadata.input_tokens
			} / ${last_msg.metadata.input_tokens} tokens)`
		);

		const content = last_msg.message.content as string;
		const characters_to_remove = Math.floor(content.length * proportion_to_remove);
		const new_content = content.slice(0, -characters_to_remove);

		// Remove old message and add new truncated one
		this.history.remove_message();
		const new_message = new HumanMessage({ content: new_content });
		this._add_message_with_tokens(new_message);
	}
}