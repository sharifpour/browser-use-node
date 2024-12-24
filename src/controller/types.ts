import { z } from "zod";

/**
 * Controller types and interfaces
 */

/**
 * Result of an action
 */
export interface ActionResult {
	/**
	 * Whether the action was successful
	 */
	success?: boolean;

	/**
	 * Message describing the result
	 */
	message?: string;

	/**
	 * Content extracted from the action
	 */
	extractedContent?: string;

	/**
	 * Whether to include the result in memory
	 */
	includeInMemory?: boolean;

	/**
	 * Additional data from the action
	 */
	data?: any;

	/**
	 * Whether the action is done
	 */
	isDone?: boolean;

	/**
	 * Error message if the action failed
	 */
	error?: string;
}

/**
 * Action schemas
 */
export const SearchGoogleActionSchema = z.object({
	query: z.string(),
});

export const GoToUrlActionSchema = z.object({
	url: z.string(),
});

export const ClickElementActionSchema = z.object({
	index: z.number(),
	xpath: z.string().optional(),
});

export const InputTextActionSchema = z.object({
	index: z.number(),
	text: z.string(),
	xpath: z.string().optional(),
});

export const DoneActionSchema = z.object({
	message: z.string(),
	data: z.any().optional(),
});

export const SwitchTabActionSchema = z.object({
	index: z.number(),
});

export const OpenTabActionSchema = z.object({
	url: z.string(),
});

export const ExtractPageContentActionSchema = z.object({
	format: z.enum(["text", "markdown", "html"]).default("text"),
});

export const ScrollActionSchema = z.object({
	amount: z.number().optional(),
});

export const SendKeysActionSchema = z.object({
	index: z.number(),
	keys: z.string(),
});

/**
 * Action types
 */
export type SearchGoogleAction = z.infer<typeof SearchGoogleActionSchema>;
export type GoToUrlAction = z.infer<typeof GoToUrlActionSchema>;
export type ClickElementAction = z.infer<typeof ClickElementActionSchema>;
export type InputTextAction = z.infer<typeof InputTextActionSchema>;
export type DoneAction = z.infer<typeof DoneActionSchema>;
export type SwitchTabAction = z.infer<typeof SwitchTabActionSchema>;
export type OpenTabAction = z.infer<typeof OpenTabActionSchema>;
export type ExtractPageContentAction = z.infer<
	typeof ExtractPageContentActionSchema
>;
export type ScrollAction = z.infer<typeof ScrollActionSchema>;
export type SendKeysAction = z.infer<typeof SendKeysActionSchema>;
