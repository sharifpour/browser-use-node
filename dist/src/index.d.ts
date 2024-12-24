import type {
	AgentConfig,
	AgentHistory,
	AgentRunParams,
	BrowserConfig,
	BrowserResponse,
} from "./types";
export declare class BrowserUse {
	private readonly pythonPath;
	private readonly scriptPath;
	private readonly config;
	private readonly history;
	constructor(config?: Partial<BrowserConfig>);
	private createPyShell;
	private executeCommand;
	initialize(): Promise<void>;
	createAgent(config: AgentConfig): Promise<BrowserResponse>;
	runAgent(params: AgentRunParams): Promise<BrowserResponse>;
	getHistory(): Promise<readonly AgentHistory[]>;
	close(): Promise<void>;
}
export * from "./types";
