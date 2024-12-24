/**
 * Browser action controller
 */
import type { BrowserContext } from "../browser/context";
import type { ActionResult } from "./registry";
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
    executeAction(actionName: string, params: any, browser?: BrowserContext): Promise<ActionResult>;
}
