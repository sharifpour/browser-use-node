"use strict";
/**
 * Agent types and interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentError = void 0;
/**
 * Agent error
 */
class AgentError extends Error {
    constructor(message) {
        super(message);
        this.name = "AgentError";
    }
}
exports.AgentError = AgentError;
