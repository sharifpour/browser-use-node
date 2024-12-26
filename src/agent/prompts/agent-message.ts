import type { BrowserState } from '../../browser/types';
import type { ActionResult, AgentStepInfo } from '../types';
import { HumanMessage } from 'langchain/schema';

export class AgentMessagePrompt {
	private readonly state: BrowserState;
	private readonly result: ActionResult[] | null;
	private readonly includeAttributes: string[];
	private readonly maxErrorLength: number;
	private readonly stepInfo: AgentStepInfo | null;

	constructor(
		state: BrowserState,
		result: ActionResult[] | null = null,
		includeAttributes: string[] = [],
		maxErrorLength = 400,
		stepInfo: AgentStepInfo | null = null
	) {
		this.state = state;
		this.result = result;
		this.includeAttributes = includeAttributes;
		this.maxErrorLength = maxErrorLength;
		this.stepInfo = stepInfo;
	}

	public getUserMessage(): HumanMessage {
		const content = this.formatContent();
		return new HumanMessage({ content });
	}

	private formatContent(): string {
		const content = {
			state: this.formatState(),
			result: this.result ? this.formatResult() : null,
			step_info: this.stepInfo
		};

		return JSON.stringify(content);
	}

	private formatState(): unknown {
		const state = { ...this.state };

		// Filter attributes if specified
		if (this.includeAttributes.length > 0) {
			const filteredState: Record<string, unknown> = {};
			for (const key of this.includeAttributes) {
				if (key in state) {
					filteredState[key] = state[key as keyof BrowserState];
				}
			}
			return filteredState;
		}

		return state;
	}

	private formatResult(): unknown {
		if (!this.result) return null;

		return this.result.map(r => ({
			success: r.success,
			extracted_content: r.extracted_content,
			error: r.error ? String(r.error).slice(-this.maxErrorLength) : undefined,
			include_in_memory: r.include_in_memory,
			is_done: r.is_done
		}));
	}
}