/**
 * Message manager for handling agent messages
 */

import type { BaseMessage } from "langchain/schema";
import fs from "node:fs";

/**
 * Message manager for handling agent messages
 */
export class MessageManager {
	private messages: BaseMessage[] = [];

	/**
	 * Add a message to the history
	 */
	async addMessage(message: BaseMessage): Promise<void> {
		this.messages.push(message);
	}

	/**
	 * Get all messages
	 */
	getMessages(): BaseMessage[] {
		return [...this.messages];
	}

	/**
	 * Clear all messages
	 */
	clear(): void {
		this.messages = [];
	}

	/**
	 * Save messages to a file
	 */
	async saveToFile(path: string): Promise<void> {
		const messages = JSON.stringify(this.messages);
		await fs.promises.writeFile(path, messages, "utf-8");
	}

	/**
	 * Load messages from a file
	 */
	async loadFromFile(path: string): Promise<void> {
		const data = await fs.promises.readFile(path, "utf-8");
		this.messages = JSON.parse(data);
	}
}
