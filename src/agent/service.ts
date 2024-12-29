/**
 * Browser automation agent powered by LLMs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { Browser, type BrowserContext } from '../browser';
import type { BrowserState } from '../browser/types';
import { Controller } from '../controller';
import type { ActionResult } from '../controller/types';
import { ProductTelemetry } from '../telemetry/service';
import { logger } from '../utils/logger';
import { MessageManager } from './message-manager/service';
import { SystemPrompt } from './prompts/system';
import type { AgentConfig, AgentHistory, AgentHistoryList, AgentOutput, AgentStepInfo } from './types';
import { ChatOpenAI } from '@langchain/openai';
export class Agent {
	private readonly agent_id: string;
	private readonly task: string;
	private readonly browser: Browser;
	private readonly controller: Controller;
	private readonly telemetry: ProductTelemetry;
	private readonly messageManager: MessageManager;
	private readonly max_failures: number;
	private readonly retry_delay: number;
	private readonly use_vision: boolean;
	private readonly save_conversation_path?: string;
	private readonly validate_output: boolean;
	private readonly max_actions_per_step: number;
	private browserContext: BrowserContext | null = null;
	private consecutive_failures = 0;
	private n_steps = 1;
	private history: AgentHistory[] = [];
	private _last_result: ActionResult[] | null = null;

	constructor(config: AgentConfig) {
		this.agent_id = uuidv4();
		this.task = config.task;
		this.browser = new Browser({
			headless: config.headless ?? false,
			disable_security: true,
			...config.browser_options
		});
		this.controller = new Controller();
		this.telemetry = ProductTelemetry.getInstance();
		this.messageManager = new MessageManager(
			config.task,
			config.llm ?? new ChatOpenAI({
				modelName: 'gpt-4o',
				openAIApiKey: process.env.OPENAI_API_KEY
			}),
			config.action_descriptions ?? '',
			SystemPrompt,
			config.max_input_tokens,
			config.include_attributes,
			config.max_error_length,
			config.max_actions_per_step
		);
		this.max_failures = config.max_failures ?? 5;
		this.retry_delay = config.retry_delay ?? 10;
		this.use_vision = config.use_vision ?? true;
		this.save_conversation_path = config.save_conversation_path;
		this.validate_output = config.validate_output ?? false;
		this.max_actions_per_step = config.max_actions_per_step ?? 10;

		// Load conversation if path provided
		if (config.load_conversation_path) {
			this._load_conversation(config.load_conversation_path);
		}

		// Load history if path provided
		if (config.load_history_path) {
			this._load_history(config.load_history_path);
		}

		// Set up conversation saving
		if (this.save_conversation_path) {
			logger.info(`Saving conversation to ${this.save_conversation_path}`);
		}
	}

	private _too_many_failures(): boolean {
		if (this.consecutive_failures >= this.max_failures) {
			logger.error(`❌ Stopping due to ${this.max_failures} consecutive failures`);
			return true;
		}
		return false;
	}

	private async _validate_output(state: BrowserState): Promise<boolean> {
		if (!this.browserContext) return false;

		try {
			// Get current state and validate against task requirements
			const currentState = await this.browserContext.get_state(this.use_vision);
			if (!currentState) return false;

			// Add validation message to check if task is complete
			this.messageManager.add_state_message(
				currentState,
				this._last_result,
				{ step_number: this.n_steps, max_steps: -1 }
			);

			// Get model's assessment
			const validation = await this.messageManager.get_next_action(state);

			// Remove the validation message to keep history clean
			this.messageManager.remove_last_state_message();

			// Check if model indicates task is complete
			return validation.current_state.evaluation_previous_goal === 'complete';
		} catch (error) {
			logger.error(`Validation error: ${error}`);
			return false;
		}
	}

	private _make_history_item(model_output: AgentOutput | undefined, state: BrowserState, result: ActionResult[]): void {
		this.history.push({
			step_number: this.n_steps,
			state,
			model_output,
			result
		});
	}

	private _save_conversation(state: BrowserState, model_output?: AgentOutput): void {
		if (!this.save_conversation_path) return;

		try {
			const conversation = {
				agent_id: this.agent_id,
				task: this.task,
				step: this.n_steps,
				state,
				model_output,
				last_result: this._last_result,
				history: this.history
			};

			const dir = path.dirname(this.save_conversation_path);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			fs.writeFileSync(
				this.save_conversation_path,
				JSON.stringify(conversation, null, 2)
			);
		} catch (error) {
			logger.error(`Error saving conversation: ${error}`);
		}
	}

	private _load_conversation(file_path: string): void {
		try {
			if (!fs.existsSync(file_path)) {
				logger.info(`No conversation file found at ${file_path}`);
				return;
			}

			const data = JSON.parse(fs.readFileSync(file_path, 'utf-8'));

			// Restore conversation state
			this.n_steps = data.step;
			this.history = data.history;
			this._last_result = data.last_result;

			logger.info(`Loaded conversation from ${file_path}`);
			logger.info(`Restored to step ${this.n_steps}`);
		} catch (error) {
			logger.error(`Error loading conversation: ${error}`);
		}
	}

	private _load_history(file_path: string): void {
		try {
			if (!fs.existsSync(file_path)) {
				logger.info(`No history file found at ${file_path}`);
				return;
			}

			const data = JSON.parse(fs.readFileSync(file_path, 'utf-8'));

			// Validate history data
			if (!data.agent_id || !data.task || !data.history) {
				throw new Error('Invalid history file format');
			}

			// Restore history state
			this.history = data.history;
			this.n_steps = data.total_steps;

			logger.info(`Loaded history from ${file_path}`);
			logger.info(`Restored ${this.history.length} steps`);
		} catch (error) {
			logger.error(`Error loading history: ${error}`);
		}
	}

	public load_history(file_path: string): void {
		this._load_history(file_path);
	}

	private async cleanup(error?: Error): Promise<void> {
		try {
			// Save final state if there was an error
			if (error && this.browserContext) {
				const state = await this.browserContext.get_state(this.use_vision);
				if (state) {
					this._save_conversation(state);
				}
			}

			// Close browser context
			if (this.browserContext) {
				await this.browserContext.close();
				this.browserContext = null;
			}

			// Close browser
			await this.browser.close();

			// Log cleanup status
			if (error) {
				logger.error('Cleaned up after error:', error);
			} else {
				logger.info('Cleaned up successfully');
			}
		} catch (cleanupError) {
			logger.error(`Error during cleanup: ${cleanupError}`);
		}
	}

	public async run(max_steps = 100): Promise<AgentHistoryList> {
		let error: Error | undefined;

		try {
			logger.info(`🚀 Starting task: ${this.task}`);

			this.telemetry.capture({
				name: 'agent_run',
				properties: {
					agent_id: this.agent_id,
					task: this.task
				}
			});

			// Set up signal handlers for graceful shutdown
			const handleSignal = async (signal: string) => {
				logger.info(`\nReceived ${signal}. Gracefully shutting down...`);
				await this.cleanup();
				process.exit(0);
			};

			process.on('SIGINT', () => void handleSignal('SIGINT'));
			process.on('SIGTERM', () => void handleSignal('SIGTERM'));

			// Initialize browser context
			this.browserContext = await this.browser.new_context();

			for (let step = 0; step < max_steps; step++) {
				if (this._too_many_failures()) {
					break;
				}

				await this.step({
					step_number: this.n_steps,
					max_steps
				});

				const historyList = {
					history: this.history,
					is_done: () => this.history.length > 0 && this.history[this.history.length - 1].result.some(r => r.is_done),
					final_result: () => {
						const lastResult = this.history[this.history.length - 1]?.result;
						return lastResult?.find(r => r.is_done)?.extracted_content ?? null;
					},
					save_to_file: (path: string) => this._save_history_to_file(path)
				};

				if (historyList.is_done()) {
					if (this.validate_output && step < max_steps - 1) {
						const state = await this.browserContext?.get_state(this.use_vision);
						if (!state || !await this._validate_output(state)) {
							continue;
						}
					}
					logger.info('✅ Task completed successfully');
					break;
				}
			}

			return {
				history: this.history,
				is_done: () => this.history.length > 0 && this.history[this.history.length - 1].result.some(r => r.is_done),
				final_result: () => {
					const lastResult = this.history[this.history.length - 1]?.result;
					return lastResult?.find(r => r.is_done)?.extracted_content ?? null;
				},
				save_to_file: (path: string) => this._save_history_to_file(path)
			};

		} catch (e) {
			error = e instanceof Error ? e : new Error(String(e));
			throw error;
		} finally {
			this.telemetry.capture({
				name: 'agent_end',
				properties: {
					agent_id: this.agent_id,
					task: this.task,
					success: this.history.length > 0 && this.history[this.history.length - 1].result.some(r => r.is_done),
					steps: this.history.length,
					error: error?.message
				}
			});

			await this.cleanup(error);
		}
	}

	private _save_history_to_file(file_path: string): void {
		try {
			const dir = path.dirname(file_path);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			const history_data = {
				agent_id: this.agent_id,
				task: this.task,
				total_steps: this.n_steps,
				history: this.history,
				final_result: this.history[this.history.length - 1]?.result.find(r => r.is_done)?.extracted_content
			};

			fs.writeFileSync(file_path, JSON.stringify(history_data, null, 2));
			logger.info(`History saved to ${file_path}`);
		} catch (error) {
			logger.error(`Error saving history: ${error}`);
		}
	}

	private async _validate_browser_state(state: BrowserState): Promise<void> {
		// Validate URL
		if (!state.url) {
			throw new Error('Invalid browser state: missing URL');
		}

		// Validate page content
		if (!state.content) {
			throw new Error('Invalid browser state: missing page content');
		}

		// Validate DOM tree
		if (!state.dom_tree) {
			throw new Error('Invalid browser state: missing DOM tree');
		}

		// Validate screenshot if vision is enabled
		if (this.use_vision && !state.screenshot) {
			throw new Error('Invalid browser state: missing screenshot with vision enabled');
		}
	}

	public async step(step_info: AgentStepInfo): Promise<void> {
		logger.info(`\n📍 Step ${this.n_steps}`);
		let state = null;
		let model_output: AgentOutput | undefined;
		let result: ActionResult[] = [];

		try {
			if (!this.browserContext) {
				throw new Error('Browser context not initialized');
			}

			state = await this.browserContext.get_state(this.use_vision);
			if (!state) throw new Error('No browser state available');

			// Validate browser state
			await this._validate_browser_state(state);

			this.messageManager.add_state_message(state, this._last_result, step_info);
			await this.messageManager.get_messages();
			model_output = await this.messageManager.get_next_action(state);

			if (this.save_conversation_path) {
				this._save_conversation(state, model_output);
			}

			this.messageManager.remove_last_state_message();
			this.messageManager.add_model_output(model_output);

			if (!model_output.actions?.[0]) {
				throw new Error('No action returned from model');
			}

			result = await this.controller.execute_action(model_output.actions[0], this.browserContext);
			this._last_result = result;

			if (result.length > 0 && result[result.length - 1].is_done) {
				logger.info(`📄 Result: ${result[result.length - 1].extracted_content}`);
			}

			this.consecutive_failures = 0;

		} catch (error) {
			this.consecutive_failures++;
			logger.error(`❌ Error (${this.consecutive_failures}/${this.max_failures}): ${error}`);

			if (error instanceof Error) {
				this.telemetry.capture({
					name: 'agent_error',
					properties: {
						agent_id: this.agent_id,
						error: error.message
					}
				});
			}

			result = [{
				error: error instanceof Error ? error.message : String(error),
				is_done: false
			}];
			this._last_result = result;

			// Add retry delay on error
			if (this.consecutive_failures < this.max_failures) {
				logger.info(`Waiting ${this.retry_delay} seconds before retrying...`);
				await new Promise(resolve => setTimeout(resolve, this.retry_delay * 1000));
			}
		} finally {
			if (result.length > 0) {
				for (const r of result) {
					if (r.error) {
						this.telemetry.capture({
							name: 'agent_step_error',
							properties: {
								agent_id: this.agent_id,
								error: r.error
							}
						});
					}
				}
				if (state) {
					this._make_history_item(model_output, state, result);
				}
			}
			this.n_steps++;
		}
	}
}
