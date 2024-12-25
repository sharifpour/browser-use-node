"use strict";
/**
 * Action registry for browser actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registry = void 0;
exports.action = action;
/**
 * Decorator for registering actions
 */
function action(description, requiresBrowser = false) {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        if (!target.constructor._actions) {
            target.constructor._actions = new Map();
        }
        target.constructor._actions.set(propertyKey, {
            name: propertyKey,
            description,
            handler: originalMethod,
            requiresBrowser,
        });
        return descriptor;
    };
}
/**
 * Registry for browser actions
 */
class Registry {
    constructor() {
        this.actions = new Map();
    }
    /**
     * Register an action
     */
    registerAction(registration) {
        this.actions.set(registration.name, registration);
    }
    /**
     * Register multiple actions
     */
    registerActions(registrations) {
        for (const registration of registrations) {
            this.registerAction(registration);
        }
    }
    /**
     * Register actions from a class
     */
    registerFromClass(target) {
        const actions = target.constructor._actions;
        if (actions) {
            for (const [, registration] of actions) {
                this.registerAction(registration);
            }
        }
    }
    /**
     * Get an action by name
     */
    getAction(name) {
        return this.actions.get(name);
    }
    /**
     * Get all registered actions
     */
    getAllActions() {
        return Array.from(this.actions.values());
    }
    /**
     * Check if an action exists
     */
    hasAction(name) {
        return this.actions.has(name);
    }
    /**
     * Remove an action
     */
    removeAction(name) {
        this.actions.delete(name);
    }
    /**
     * Clear all actions
     */
    clear() {
        this.actions.clear();
    }
}
exports.Registry = Registry;
