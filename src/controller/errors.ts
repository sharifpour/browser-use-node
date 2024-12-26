/**
 * Action error types
 */
export class ActionError extends Error {
	constructor(
		message: string,
		public readonly type: 'validation' | 'execution' | 'browser' | 'network' = 'execution',
		public readonly includeTrace = false
	) {
		super(message);
		this.name = 'ActionError';
	}

	static formatError(error: Error, includeTrace = false): string {
		if (error instanceof ActionError) {
			return error.message;
		}
		return includeTrace ? `${error.message}\nStacktrace:\n${error.stack}` : error.message;
	}
}

/**
 * Action validation result
 */
export interface ActionValidationResult {
	isValid: boolean;
	reason: string;
}

/**
 * Action execution context
 */
export interface ActionContext {
	actionName: string;
	params: Record<string, unknown>;
	startTime: number;
	endTime?: number;
	error?: string;
}

/**
 * Action execution state
 */
export interface ActionState {
	currentAction?: ActionContext;
	lastAction?: ActionContext;
	errors: string[];
	startTime: number;
	endTime?: number;
}

/**
 * Action execution options
 */
export interface ActionOptions {
	timeout?: number;
	retries?: number;
	retryDelay?: number;
	validateResult?: boolean;
}