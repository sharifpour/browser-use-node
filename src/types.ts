import { z } from "zod";
import type { ChatOpenAI } from 'langchain/chat_models/openai';

/**
 * Browser configuration schema with validation
 */
export type BrowserConfigSchemaType = z.infer<typeof BrowserConfigSchema>;

export const BrowserConfigSchema: z.ZodObject<{
	executablePath: z.ZodString;
	args: z.ZodArray<z.ZodString>;
	headless: z.ZodBoolean;
	defaultViewport: z.ZodObject<{
		width: z.ZodNumber;
		height: z.ZodNumber;
	}>;
}> = z.object({
	executablePath: z.string(),
	args: z.array(z.string()),
	headless: z.boolean(),
	defaultViewport: z.object({
		width: z.number(),
		height: z.number()
	})
});

export type BrowserConfig = z.infer<typeof BrowserConfigSchema>;

/**
 * DOM Element Node interface
 */
export interface DOMElementNode {
	tagName: string;
	isVisible: boolean;
	xpath: string;
	attributes: Record<string, string>;
	children: DOMElementNode[];
	isInteractive: boolean;
	isTopElement: boolean;
	shadowRoot: boolean;
	isClickable: boolean;
	parent: DOMElementNode | null;
	highlightIndex?: number;
}

/**
 * DOM Query Options interface
 */
export interface DOMQueryOptions {
	waitForVisible: boolean;
	waitForEnabled: boolean;
	timeout: number;
	includeInvisible: boolean;
}

/**
 * DOM State interface
 */
export interface DOMState {
	elementTree: DOMElementNode[];
	clickableElements: DOMElementNode[];
	selectorMap: Record<number, DOMElementNode>;
}

/**
 * Element Selector type
 */
export type ElementSelector = string | { xpath: string } | { css: string };

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
