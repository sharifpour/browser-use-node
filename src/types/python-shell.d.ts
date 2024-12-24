/**
 * Type definitions for python-shell
 * Provides type-safe event handling and configuration for Python shell execution
 */

declare module "python-shell" {
	import type { EventEmitter } from "node:events";

	export interface Options {
		mode?: "text" | "json" | "binary";
		formatter?: (param: string) => unknown;
		parser?: (param: string) => unknown;
		stderrParser?: (param: string) => unknown;
		encoding?: string;
		pythonPath?: string;
		pythonOptions?: readonly string[];
		scriptPath?: string;
		args?: readonly string[];
		stdio?: readonly unknown[];
	}

	export interface PythonShellEvents {
		message: (message: string) => void;
		stderr: (stderr: string) => void;
		stderrLine: (line: string) => void;
		error: (error: Error) => void;
		close: (exitCode: number) => void;
	}

	export class PythonShell extends EventEmitter {
		constructor(script: string, options?: Options);

		static run(
			script: string,
			options?: Options,
		): Promise<[string[], string[]]>;
		static runString(
			code: string,
			options?: Options,
		): Promise<[string[], string[]]>;
		static checkSyntax(code: string): boolean;
		static readonly defaultPythonPath: string;
		static readonly defaultOptions: Options;

		on<E extends keyof PythonShellEvents>(
			event: E,
			listener: PythonShellEvents[E],
		): this;
		once<E extends keyof PythonShellEvents>(
			event: E,
			listener: PythonShellEvents[E],
		): this;
		emit<E extends keyof PythonShellEvents>(
			event: E,
			...args: Parameters<PythonShellEvents[E]>
		): boolean;

		send(message: unknown): void;
		end(
			callback?: (
				err: Error | null,
				exitCode: number,
				exitSignal: string,
			) => void,
		): void;
		terminate(signal?: string): void;
		kill(signal?: string): void;

		readonly exitCode: number | null;
		readonly terminated: boolean;
		readonly stderrBuffer: readonly string[];
	}
}
