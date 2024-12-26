/**
 * System prompt implementation
 */

import type { BrowserState } from "../browser/types";
import type { ActionResult } from "../controller/types";
import type { AgentStepInfo } from "./types";
import { SystemMessage, HumanMessage } from "langchain/schema";

export class SystemPrompt {
	private readonly actionDescription: string;
	private readonly currentDate: Date;
	private readonly maxActionsPerStep: number;

	constructor(config: {
		actionDescription: string;
		currentDate: Date;
		maxActionsPerStep: number;
	}) {
		this.actionDescription = config.actionDescription;
		this.currentDate = config.currentDate;
		this.maxActionsPerStep = config.maxActionsPerStep;
	}

	getSystemMessage(): SystemMessage {
		const prompt = `You are a powerful AI agent that can control a web browser to help users accomplish their tasks.
Current date: ${this.currentDate.toISOString()}

You can use these actions:
${this.actionDescription}

You can use up to ${this.maxActionsPerStep} actions per step.

You will receive the current browser state and should respond with:
1. Evaluation of the previous goal (if any)
2. Your memory of what has been done
3. Your next goal
4. The next action(s) to take

Respond in this exact format:
{
    "current_state": {
        "evaluation_previous_goal": "string",
        "memory": "string",
        "next_goal": "string"
    },
    "action": [
        {
            "action_name": {
                "param1": "value1",
                "param2": "value2"
            }
        }
    ]
}`;

		return new SystemMessage(prompt);
	}
}

export class AgentMessagePrompt {
	private readonly state: BrowserState;
	private readonly result: ActionResult[] | null;
	private readonly includeAttributes: string[];
	private readonly maxErrorLength: number;
	private readonly stepInfo: AgentStepInfo | null;

	constructor(
		state: BrowserState,
		result: ActionResult[] | null,
		includeAttributes: string[],
		maxErrorLength: number,
		stepInfo: AgentStepInfo | null
	) {
		this.state = state;
		this.result = result;
		this.includeAttributes = includeAttributes;
		this.maxErrorLength = maxErrorLength;
		this.stepInfo = stepInfo;
	}

	getUserMessage(): HumanMessage {
		let content = '';

		// Add step info if available
		if (this.stepInfo) {
			content += `Current step: ${this.stepInfo.step_number}/${this.stepInfo.max_steps}\n\n`;
		}

		// Add current URL and title
		content += `Current url: ${this.state.url}\n`;
		if (this.state.title) {
			content += `Page title: ${this.state.title}\n`;
		}

		// Add tabs info
		if (this.state.tabs && this.state.tabs.length > 0) {
			content += '\nOpen tabs:\n';
			for (const tab of this.state.tabs) {
				content += `- ${tab.title} (${tab.url})\n`;
			}
		}

		// Add clickable elements
		if (this.state.clickableElements && this.state.clickableElements.length > 0) {
			content += '\nClickable elements:\n';
			for (const element of this.state.clickableElements) {
				const attrs = this.includeAttributes
					.map(attr => element.attributes?.[attr] ? `${attr}="${element.attributes[attr]}"` : '')
					.filter(Boolean)
					.join(' ');
				content += `${element.highlightIndex}[:]<${element.tagName}${attrs ? ` ${attrs}` : ''}>\n`;
			}
		}

		// Add results if available
		if (this.result) {
			content += '\nResults from previous actions:\n';
			for (let i = 0; i < this.result.length; i++) {
				const r = this.result[i];
				if (r.extracted_content) {
					content += `Result ${i + 1}/${this.result.length}: ${r.extracted_content}\n`;
				}
				if (r.error) {
					const error = r.error.slice(-this.maxErrorLength);
					content += `Error ${i + 1}/${this.result.length}: ...${error}\n`;
				}
			}
		}

		// Handle vision model format
		if (this.state.screenshot) {
			return new HumanMessage({
				content: [
					{ type: 'text', text: content },
					{
						type: 'image_url',
						image_url: { url: `data:image/png;base64,${this.state.screenshot}` }
					}
				]
			});
		}

		return new HumanMessage(content);
	}
}

