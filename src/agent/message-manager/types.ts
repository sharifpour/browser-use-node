import type { BaseMessage } from 'langchain/schema';

export interface MessageMetadata {
	inputTokens: number;
	timestamp: string;
	type: 'system' | 'human' | 'assistant';
}

export interface ManagedMessage {
	message: BaseMessage;
	metadata: MessageMetadata;
}

export class MessageHistoryImpl {
	public messages: ManagedMessage[] = [];
	public totalTokens: number = 0;

	public removeMessage(): void {
		const message = this.messages.pop();
		if (message) {
			this.totalTokens -= message.metadata.inputTokens;
		}
	}
}