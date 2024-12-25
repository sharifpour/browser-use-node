/**
 * Browser action controller
 */
import type { BrowserContext } from "../browser/context";
import type { ActionResult } from "./registry";
import type { ClickElementAction, DoneAction, ExtractPageContentAction, GoToUrlAction, InputTextAction, OpenTabAction, ScrollAction, SearchGoogleAction, SwitchTabAction, GoBackAction } from "./types";
/**
 * Controller for browser actions
 */
export declare class Controller {
    private registry;
    constructor();
    /**
     * Register all default browser actions
     */
    private registerDefaultActions;
    /**
     * Execute an action
     */
    executeAction(actionName: string, params: SearchGoogleAction | GoToUrlAction | GoBackAction | ClickElementAction | InputTextAction | SwitchTabAction | OpenTabAction | ExtractPageContentAction | ScrollAction | DoneAction, browser?: BrowserContext): Promise<ActionResult>;
}
