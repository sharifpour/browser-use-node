import type { TelemetryEvent } from '../controller/types';

/**
 * Product telemetry service
 */
export class ProductTelemetry {
    /**
     * Capture a telemetry event
     */
    public capture(event: TelemetryEvent): void {
        // In Python this is a no-op by default
        // Implement actual telemetry capture if needed
        console.debug('Telemetry event:', {
            name: event.name,
            properties: event.properties
        });
    }
}