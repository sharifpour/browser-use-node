export interface Logger {
	debug(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string, ...args: any[]): void;
}

class ConsoleLogger implements Logger {
	constructor(private prefix: string = '') {}

	debug(message: string, ...args: any[]): void {
		console.debug(`[${this.prefix}] ${message}`, ...args);
	}

	info(message: string, ...args: any[]): void {
		console.info(`[${this.prefix}] ${message}`, ...args);
	}

	warn(message: string, ...args: any[]): void {
		console.warn(`[${this.prefix}] ${message}`, ...args);
	}

	error(message: string, ...args: any[]): void {
		console.error(`[${this.prefix}] ${message}`, ...args);
	}
}

export function getLogger(prefix: string): Logger {
	return new ConsoleLogger(prefix);
}

export const logger = getLogger('browser-use-node');
