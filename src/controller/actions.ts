import { z } from 'zod';

/**
 * Base action model
 */
export interface BaseActionModel {
    toJSON(): Record<string, unknown>;
    getIndex(): number | undefined;
    setIndex(index: number): void;
}

/**
 * Action types
 */

export interface SearchGoogleAction extends BaseActionModel {
    query: string;
}

export interface GoToUrlAction extends BaseActionModel {
    url: string;
}

export interface ClickElementAction extends BaseActionModel {
    index: number;
    xpath?: string;
}

export interface InputTextAction extends BaseActionModel {
    index: number;
    text: string;
    xpath?: string;
}

export interface DoneAction extends BaseActionModel {
    text: string;
    data?: unknown;
}

export interface SwitchTabAction extends BaseActionModel {
    pageId: number;
}

export interface OpenTabAction extends BaseActionModel {
    url: string;
}

export interface ExtractPageContentAction extends BaseActionModel {
    value: 'text' | 'markdown' | 'html';
}

export interface ScrollAction extends BaseActionModel {
    amount?: number;
}

export interface SendKeysAction extends BaseActionModel {
    keys: string;
}

export interface ScrollToTextAction extends BaseActionModel {
    text: string;
}

export interface GetDropdownOptionsAction extends BaseActionModel {
    index: number;
}

export interface SelectDropdownOptionAction extends BaseActionModel {
    index: number;
    text: string;
}

/**
 * Action schemas
 */

export const SearchGoogleActionSchema = z.object({
    query: z.string()
}).strict();

export const GoToUrlActionSchema = z.object({
    url: z.string().url()
}).strict();

export const ClickElementActionSchema = z.object({
    index: z.number().int().positive(),
    xpath: z.string().optional()
}).strict();

export const InputTextActionSchema = z.object({
    index: z.number().int().positive(),
    text: z.string(),
    xpath: z.string().optional()
}).strict();

export const DoneActionSchema = z.object({
    text: z.string(),
    data: z.unknown().optional()
}).strict();

export const SwitchTabActionSchema = z.object({
    pageId: z.number().int().nonnegative()
}).strict();

export const OpenTabActionSchema = z.object({
    url: z.string().url()
}).strict();

export const ExtractPageContentActionSchema = z.object({
    value: z.enum(['text', 'markdown', 'html']).default('text')
}).strict();

export const ScrollActionSchema = z.object({
    amount: z.number().int().optional()
}).strict();

export const SendKeysActionSchema = z.object({
    keys: z.string()
}).strict();

export const ScrollToTextActionSchema = z.object({
    text: z.string()
}).strict();

export const GetDropdownOptionsActionSchema = z.object({
    index: z.number().int().positive()
}).strict();

export const SelectDropdownOptionActionSchema = z.object({
    index: z.number().int().positive(),
    text: z.string()
}).strict();