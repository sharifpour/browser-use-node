/**
 * Action registry for browser actions
 */
import type { BrowserContext } from "../browser/context";
import type { ActionParams, ActionResult } from "./types";
export type ActionHandler = {
    (params: ActionParams, browser: BrowserContext | undefined): Promise<ActionResult>;
    requiresBrowser?: boolean;
};
export interface ActionRegistration {
    name: string;
    description: string;
    handler: ActionHandler;
    requiresBrowser?: boolean;
}
/**
 * Decorator for registering actions
 */
export declare function action(description: string, requiresBrowser?: boolean): (target: {
    constructor: {
        _actions: Map<string, ActionRegistration>;
    };
}, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Registry for browser actions
 */
export declare class Registry {
    private actions;
    /**
     * Register an action
     */
    registerAction(registration: ActionRegistration): void;
    /**
     * Register multiple actions
     */
    registerActions(registrations: ActionRegistration[]): void;
    /**
     * Register actions from a class
     */
    registerFromClass(target: {
        constructor: {
            _actions: Map<string, ActionRegistration>;
        };
    }): void;
    /**
     * Get an action by name
     */
    getAction(name: string): ActionRegistration | undefined;
    /**
     * Get all registered actions
     */
    getAllActions(): ActionRegistration[];
    /**
     * Check if an action exists
     */
    hasAction(name: string): boolean;
    /**
     * Remove an action
     */
    removeAction(name: string): void;
    /**
     * Clear all actions
     */
    clear(): void;
}
export type { ActionResult } from "./types";
