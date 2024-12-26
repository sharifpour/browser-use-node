/**
 * Base error class for all application errors
 */
export class BaseError extends Error {
	constructor(
		message: string,
		public readonly code: string = 'UNKNOWN_ERROR',
		public readonly includeTrace: boolean = false
	) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}

	public toJSON(): Record<string, unknown> {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			stack: this.includeTrace ? this.stack : undefined
		};
	}
}

/**
 * Browser related errors
 */
export class BrowserError extends BaseError {
	constructor(message: string, code = 'BROWSER_ERROR') {
		super(message, code);
	}
}

/**
 * Network related errors
 */
export class NetworkError extends BaseError {
	constructor(message: string, code = 'NETWORK_ERROR') {
		super(message, code);
	}
}

/**
 * Action related errors
 */
export class ActionError extends BaseError {
	constructor(
		message: string,
		public readonly type: 'validation' | 'execution' | 'browser' | 'network' = 'execution',
		includeTrace = false
	) {
		super(message, `ACTION_${type.toUpperCase()}_ERROR`, includeTrace);
	}
}

/**
 * Validation related errors
 */
export class ValidationError extends BaseError {
	constructor(message: string, code = 'VALIDATION_ERROR') {
		super(message, code);
	}
}

/**
 * Configuration related errors
 */
export class ConfigurationError extends BaseError {
	constructor(message: string, code = 'CONFIG_ERROR') {
		super(message, code);
	}
}

/**
 * Resource related errors
 */
export class ResourceError extends BaseError {
	constructor(message: string, code = 'RESOURCE_ERROR') {
		super(message, code);
	}
}

/**
 * State related errors
 */
export class StateError extends BaseError {
	constructor(message: string, code = 'STATE_ERROR') {
		super(message, code);
	}
}

/**
 * Security related errors
 */
export class SecurityError extends BaseError {
	constructor(message: string, code = 'SECURITY_ERROR') {
		super(message, code);
	}
}

/**
 * Permission related errors
 */
export class PermissionError extends SecurityError {
	constructor(message: string) {
		super(message, 'PERMISSION_ERROR');
	}
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends SecurityError {
	constructor(message: string) {
		super(message, 'AUTH_ERROR');
	}
}

/**
 * Authorization related errors
 */
export class AuthorizationError extends SecurityError {
	constructor(message: string) {
		super(message, 'AUTHZ_ERROR');
	}
}

/**
 * Rate limit related errors
 */
export class RateLimitError extends BaseError {
	constructor(message: string) {
		super(message, 'RATE_LIMIT_ERROR');
	}
}

/**
 * Timeout related errors
 */
export class TimeoutError extends BaseError {
	constructor(message: string) {
		super(message, 'TIMEOUT_ERROR');
	}
}

/**
 * Not found related errors
 */
export class NotFoundError extends BaseError {
	constructor(message: string) {
		super(message, 'NOT_FOUND_ERROR');
	}
}

/**
 * Already exists related errors
 */
export class AlreadyExistsError extends BaseError {
	constructor(message: string) {
		super(message, 'ALREADY_EXISTS_ERROR');
	}
}

/**
 * Invalid state related errors
 */
export class InvalidStateError extends BaseError {
	constructor(message: string) {
		super(message, 'INVALID_STATE_ERROR');
	}
}

/**
 * Not implemented related errors
 */
export class NotImplementedError extends BaseError {
	constructor(message: string) {
		super(message, 'NOT_IMPLEMENTED_ERROR');
	}
}

/**
 * Format error message with context
 */
export function formatError(error: Error, includeTrace = false): string {
	if (error instanceof BaseError) {
		const json = error.toJSON();
		return includeTrace && json.stack
			? `${json.name}: ${json.message}\n${json.stack}`
			: `${json.name}: ${json.message}`;
	}
	return includeTrace && error.stack
		? `${error.name}: ${error.message}\n${error.stack}`
		: `${error.name}: ${error.message}`;
}

/**
 * Error context for additional error information
 */
export interface ErrorContext {
	code?: string;
	details?: Record<string, unknown>;
	cause?: Error;
	timestamp?: Date;
	requestId?: string;
	userId?: string;
	source?: string;
}

/**
 * Create error with context
 */
export function createError(
	message: string,
	ErrorClass: typeof BaseError = BaseError,
	context: ErrorContext = {}
): BaseError {
	const error = new ErrorClass(message, context.code);
	Object.assign(error, context);
	return error;
}