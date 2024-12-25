"use strict";
/**
 * Agent types and interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStatus = exports.AgentError = void 0;
/**
 * Agent error types - enhanced error handling
 */
class AgentError extends Error {
    constructor(message, type = "execution") {
        super(message);
        this.type = type;
        this.name = "AgentError";
    }
}
exports.AgentError = AgentError;
/**
 * Agent status enum
 */
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["RUNNING"] = "running";
    AgentStatus["COMPLETED"] = "completed";
    AgentStatus["FAILED"] = "failed";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
