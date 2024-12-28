/**
 * Agent errors
 */
export class AgentError extends Error {
  public static readonly VALIDATION_ERROR = 'Invalid model output format. Please follow the correct schema.';
  public static readonly RATE_LIMIT_ERROR = 'Rate limit reached. Waiting before retry.';
  public static readonly NO_VALID_ACTION = 'No valid action found';

  constructor(message: string, public readonly include_trace = false) {
    super(message);
    this.name = 'AgentError';
  }

  public static format_error(error: Error, include_trace = false): string {
    if (error instanceof AgentError) {
      return error.message;
    }
    if (error.name === 'ValidationError') {
      return `${AgentError.VALIDATION_ERROR}\nDetails: ${error.message}`;
    }
    if (error.name === 'RateLimitError') {
      return AgentError.RATE_LIMIT_ERROR;
    }
    if (include_trace) {
      return `${error.message}\nStacktrace:\n${error.stack}`;
    }
    return error.message;
  }
}