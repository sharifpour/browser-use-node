/**
 * Logging service that matches Python's logging module functionality
 */

import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
	let msg = `${timestamp} [${level}] ${message}`;
	if (Object.keys(metadata).length > 0) {
		msg += ` ${JSON.stringify(metadata)}`;
	}
	return msg;
});

// Create logger instance
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	format: combine(
		timestamp(),
		colorize(),
		logFormat
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'error.log', level: 'error' }),
		new winston.transports.File({ filename: 'combined.log' })
	]
});

// Log levels matching Python's logging levels
export enum LogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	WARNING = 'warn',
	ERROR = 'error',
	CRITICAL = 'error'
}

/**
 * Logger class that matches Python's logging functionality
 */
export class Logger {
	private readonly name: string;

	constructor(name: string) {
		this.name = name;
	}

	debug(message: string, ...args: unknown[]): void {
		logger.debug(`[${this.name}] ${message}`, ...args);
	}

	info(message: string, ...args: unknown[]): void {
		logger.info(`[${this.name}] ${message}`, ...args);
	}

	warning(message: string, ...args: unknown[]): void {
		logger.warn(`[${this.name}] ${message}`, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		logger.error(`[${this.name}] ${message}`, ...args);
	}

	critical(message: string, ...args: unknown[]): void {
		logger.error(`[${this.name}] CRITICAL: ${message}`, ...args);
	}

	exception(error: Error, message?: string): void {
		logger.error(`[${this.name}] ${message || error.message}`, {
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			}
		});
	}
}

/**
 * Get logger instance for a module
 */
export function getLogger(name: string): Logger {
	return new Logger(name);
}

/**
 * Set global log level
 */
export function setLogLevel(level: LogLevel): void {
	logger.level = level;
}

/**
 * Add file transport
 */
export function addFileTransport(filename: string, level?: LogLevel): void {
	logger.add(new winston.transports.File({
		filename,
		level: level || 'info'
	}));
}

/**
 * Remove all transports
 */
export function removeAllTransports(): void {
	logger.clear();
}

/**
 * Configure logger
 */
export interface LoggerConfig {
	level?: LogLevel;
	filename?: string;
	console?: boolean;
	format?: string;
}

export function configureLogger(config: LoggerConfig): void {
	// Remove existing transports
	removeAllTransports();

	// Set log level
	if (config.level) {
		setLogLevel(config.level);
	}

	// Add console transport
	if (config.console !== false) {
		logger.add(new winston.transports.Console({
			format: combine(
				timestamp(),
				colorize(),
				logFormat
			)
		}));
	}

	// Add file transport
	if (config.filename) {
		addFileTransport(config.filename);
	}
}