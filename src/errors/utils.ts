import { ActionError, BaseError } from './index';

export function createError(
  message: string,
  type: ActionError['type'] = 'execution',
  recoverable = false,
  context: ErrorContext = {}
): ActionError {
  const error = new ActionError(message, type, recoverable);
  Object.assign(error, context);
  return error;
}

export function formatError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export function isRecoverableError(error: Error): boolean {
  return error instanceof ActionError && error.recoverable;
}