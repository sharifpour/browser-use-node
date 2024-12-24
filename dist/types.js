"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRunParamsSchema = exports.AgentConfigSchema = exports.BrowserConfigSchema = void 0;
const zod_1 = require("zod");
/**
 * Browser configuration schema with validation
 */
exports.BrowserConfigSchema = zod_1.z.object({
    /** Whether to run the browser in headless mode */
    headless: zod_1.z.boolean().optional().default(false),
    /** Whether to keep the browser open after completion */
    keepOpen: zod_1.z.boolean().optional().default(false),
    /** Whether to disable browser security features */
    disableSecurity: zod_1.z.boolean().optional().default(false),
    /** Path to cookies file for persistence */
    cookiesFile: zod_1.z.string().optional(),
    /** Minimum time to wait for page load in milliseconds */
    minimumWaitPageLoadTime: zod_1.z.number().optional().default(500),
    /** Time to wait for network idle in milliseconds */
    waitForNetworkIdlePageLoadTime: zod_1.z.number().optional().default(1000),
    /** Maximum time to wait for page load in milliseconds */
    maximumWaitPageLoadTime: zod_1.z.number().optional().default(5000),
});
/**
 * Agent configuration schema with validation
 */
exports.AgentConfigSchema = zod_1.z.object({
    /** Task description for the agent */
    task: zod_1.z.string(),
    /** Model to use (e.g., 'gpt-4') */
    model: zod_1.z.string().optional().default("gpt-4"),
    /** Optional browser configuration override */
    browserConfig: exports.BrowserConfigSchema.optional(),
});
/**
 * Agent run parameters
 */
exports.AgentRunParamsSchema = zod_1.z.object({
    /** Maximum number of steps to take */
    max_steps: zod_1.z.number().optional().default(3),
    /** Whether to create a history GIF */
    create_history_gif: zod_1.z.boolean().optional().default(false),
});
