/**
 * Main library exports
 */

export * from './browser/context';
export * from './browser/types';
export * from './controller/controller';
export * from './controller/types';
export * from './dom/types';
export * from './config/types';
export * from './agent/types';

export type {
	DOMElementNode,
	DOMTextNode,
	DOMBaseNode,
	DOMHistoryElement,
	DOMState,
	DOMQueryOptions,
	ElementSelector,
	DOMObservation
} from './dom/types';

export type {
	BrowserState,
	BrowserSession,
	BrowserConfig,
	TabInfo
} from './browser/types';

export type {
	ActionFunction,
	ActionOptions,
	ActionRegistration,
	ActionResult
} from './controller/types';

export type {
	ConfigOptions,
	LoggingConfig,
	LogLevel,
	BrowserConfigSchema
} from './config/types';

export type {
	AgentConfig,
	AgentState,
	AgentStatus,
	AgentMessage,
	AgentHistory,
	AgentStepInfo,
	AgentOutput
} from './agent/types';
