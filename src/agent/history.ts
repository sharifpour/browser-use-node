/**
 * Agent history implementation
 */

import fs from "node:fs";
import path from "node:path";
import type { DOMHistoryElement } from "../dom/types";
import type { BrowserStateHistory } from "../browser/types";
import type { ActionResult, AgentOutput } from "./types";
import { convertDOMElementToHistoryElement, findHistoryElementInTree } from "../dom/tree-processor";

export class AgentHistory {
	constructor(
		public model_output: AgentOutput | null,
		public result: ActionResult[],
		public state: BrowserStateHistory
	) {}

	toDict(): Record<string, unknown> {
		// Handle action serialization
		let modelOutputDump = null;
		if (this.model_output) {
			modelOutputDump = {
				current_state: this.model_output.current_state,
				action: this.model_output.action
			};
		}

		return {
			model_output: modelOutputDump,
			result: this.result,
			state: this.state.toDict()
		};
	}

	getInteractedElement(
		model_output: AgentOutput,
		selector_map: Record<number, unknown>
	): Array<DOMHistoryElement | null> {
		const elements: Array<DOMHistoryElement | null> = [];

		for (const action of model_output.action) {
			const [actionName, params] = Object.entries(action)[0];
			if (actionName === "click" && typeof params === "object" && params !== null) {
				const index = (params as Record<string, unknown>).index;
				if (typeof index === "number") {
					const element = selector_map[index];
					elements.push(convertDOMElementToHistoryElement(element));
				}
			}
		}

		return elements;
	}
}

export class AgentHistoryList {
	constructor(public history: AgentHistory[] = []) {}

	lastAction(): Record<string, unknown> | null {
		const lastHistory = this.history[this.history.length - 1];
		if (!lastHistory?.model_output?.action?.length) {
			return null;
		}

		const lastAction = lastHistory.model_output.action[lastHistory.model_output.action.length - 1];
		const [actionName, params] = Object.entries(lastAction)[0];
		return { [actionName]: params };
	}

	errors(): string[] {
		return this.history
			.flatMap(h => h.result)
			.filter((r): r is ActionResult & { error: string } => Boolean(r.error))
			.map(r => r.error);
	}

	finalResult(): string | null {
		const lastHistory = this.history[this.history.length - 1];
		if (!lastHistory) {
			return null;
		}

		const lastResult = lastHistory.result[lastHistory.result.length - 1];
		return lastResult?.extracted_content || null;
	}

	isDone(): boolean {
		const lastAction = this.lastAction();
		return lastAction !== null && Object.keys(lastAction)[0] === "done";
	}

	hasErrors(): boolean {
		return this.errors().length > 0;
	}

	urls(): string[] {
		return [...new Set(this.history.map(h => h.state.url))];
	}

	screenshots(): string[] {
		return this.history
			.map(h => h.state.screenshot)
			.filter((s): s is string => typeof s === "string");
	}

	async saveToFile(filepath: string): Promise<void> {
		await mkdir(dirname(filepath), { recursive: true });
		await writeFile(filepath, JSON.stringify(this.toDict(), null, 2));
	}

	async loadFromFile(filepath: string): Promise<void> {
		const content = await fs.promises.readFile(filepath, "utf-8");
		const data = JSON.parse(content);

		this.history = data.history.map((h: Record<string, unknown>) => {
			return new AgentHistory(
				h.model_output as AgentOutput | null,
				h.result as ActionResult[],
				h.state as BrowserStateHistory
			);
		});
	}

	toDict(): Record<string, unknown> {
		return {
			history: this.history.map(h => h.toDict())
		};
	}

	toString(): string {
		return JSON.stringify(this.toDict(), null, 2);
	}
}