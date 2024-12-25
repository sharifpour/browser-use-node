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
    data?: unknown;
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
export declare const SearchGoogleActionSchema: z.ZodObject<{
    query: z.ZodString;
}, "strip", z.ZodTypeAny, {
    query?: string;
}, {
    query?: string;
}>;
export declare const GoToUrlActionSchema: z.ZodObject<{
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url?: string;
}, {
    url?: string;
}>;
export declare const ClickElementActionSchema: z.ZodObject<{
    index: z.ZodOptional<z.ZodNumber>;
    xpath: z.ZodOptional<z.ZodString>;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    index?: number;
    xpath?: string;
    x?: number;
    y?: number;
}, {
    index?: number;
    xpath?: string;
    x?: number;
    y?: number;
}>;
export declare const InputTextActionSchema: z.ZodObject<{
    index: z.ZodNumber;
    text: z.ZodString;
    xpath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    index?: number;
    xpath?: string;
    text?: string;
}, {
    index?: number;
    xpath?: string;
    text?: string;
}>;
export declare const DoneActionSchema: z.ZodObject<{
    message: z.ZodString;
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    data?: any;
}, {
    message?: string;
    data?: any;
}>;
export declare const SwitchTabActionSchema: z.ZodObject<{
    index: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    index?: number;
}, {
    index?: number;
}>;
export declare const OpenTabActionSchema: z.ZodObject<{
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url?: string;
}, {
    url?: string;
}>;
export declare const ExtractPageContentActionSchema: z.ZodObject<{
    format: z.ZodDefault<z.ZodEnum<["text", "markdown", "html"]>>;
}, "strip", z.ZodTypeAny, {
    format?: "text" | "markdown" | "html";
}, {
    format?: "text" | "markdown" | "html";
}>;
export declare const ScrollActionSchema: z.ZodObject<{
    amount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    amount?: number;
}, {
    amount?: number;
}>;
export declare const SendKeysActionSchema: z.ZodObject<{
    index: z.ZodNumber;
    keys: z.ZodString;
}, "strip", z.ZodTypeAny, {
    keys?: string;
    index?: number;
}, {
    keys?: string;
    index?: number;
}>;
export interface GoBackAction {
    type: "go_back";
}
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
export type ExtractPageContentAction = z.infer<typeof ExtractPageContentActionSchema>;
export type ScrollAction = z.infer<typeof ScrollActionSchema>;
export type SendKeysAction = z.infer<typeof SendKeysActionSchema>;
/**
 * Union type of all possible action parameters
 */
export type ActionParams = SearchGoogleAction | GoToUrlAction | GoBackAction | ClickElementAction | InputTextAction | SwitchTabAction | OpenTabAction | ExtractPageContentAction | ScrollAction | SendKeysAction | DoneAction;
