export { Controller } from "./controller";
export { Registry } from "./registry";

// Re-export types
export type {
	ActionResult,
	ActionHandler,
	ActionRegistration,
} from "./registry";

export type {
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
} from "./types";
