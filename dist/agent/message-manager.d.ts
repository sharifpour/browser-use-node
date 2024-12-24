/**
 * Message manager for handling agent messages
 */
import type { BaseMessage } from "langchain/schema";
/**
 * Message manager for handling agent messages
 */
export declare class MessageManager {
    private messages;
    /**
     * Add a message to the history
     */
    addMessage(message: BaseMessage): Promise<void>;
    /**
     * Get all messages
     */
    getMessages(): BaseMessage[];
    /**
     * Clear all messages
     */
    clear(): void;
    /**
     * Save messages to a file
     */
    saveToFile(path: string): Promise<void>;
    /**
     * Load messages from a file
     */
    loadFromFile(path: string): Promise<void>;
}
