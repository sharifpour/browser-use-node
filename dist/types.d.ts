import { z } from "zod";
/**
 * Browser configuration schema with validation
 */
export declare const BrowserConfigSchema: z.ZodObject<{
    /** Whether to run the browser in headless mode */
    headless: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Whether to keep the browser open after completion */
    keepOpen: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Whether to disable browser security features */
    disableSecurity: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Path to cookies file for persistence */
    cookiesFile: z.ZodOptional<z.ZodString>;
    /** Minimum time to wait for page load in milliseconds */
    minimumWaitPageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /** Time to wait for network idle in milliseconds */
    waitForNetworkIdlePageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /** Maximum time to wait for page load in milliseconds */
    maximumWaitPageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    headless?: boolean;
    keepOpen?: boolean;
    disableSecurity?: boolean;
    cookiesFile?: string;
    minimumWaitPageLoadTime?: number;
    waitForNetworkIdlePageLoadTime?: number;
    maximumWaitPageLoadTime?: number;
}, {
    headless?: boolean;
    keepOpen?: boolean;
    disableSecurity?: boolean;
    cookiesFile?: string;
    minimumWaitPageLoadTime?: number;
    waitForNetworkIdlePageLoadTime?: number;
    maximumWaitPageLoadTime?: number;
}>;
export type BrowserConfig = z.infer<typeof BrowserConfigSchema>;
/**
 * Agent configuration schema with validation
 */
export declare const AgentConfigSchema: z.ZodObject<{
    /** Task description for the agent */
    task: z.ZodString;
    /** Model to use (e.g., 'gpt-4') */
    model: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    /** Optional browser configuration override */
    browserConfig: z.ZodOptional<z.ZodObject<{
        /** Whether to run the browser in headless mode */
        headless: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        /** Whether to keep the browser open after completion */
        keepOpen: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        /** Whether to disable browser security features */
        disableSecurity: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        /** Path to cookies file for persistence */
        cookiesFile: z.ZodOptional<z.ZodString>;
        /** Minimum time to wait for page load in milliseconds */
        minimumWaitPageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        /** Time to wait for network idle in milliseconds */
        waitForNetworkIdlePageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        /** Maximum time to wait for page load in milliseconds */
        maximumWaitPageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        headless?: boolean;
        keepOpen?: boolean;
        disableSecurity?: boolean;
        cookiesFile?: string;
        minimumWaitPageLoadTime?: number;
        waitForNetworkIdlePageLoadTime?: number;
        maximumWaitPageLoadTime?: number;
    }, {
        headless?: boolean;
        keepOpen?: boolean;
        disableSecurity?: boolean;
        cookiesFile?: string;
        minimumWaitPageLoadTime?: number;
        waitForNetworkIdlePageLoadTime?: number;
        maximumWaitPageLoadTime?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    task?: string;
    model?: string;
    browserConfig?: {
        headless?: boolean;
        keepOpen?: boolean;
        disableSecurity?: boolean;
        cookiesFile?: string;
        minimumWaitPageLoadTime?: number;
        waitForNetworkIdlePageLoadTime?: number;
        maximumWaitPageLoadTime?: number;
    };
}, {
    task?: string;
    model?: string;
    browserConfig?: {
        headless?: boolean;
        keepOpen?: boolean;
        disableSecurity?: boolean;
        cookiesFile?: string;
        minimumWaitPageLoadTime?: number;
        waitForNetworkIdlePageLoadTime?: number;
        maximumWaitPageLoadTime?: number;
    };
}>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
/**
 * Agent run parameters
 */
export declare const AgentRunParamsSchema: z.ZodObject<{
    /** Maximum number of steps to take */
    max_steps: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /** Whether to create a history GIF */
    create_history_gif: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    max_steps?: number;
    create_history_gif?: boolean;
}, {
    max_steps?: number;
    create_history_gif?: boolean;
}>;
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
