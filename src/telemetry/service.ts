import { PostHog } from 'posthog-node';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { BaseTelemetryEvent } from './views';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const POSTHOG_EVENT_SETTINGS = { $process_person_profile: false };

/**
 * Singleton class for handling product telemetry
 */
export class ProductTelemetry {
    private static instance: ProductTelemetry;
    private posthogClient: PostHog | null = null;
    private currUserId: string | null = null;
    private readonly USER_ID_PATH = path.join(os.homedir(), '.browser-use', 'user_id');

    private constructor() {
        const posthogApiKey = process.env.POSTHOG_API_KEY;
        if (posthogApiKey) {
            this.posthogClient = new PostHog(posthogApiKey, {
                host: process.env.POSTHOG_HOST || 'https://app.posthog.com'
            });
        }
    }

    public static getInstance(): ProductTelemetry {
        if (!ProductTelemetry.instance) {
            ProductTelemetry.instance = new ProductTelemetry();
        }
        return ProductTelemetry.instance;
    }

    /**
     * Capture a telemetry event
     */
    public capture(event: BaseTelemetryEvent): void {
        if (process.env.DISABLE_TELEMETRY === 'true') {
            return;
        }
        this.directCapture(event);
    }

    /**
     * Direct capture of telemetry event
     */
    private directCapture(event: BaseTelemetryEvent): void {
        if (!this.posthogClient) {
            return;
        }

        try {
            this.posthogClient.capture({
                distinctId: this.userId,
                event: event.name,
                properties: {
                    ...event.properties,
                    ...POSTHOG_EVENT_SETTINGS
                }
            });
        } catch (e) {
            logger.error(`Failed to send telemetry event ${event.name}: ${e}`);
        }
    }

    /**
     * Get or generate user ID
     */
    private get userId(): string {
        if (this.currUserId) {
            return this.currUserId;
        }

        try {
            if (!fs.existsSync(this.USER_ID_PATH)) {
                fs.mkdirSync(path.dirname(this.USER_ID_PATH), { recursive: true });
                const newUserId = uuidv4();
                fs.writeFileSync(this.USER_ID_PATH, newUserId);
                this.currUserId = newUserId;
            } else {
                this.currUserId = fs.readFileSync(this.USER_ID_PATH, 'utf-8');
            }
        } catch (e) {
            this.currUserId = 'UNKNOWN_USER_ID';
        }
        return this.currUserId;
    }

    /**
     * Shutdown telemetry service
     */
    public async shutdown(): Promise<void> {
        if (this.posthogClient) {
            await this.posthogClient.shutdownAsync();
        }
    }
}