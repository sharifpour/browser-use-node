export interface Logger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
}

class ConsoleLogger implements Logger {
  debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }

  info(message: string): void {
    console.info(`[INFO] ${message}`);
  }

  warning(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

export const logger = new ConsoleLogger();
