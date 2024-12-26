import { z } from "zod";
import type { ChatOpenAI } from 'langchain/chat_models/openai';

/**
 * Browser configuration schema with validation
 */
export const BrowserConfigSchema = z.object({
	/** Whether to run the browser in headless mode */
	headless: z.boolean().optional().default(false),
	/** Whether to disable browser security features */
	disableSecurity: z.boolean().optional().default(true),
	/** Additional Chromium arguments */
	extraChromiumArgs: z.array(z.string()).optional().default([]),
	/** Path to Chrome instance for connecting to normal browser */
	chromeInstancePath: z.string().optional(),
	/** WebSocket URL for connecting to browser */
	wssUrl: z.string().optional(),
	/** Proxy settings */
	proxy: z.object({
		server: z.string(),
		bypass: z.string().optional(),
		username: z.string().optional(),
		password: z.string().optional()
	}).optional(),
	/** Default configuration for new browser contexts */
	newContextConfig: z.object({
		/** Path to cookies file for persistence */
		cookiesFile: z.string().optional(),
		/** Minimum time to wait for page load in seconds */
		minimumWaitPageLoadTime: z.number().optional().default(0.5),
		/** Time to wait for network idle in seconds */
		waitForNetworkIdlePageLoadTime: z.number().optional().default(1.0),
		/** Maximum time to wait for page load in seconds */
		maximumWaitPageLoadTime: z.number().optional().default(5.0),
		/** Time to wait between actions in seconds */
		waitBetweenActions: z.number().optional().default(1.0),
		/** Browser window size */
		browserWindowSize: z.object({
			width: z.number(),
			height: z.number()
		}).optional().default({ width: 1280, height: 1100 }),
		/** Whether to disable viewport */
		noViewport: z.boolean().optional().default(false),
		/** Path to save video recordings */
		saveRecordingPath: z.string().optional(),
		/** Path to save trace files */
		tracePath: z.string().optional(),
		/** Whether to save screenshots */
		saveScreenshots: z.boolean().optional().default(false)
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

export interface MessageContent {
	type: 'text';
	text: string;
}

export interface BaseMessage {
	content: string | MessageContent[];
	constructor: { name: string };
}

export type BaseChatModel = ChatOpenAI;
