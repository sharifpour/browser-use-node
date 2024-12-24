"use strict";
/**
 * Message manager for handling agent messages
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageManager = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
/**
 * Message manager for handling agent messages
 */
class MessageManager {
    constructor() {
        this.messages = [];
    }
    /**
     * Add a message to the history
     */
    async addMessage(message) {
        this.messages.push(message);
    }
    /**
     * Get all messages
     */
    getMessages() {
        return [...this.messages];
    }
    /**
     * Clear all messages
     */
    clear() {
        this.messages = [];
    }
    /**
     * Save messages to a file
     */
    async saveToFile(path) {
        const messages = JSON.stringify(this.messages);
        await node_fs_1.default.promises.writeFile(path, messages, "utf-8");
    }
    /**
     * Load messages from a file
     */
    async loadFromFile(path) {
        const data = await node_fs_1.default.promises.readFile(path, "utf-8");
        this.messages = JSON.parse(data);
    }
}
exports.MessageManager = MessageManager;
