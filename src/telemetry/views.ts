/**
 * Base telemetry event interface
 */
export interface BaseTelemetryEvent {
    name: string;
    properties: Record<string, any>;
}

/**
 * Performance telemetry event
 */
export interface PerformanceTelemetryEvent extends BaseTelemetryEvent {
    name: 'performance_metric';
    properties: {
        metricName: string;
        executionTime: number;
        timestamp: number;
    };
}

/**
 * Agent run telemetry event
 */
export interface AgentRunTelemetryEvent extends BaseTelemetryEvent {
    name: 'agent_run';
    properties: {
        agentId: string;
        task: string;
    };
}

/**
 * Agent step error telemetry event
 */
export interface AgentStepErrorTelemetryEvent extends BaseTelemetryEvent {
    name: 'agent_step_error';
    properties: {
        agentId: string;
        error: string;
    };
}

/**
 * Agent end telemetry event
 */
export interface AgentEndTelemetryEvent extends BaseTelemetryEvent {
    name: 'agent_end';
    properties: {
        agentId: string;
        task: string;
        steps: number;
        success: boolean;
        error?: string;
    };
}

/**
 * Controller registered functions telemetry event
 */
export interface ControllerRegisteredFunctionsTelemetryEvent extends BaseTelemetryEvent {
    name: 'controller_registered_functions';
    properties: {
        registeredFunctions: Array<{
            name: string;
            params: Record<string, any>;
        }>;
    };
}

/**
 * Performance monitoring telemetry event
 */
export interface PerformanceMonitoringTelemetryEvent extends BaseTelemetryEvent {
    name: 'performance_monitoring';
    properties: {
        metrics: Record<string, {
            count: number;
            avgTime: number;
            maxTime: number;
        }>;
        timestamp: number;
    };
}