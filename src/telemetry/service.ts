import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { PostHog } from 'posthog-node';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const POSTHOG_EVENT_SETTINGS = { $process_person_profile: false };

export interface BaseTelemetryEvent {
    name: string;
    properties: Record<string, unknown>;
}

export class ProductTelemetry {
    private static instance: ProductTelemetry;
    private readonly USER_ID_PATH = join(homedir(), '.cache', 'browser_use', 'telemetry_user_id');
    private readonly PROJECT_API_KEY = 'phc_F8JMNjW1i2KbGUTaW1unnDdLSPCoyc52SGRU0JecaUh';
    private readonly HOST = 'https://eu.i.posthog.com';
    private readonly UNKNOWN_USER_ID = 'UNKNOWN';

    private _curr_user_id: string | null = null;
    private _posthog_client: PostHog | null = null;
    private debug_logging: boolean;

    private constructor() {
        const telemetry_disabled = process.env.ANONYMIZED_TELEMETRY?.toLowerCase() === 'false';
        this.debug_logging = process.env.BROWSER_USE_LOGGING_LEVEL?.toLowerCase() === 'debug';

        if (telemetry_disabled) {
            this._posthog_client = null;
        } else {
            logger.info('Anonymized telemetry enabled. See https://github.com/gregpr07/browser-use for more information.');
            this._posthog_client = new PostHog(
                this.PROJECT_API_KEY,
                { host: this.HOST }
            );
        }

        if (this._posthog_client === null) {
            logger.debug('Telemetry disabled');
        }
    }

    public static getInstance(): ProductTelemetry {
        if (!ProductTelemetry.instance) {
            ProductTelemetry.instance = new ProductTelemetry();
        }
        return ProductTelemetry.instance;
    }

    public capture(event: BaseTelemetryEvent): void {
        if (this._posthog_client === null) {
            return;
        }

        if (this.debug_logging) {
            logger.debug(`Telemetry event: ${event.name} ${JSON.stringify(event.properties)}`);
        }
        this._direct_capture(event);
    }

    private _direct_capture(event: BaseTelemetryEvent): void {
        if (this._posthog_client === null) {
            return;
        }

        try {
            this._posthog_client.capture({
                distinctId: this.user_id,
                event: event.name,
                properties: { ...event.properties, ...POSTHOG_EVENT_SETTINGS }
            });
        } catch (error) {
            logger.error(`Failed to send telemetry event ${event.name}: ${error}`);
        }
    }

    private get user_id(): string {
        if (this._curr_user_id) {
            return this._curr_user_id;
        }

        try {
            if (!existsSync(this.USER_ID_PATH)) {
                mkdirSync(join(homedir(), '.cache', 'browser_use'), { recursive: true });
                const new_user_id = uuidv4();
                writeFileSync(this.USER_ID_PATH, new_user_id);
                this._curr_user_id = new_user_id;
            } else {
                this._curr_user_id = readFileSync(this.USER_ID_PATH, 'utf-8');
            }
        } catch (error) {
            this._curr_user_id = this.UNKNOWN_USER_ID;
        }
        return this._curr_user_id;
    }
}