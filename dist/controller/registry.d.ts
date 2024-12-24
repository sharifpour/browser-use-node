/**
 * Action registry for browser actions
 */
import type { BrowserContext } from "../browser/context";
export interface ActionResult {
    /**
     * Whether the action was successful
     */
    success?: boolean;
    /**
     * Message describing the result
     */
    message?: string;
    /**
     * Content extracted from the action
     */
    extractedContent?: string;
    /**
     * Whether to include the result in memory
     */
    includeInMemory?: boolean;
    /**
     * Additional data from the action
     */
    data?: any;
    /**
     * Whether the action is done
     */
    isDone?: boolean;
    /**
     * Error message if the action failed
     */
    error?: string;
}
export type ActionHandler = {
    (params: any, browser: BrowserContext | undefined): Promise<ActionResult>;
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
export declare function action(description: string, requiresBrowser?: boolean): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
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
    registerFromClass(target: any): void;
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
