import type { BaseMessage } from '@langchain/core/messages';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Message metadata including token counts
 */
export interface MessageMetadata {
  input_tokens: number;
}

/**
 * A message with its metadata
 */
export interface ManagedMessage {
  message: BaseMessage;
  metadata: MessageMetadata;
}

/**
 * Container for message history with metadata
 */
export class MessageHistory {
  private messages: ManagedMessage[] = [];
  private total_tokens = 0;

  public add_message(message: BaseMessage, metadata: MessageMetadata): void {
    this.messages.push({ message, metadata });
    this.total_tokens += metadata.input_tokens;
  }

  public remove_message(index = -1): void {
    if (this.messages.length > 0) {
      const msg = this.messages.splice(index, 1)[0];
      this.total_tokens -= msg.metadata.input_tokens;
    }
  }

  public get_messages(): ManagedMessage[] {
    return this.messages;
  }

  public get_total_tokens(): number {
    return this.total_tokens;
  }

  public save_to_file(file_path: string): void {
    // Create directory if it doesn't exist
    const dir = path.dirname(file_path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convert messages to serializable format
    const serializable = this.messages.map(m => ({
      role: m.message._getType(),
      content: m.message.content,
      metadata: m.metadata
    }));

    // Write to file
    fs.writeFileSync(file_path, JSON.stringify(serializable, null, 2));
  }

  public static load_from_file(file_path: string): MessageHistory {
    const history = new MessageHistory();
    if (!fs.existsSync(file_path)) return history;

    const data = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    for (const item of data) {
      const message = {
        _getType: () => item.role,
        content: item.content
      } as BaseMessage;
      history.add_message(message, item.metadata);
    }

    return history;
  }
}