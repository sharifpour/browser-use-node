"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendKeysActionSchema = exports.ScrollActionSchema = exports.ExtractPageContentActionSchema = exports.OpenTabActionSchema = exports.SwitchTabActionSchema = exports.DoneActionSchema = exports.InputTextActionSchema = exports.ClickElementActionSchema = exports.GoToUrlActionSchema = exports.SearchGoogleActionSchema = void 0;
const zod_1 = require("zod");
/**
 * Action schemas
 */
exports.SearchGoogleActionSchema = zod_1.z.object({
    query: zod_1.z.string(),
});
exports.GoToUrlActionSchema = zod_1.z.object({
    url: zod_1.z.string(),
});
exports.ClickElementActionSchema = zod_1.z.object({
    index: zod_1.z.number().optional(),
    xpath: zod_1.z.string().optional(),
    x: zod_1.z.number().optional(),
    y: zod_1.z.number().optional(),
});
exports.InputTextActionSchema = zod_1.z.object({
    index: zod_1.z.number(),
    text: zod_1.z.string(),
    xpath: zod_1.z.string().optional(),
});
exports.DoneActionSchema = zod_1.z.object({
    message: zod_1.z.string(),
    data: zod_1.z.any().optional(),
});
exports.SwitchTabActionSchema = zod_1.z.object({
    index: zod_1.z.number(),
});
exports.OpenTabActionSchema = zod_1.z.object({
    url: zod_1.z.string(),
});
exports.ExtractPageContentActionSchema = zod_1.z.object({
    format: zod_1.z.enum(["text", "markdown", "html"]).default("text"),
});
exports.ScrollActionSchema = zod_1.z.object({
    amount: zod_1.z.number().optional(),
});
exports.SendKeysActionSchema = zod_1.z.object({
    index: zod_1.z.number(),
    keys: zod_1.z.string(),
});
