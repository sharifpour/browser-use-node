import { z } from 'zod';
import { readFileSync, writeFileSync } from 'node:fs';
import { BrowserConfigSchema } from '../types';
import type { BrowserContextConfig } from '../browser/config';
import { ConfigurationError } from '../errors';
import { getLogger } from '../utils/logger';

const logger = getLogger('ConfigManager');

/**
 * Environment variable names
 */
export const ENV_VARS = {
    BROWSER_HEADLESS: 'BROWSER_USE_HEADLESS',
    BROWSER_DISABLE_SECURITY: 'BROWSER_USE_DISABLE_SECURITY',
    BROWSER_COOKIES_FILE: 'BROWSER_USE_COOKIES_FILE',
    BROWSER_TRACE_PATH: 'BROWSER_USE_TRACE_PATH',
    BROWSER_RECORDING_PATH: 'BROWSER_USE_RECORDING_PATH',
    BROWSER_WINDOW_WIDTH: 'BROWSER_USE_WINDOW_WIDTH',
    BROWSER_WINDOW_HEIGHT: 'BROWSER_USE_WINDOW_HEIGHT',
    LOG_LEVEL: 'BROWSER_USE_LOG_LEVEL',
    CONFIG_FILE: 'BROWSER_USE_CONFIG_FILE'
} as const;

/**
 * Configuration file schema
 */
export type ConfigFileSchemaType = z.infer<typeof ConfigFileSchema>;

export const ConfigFileSchema: z.ZodObject<{
  browserPath: z.ZodString;
  userDataDir: z.ZodString;
  defaultViewport: z.ZodObject<{
    width: z.ZodNumber;
    height: z.ZodNumber;
  }>;
}> = z.object({
  browserPath: z.string(),
  userDataDir: z.string(),
  defaultViewport: z.object({
    width: z.number(),
    height: z.number()
  })
});

export type ConfigFile = z.infer<typeof ConfigFileSchema>;

/**
 * Configuration manager
 */
export class ConfigManager {
    private static instance: ConfigManager;
    private config: ConfigFile = {};
    private configFile?: string;

    private constructor() {
        this.loadConfig();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    /**
     * Load configuration from environment and file
     */
    private loadConfig(): void {
        try {
            // Load from environment variables
            this.loadFromEnv();

            // Load from config file
            this.loadFromFile();

            logger.debug('Configuration loaded successfully');
        } catch (error) {
            logger.error('Failed to load configuration:', error);
            throw new ConfigurationError(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Load configuration from environment variables
     */
    private loadFromEnv(): void {
        // Browser config
        const browserConfig: Record<string, unknown> = {};

        if (process.env[ENV_VARS.BROWSER_HEADLESS]) {
            browserConfig.headless = process.env[ENV_VARS.BROWSER_HEADLESS] === 'true';
        }

        if (process.env[ENV_VARS.BROWSER_DISABLE_SECURITY]) {
            browserConfig.disableSecurity = process.env[ENV_VARS.BROWSER_DISABLE_SECURITY] === 'true';
        }

        if (process.env[ENV_VARS.BROWSER_COOKIES_FILE]) {
            browserConfig.cookiesFile = process.env[ENV_VARS.BROWSER_COOKIES_FILE];
        }

        if (process.env[ENV_VARS.BROWSER_TRACE_PATH]) {
            browserConfig.tracePath = process.env[ENV_VARS.BROWSER_TRACE_PATH];
        }

        // Context config
        const contextConfig: Record<string, unknown> = {};

        if (process.env[ENV_VARS.BROWSER_WINDOW_WIDTH] && process.env[ENV_VARS.BROWSER_WINDOW_HEIGHT]) {
            contextConfig.browserWindowSize = {
                width: parseInt(process.env[ENV_VARS.BROWSER_WINDOW_WIDTH], 10),
                height: parseInt(process.env[ENV_VARS.BROWSER_WINDOW_HEIGHT], 10)
            };
        }

        if (process.env[ENV_VARS.BROWSER_RECORDING_PATH]) {
            contextConfig.saveRecordingPath = process.env[ENV_VARS.BROWSER_RECORDING_PATH];
        }

        // Logging config
        const loggingConfig: Record<string, unknown> = {};

        if (process.env[ENV_VARS.LOG_LEVEL]) {
            loggingConfig.level = process.env[ENV_VARS.LOG_LEVEL].toLowerCase();
        }

        // Set config file path
        if (process.env[ENV_VARS.CONFIG_FILE]) {
            this.configFile = process.env[ENV_VARS.CONFIG_FILE];
        }

        // Merge configs
        this.config = {
            browser: Object.keys(browserConfig).length > 0 ? browserConfig : undefined,
            context: Object.keys(contextConfig).length > 0 ? contextConfig : undefined,
            logging: Object.keys(loggingConfig).length > 0 ? loggingConfig : undefined
        };
    }

    /**
     * Load configuration from file
     */
    private loadFromFile(): void {
        if (!this.configFile) return;

        try {
            const fileContent = readFileSync(this.configFile, 'utf-8');
            const fileConfig = JSON.parse(fileContent);
            const validatedConfig = ConfigFileSchema.parse(fileConfig);

            // Deep merge with existing config
            this.config = this.deepMerge(this.config, validatedConfig);
        } catch (error) {
            if (error instanceof Error) {
                throw new ConfigurationError(`Failed to load config file: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Deep merge objects
     */
    private deepMerge<T>(target: T, source: T): T {
        if (!source) return target;
        if (!target) return source;

        const result = { ...target };
        for (const key in source) {
            const value = source[key];
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[key] = this.deepMerge(result[key], value);
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    /**
     * Get browser configuration
     */
    public getBrowserConfig(): z.infer<typeof BrowserConfigSchema> {
        return this.config.browser || {};
    }

    /**
     * Get context configuration
     */
    public getContextConfig(): Partial<BrowserContextConfig> {
        return this.config.context || {};
    }

    /**
     * Get logging configuration
     */
    public getLoggingConfig(): ConfigFile['logging'] {
        return this.config.logging || {};
    }

    /**
     * Save configuration to file
     */
    public saveConfig(filePath?: string): void {
        const path = filePath || this.configFile;
        if (!path) {
            throw new ConfigurationError('No config file path specified');
        }

        try {
            writeFileSync(path, JSON.stringify(this.config, null, 2));
            logger.debug(`Configuration saved to ${path}`);
        } catch (error) {
            throw new ConfigurationError(`Failed to save config file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<ConfigFile>): void {
        try {
            const validatedConfig = ConfigFileSchema.parse(newConfig);
            this.config = this.deepMerge(this.config, validatedConfig);
            logger.debug('Configuration updated successfully');
        } catch (error) {
            throw new ConfigurationError(`Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Reset configuration to defaults
     */
    public resetConfig(): void {
        this.config = {};
        this.loadConfig();
        logger.debug('Configuration reset to defaults');
    }
}