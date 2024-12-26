/**
 * Browser automation agent powered by LLMs.
 */

import type { ChatOpenAI } from 'langchain/chat_models/openai';
import type { BrowserState } from '../browser/types';
import type { ActionResult } from '../controller/types';
import type { AgentAction, AgentOutput, AgentStepInfo } from './types';
import { MessageManager } from './message-manager/service';
import { SystemPrompt } from './prompts';

export interface AgentConfig {
	llm: ChatOpenAI;
	task: string;
	actionDescriptions: string;
	maxSteps?: number;
	maxActionsPerStep?: number;
	maxInputTokens?: number;
	includeAttributes?: string[];
	maxErrorLength?: number;
}

export class Agent {
	private readonly messageManager: MessageManager;
	private readonly maxSteps: number;
	private stepNumber: number;
	private readonly llm: ChatOpenAI;

	constructor(config: AgentConfig) {
		this.llm = config.llm;
		this.messageManager = new MessageManager({
			llm: config.llm,
			task: config.task,
			actionDescriptions: config.actionDescriptions,
			systemPromptClass: SystemPrompt,
			maxInputTokens: config.maxInputTokens,
			includeAttributes: config.includeAttributes,
			maxErrorLength: config.maxErrorLength,
			maxActionsPerStep: config.maxActionsPerStep
		});
		this.maxSteps = config.maxSteps ?? 10;
		this.stepNumber = 0;
	}

	public async getNextAction(
		state: BrowserState,
		result: ActionResult[] | null = null
	): Promise<AgentAction[]> {
		this.stepNumber++;
		if (this.stepNumber > this.maxSteps) {
			throw new Error(`Max steps (${this.maxSteps}) reached`);
		}

		const stepInfo: AgentStepInfo = {
			step_number: this.stepNumber,
			step_description: `Step ${this.stepNumber} of ${this.maxSteps}`
		};

		await this.messageManager.addStateMessage(state, result, stepInfo);

		const messages = this.messageManager.getMessages();
		const response = await this.llm.call(messages, {
			functions: [{
				name: 'agent_output',
				description: 'Output the agent\'s thought process and actions',
				parameters: {
					type: 'object',
					properties: {
						current_state: {
							type: 'object',
							properties: {
								evaluation_previous_goal: {
									type: 'string',
									description: 'Evaluate if the previous goal was achieved'
								},
								memory: {
									type: 'string',
									description: 'Information to remember for future steps'
								},
								next_goal: {
									type: 'string',
									description: 'What needs to be done next'
								}
							},
							required: ['evaluation_previous_goal', 'memory', 'next_goal']
						},
						actions: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									name: {
										type: 'string',
										description: 'The name of the action to execute'
									},
									args: {
										type: 'object',
										description: 'The arguments for the action'
									}
								},
								required: ['name', 'args']
							}
						}
					},
					required: ['current_state', 'actions']
				}
			}],
			function_call: { name: 'agent_output' }
		});

		try {
			const functionCall = response.additional_kwargs.function_call;
			if (!functionCall || !functionCall.arguments) {
				throw new Error('No function call in response');
			}

			const output = JSON.parse(functionCall.arguments) as AgentOutput;
			await this.messageManager.addModelOutput(output);
			return output.actions;
		} catch (error) {
			console.error('Failed to parse LLM response:', error);
			console.debug('Raw response:', response);
			throw new Error('Failed to parse LLM response');
		}
	}

	public removeLastStateMessage(): void {
		this.messageManager.removeLastStateMessage();
	}

	public reduceTokenLimit(reduction: number): void {
		this.messageManager.reduceTokenLimit(reduction);
	}
}
