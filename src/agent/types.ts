/**
 * Agent types and interfaces
 */

import type { BaseMessage } from 'langchain/schema';
import type { ChatOpenAI } from 'langchain/chat_models/openai';
import type { BrowserContext } from '../browser/context';

export interface AgentConfig {
	task: string;
	llm: ChatOpenAI;
	browser?: BrowserContext;
	useVision?: boolean;
	validateOutput?: boolean;
	maxSteps?: number;
}

export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentState {
	memory?: string;
	error?: string;
	status: AgentStatus;
}

export interface AgentMessage {
	role: string;
	content: string;
}

export interface AgentHistory {
	messages: BaseMessage[];
	state: AgentState;
}

export interface AgentStepInfo {
	step: number;
	action?: string;
	result?: string;
	error?: string;
}

export interface AgentOutput {
	success: boolean;
	error?: string;
	steps: AgentStepInfo[];
	final_state?: AgentState;
}
