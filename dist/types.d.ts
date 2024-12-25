import { z } from "zod";
/**
 * Browser configuration schema with validation
 */
export declare const BrowserConfigSchema: z.ZodObject<{
    /** Whether to run the browser in headless mode */
    headless: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Whether to disable browser security features */
    disableSecurity: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Additional Chromium arguments */
    extraChromiumArgs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Path to cookies file for persistence */
    cookiesFile: z.ZodOptional<z.ZodString>;
    /** Minimum time to wait for page load in milliseconds */
    minimumWaitPageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /** Time to wait for network idle in milliseconds */
    waitForNetworkIdlePageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /** Maximum time to wait for page load in milliseconds */
    maximumWaitPageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    /** Recording configuration */
    recording: z.ZodOptional<z.ZodObject<{
        /** Whether recording is enabled */
        enabled: z.ZodBoolean;
        /** Path to recording file */
        path: z.ZodString;
        /** Recording options */
        options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        path?: string;
        options?: Record<string, unknown>;
        enabled?: boolean;
    }, {
        path?: string;
        options?: Record<string, unknown>;
        enabled?: boolean;
    }>>;
    /** Trace configuration */
    trace: z.ZodOptional<z.ZodObject<{
        /** Whether tracing is enabled */
        enabled: z.ZodBoolean;
        /** Path to trace file */
        path: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path?: string;
        enabled?: boolean;
    }, {
        path?: string;
        enabled?: boolean;
    }>>;
    /** Viewport configuration */
    viewport: z.ZodOptional<z.ZodObject<{
        /** Viewport width */
        width: z.ZodNumber;
        /** Viewport height */
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        width?: number;
        height?: number;
    }, {
        width?: number;
        height?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    cookiesFile?: string;
    minimumWaitPageLoadTime?: number;
    waitForNetworkIdlePageLoadTime?: number;
    maximumWaitPageLoadTime?: number;
    disableSecurity?: boolean;
    viewport?: {
        width?: number;
        height?: number;
    };
    headless?: boolean;
    extraChromiumArgs?: string[];
    recording?: {
        path?: string;
        options?: Record<string, unknown>;
        enabled?: boolean;
    };
    trace?: {
        path?: string;
        enabled?: boolean;
    };
}, {
    cookiesFile?: string;
    minimumWaitPageLoadTime?: number;
    waitForNetworkIdlePageLoadTime?: number;
    maximumWaitPageLoadTime?: number;
    disableSecurity?: boolean;
    viewport?: {
        width?: number;
        height?: number;
    };
    headless?: boolean;
    extraChromiumArgs?: string[];
    recording?: {
        path?: string;
        options?: Record<string, unknown>;
        enabled?: boolean;
    };
    trace?: {
        path?: string;
        enabled?: boolean;
    };
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
        /** Whether to disable browser security features */
        disableSecurity: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        /** Additional Chromium arguments */
        extraChromiumArgs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        /** Path to cookies file for persistence */
        cookiesFile: z.ZodOptional<z.ZodString>;
        /** Minimum time to wait for page load in milliseconds */
        minimumWaitPageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        /** Time to wait for network idle in milliseconds */
        waitForNetworkIdlePageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        /** Maximum time to wait for page load in milliseconds */
        maximumWaitPageLoadTime: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        /** Recording configuration */
        recording: z.ZodOptional<z.ZodObject<{
            /** Whether recording is enabled */
            enabled: z.ZodBoolean;
            /** Path to recording file */
            path: z.ZodString;
            /** Recording options */
            options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            path?: string;
            options?: Record<string, unknown>;
            enabled?: boolean;
        }, {
            path?: string;
            options?: Record<string, unknown>;
            enabled?: boolean;
        }>>;
        /** Trace configuration */
        trace: z.ZodOptional<z.ZodObject<{
            /** Whether tracing is enabled */
            enabled: z.ZodBoolean;
            /** Path to trace file */
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path?: string;
            enabled?: boolean;
        }, {
            path?: string;
            enabled?: boolean;
        }>>;
        /** Viewport configuration */
        viewport: z.ZodOptional<z.ZodObject<{
            /** Viewport width */
            width: z.ZodNumber;
            /** Viewport height */
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            width?: number;
            height?: number;
        }, {
            width?: number;
            height?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        cookiesFile?: string;
        minimumWaitPageLoadTime?: number;
        waitForNetworkIdlePageLoadTime?: number;
        maximumWaitPageLoadTime?: number;
        disableSecurity?: boolean;
        viewport?: {
            width?: number;
            height?: number;
        };
        headless?: boolean;
        extraChromiumArgs?: string[];
        recording?: {
            path?: string;
            options?: Record<string, unknown>;
            enabled?: boolean;
        };
        trace?: {
            path?: string;
            enabled?: boolean;
        };
    }, {
        cookiesFile?: string;
        minimumWaitPageLoadTime?: number;
        waitForNetworkIdlePageLoadTime?: number;
        maximumWaitPageLoadTime?: number;
        disableSecurity?: boolean;
        viewport?: {
            width?: number;
            height?: number;
        };
        headless?: boolean;
        extraChromiumArgs?: string[];
        recording?: {
            path?: string;
            options?: Record<string, unknown>;
            enabled?: boolean;
        };
        trace?: {
            path?: string;
            enabled?: boolean;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    task?: string;
    model?: string;
    browserConfig?: {
        cookiesFile?: string;
        minimumWaitPageLoadTime?: number;
        waitForNetworkIdlePageLoadTime?: number;
        maximumWaitPageLoadTime?: number;
        disableSecurity?: boolean;
        viewport?: {
            width?: number;
            height?: number;
        };
        headless?: boolean;
        extraChromiumArgs?: string[];
        recording?: {
            path?: string;
            options?: Record<string, unknown>;
            enabled?: boolean;
        };
        trace?: {
            path?: string;
            enabled?: boolean;
        };
    };
}, {
    task?: string;
    model?: string;
    browserConfig?: {
        cookiesFile?: string;
        minimumWaitPageLoadTime?: number;
        waitForNetworkIdlePageLoadTime?: number;
        maximumWaitPageLoadTime?: number;
        disableSecurity?: boolean;
        viewport?: {
            width?: number;
            height?: number;
        };
        headless?: boolean;
        extraChromiumArgs?: string[];
        recording?: {
            path?: string;
            options?: Record<string, unknown>;
            enabled?: boolean;
        };
        trace?: {
            path?: string;
            enabled?: boolean;
        };
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
