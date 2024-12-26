/**
 * Main library exports
 */

export {
	Agent,
	AgentError,
	SystemPrompt,
	MessageManager,
	AgentHistory as AgentHistoryImpl,
	AgentHistoryList
} from "./agent";

export type {
	AgentConfig,
	AgentStatus,
	AgentOutput,
	AgentState,
	AgentMessage,
	AgentHistory,
	AgentStepInfo,
} from "./agent/types";

export type {
	BrowserConfig,
	BrowserState,
	BrowserSession,
	BrowserStateHistory,
	TabInfo,
	BrowserContextConfig,
	PlaywrightBrowser,
	PlaywrightBrowserContext,
	PlaywrightPage
} from "./browser/types";

export type {
	DOMElementNode,
	DOMHistoryElement,
	DOMQueryOptions,
	ElementSelector,
	DOMObservation,
	DOMBaseNode,
	DOMState
} from "./dom/types";

export type {
	ActionResult,
	ActionFunction,
	ActionValidationResult,
	ActionContext,
	ActionState,
	ActionOptions,
	ActionModel,
	ActionHandler,
	ActionRegistration
} from "./controller/types";

export { Browser } from "./browser";
export { BrowserContext } from "./browser/context";
export { Controller } from "./controller";
export { DOMService } from "./dom/service";
export { ConfigManager } from "./config/manager";
