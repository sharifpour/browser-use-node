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
	AgentRunConfig,
	AgentStatus,
	AgentConfig,
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
} from "./browser/types";

export type {
	DOMElementNode,
	DOMHistoryElement,
	DOMQueryOptions,
	ElementSelector,
	DOMObservation
} from "./dom/types";

export type {
	ActionResult,
	SearchGoogleAction,
	GoToUrlAction,
	ClickElementAction,
	InputTextAction,
	DoneAction,
	SwitchTabAction,
	OpenTabAction,
	ExtractPageContentAction,
	ScrollAction,
	SendKeysAction,
} from "./controller/types";
