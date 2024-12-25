import { z } from "zod";

/**
 * Browser configuration schema with validation
 */
export const BrowserConfigSchema = z.object({
	/** Whether to run the browser in headless mode */
	headless: z.boolean().optional().default(false),
	/** Whether to disable browser security features */
	disableSecurity: z.boolean().optional().default(true),
	/** Additional Chromium arguments */
	extraChromiumArgs: z.array(z.string()).optional(),
	/** Path to cookies file for persistence */
	cookiesFile: z.string().optional(),
	/** Minimum time to wait for page load in milliseconds */
	minimumWaitPageLoadTime: z.number().optional().default(500),
	/** Time to wait for network idle in milliseconds */
	waitForNetworkIdlePageLoadTime: z.number().optional().default(1000),
	/** Maximum time to wait for page load in milliseconds */
	maximumWaitPageLoadTime: z.number().optional().default(5000),
	/** Recording configuration */
	recording: z.object({
		/** Whether recording is enabled */
		enabled: z.boolean(),
		/** Path to recording file */
		path: z.string(),
		/** Recording options */
		options: z.record(z.unknown()).optional()
	}).optional(),
	/** Trace configuration */
	trace: z.object({
		/** Whether tracing is enabled */
		enabled: z.boolean(),
		/** Path to trace file */
		path: z.string()
	}).optional(),
	/** Viewport configuration */
	viewport: z.object({
		/** Viewport width */
		width: z.number(),
		/** Viewport height */
		height: z.number()
	}).optional()
});

export type BrowserConfig = z.infer<typeof BrowserConfigSchema>;

/**
 * Agent configuration schema with validation
 */
export const AgentConfigSchema = z.object({
	/** Task description for the agent */
	task: z.string(),
	/** Model to use (e.g., 'gpt-4') */
	model: z.string().optional().default("gpt-4"),
	/** Optional browser configuration override */
	browserConfig: BrowserConfigSchema.optional(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Agent run parameters
 */
export const AgentRunParamsSchema = z.object({
	/** Maximum number of steps to take */
	max_steps: z.number().optional().default(3),
	/** Whether to create a history GIF */
	create_history_gif: z.boolean().optional().default(false),
});

export type AgentRunParams = z.infer<typeof AgentRunParamsSchema>;

/**
 * Response from browser operations
 */
export interface BrowserResponse {
	/** Operation status */
	status: "success" | "error";
	/** Optional response data */
	data?: unknown;
	/** Status or error message */
	message?: string;
}

/**
 * History entry for agent actions
 */
export interface AgentHistory {
	/** Action performed */
	action: string;
	/** When the action was performed */
	timestamp: Date;
	/** Whether the action was successful */
	success: boolean;
	/** Additional details about the action */
	details?: Record<string, unknown>;
}

/**
 * Main content extractor configuration
 */
export interface ContentExtractorConfig {
	/** Whether the extractor is enabled */
	enabled: boolean;
	/** Mode of extraction */
	mode: "text" | "markdown" | "html";
	/** Options for the extractor */
	options?: {
		/** Whether to include images */
		includeImages?: boolean;
		/** Maximum length of extracted content */
		maxLength?: number;
		/** Whether to remove ads */
		removeAds?: boolean;
	};
}
