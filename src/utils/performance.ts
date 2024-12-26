import { logger } from './logger';

/**
 * Decorator for measuring execution time of synchronous functions
 * @param additionalText Optional text to add to the log message
 */
export function timeExecutionSync(additionalText: string = '') {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const startTime = performance.now();
            const result = originalMethod.apply(this, args);
            const executionTime = performance.now() - startTime;
            logger.debug(`${additionalText} Execution time: ${executionTime.toFixed(2)}ms`);
            return result;
        };

        return descriptor;
    };
}

/**
 * Decorator for measuring execution time of asynchronous functions
 * @param additionalText Optional text to add to the log message
 */
export function timeExecutionAsync(additionalText: string = '') {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const startTime = performance.now();
            const result = await originalMethod.apply(this, args);
            const executionTime = performance.now() - startTime;
            logger.debug(`${additionalText} Execution time: ${executionTime.toFixed(2)}ms`);
            return result;
        };

        return descriptor;
    };
}

/**
 * Utility class for tracking performance metrics
 */
export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: Map<string, { count: number; totalTime: number; maxTime: number }>;

    private constructor() {
        this.metrics = new Map();
    }

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    /**
     * Record a performance metric
     * @param name Name of the metric
     * @param executionTime Time taken in milliseconds
     */
    public recordMetric(name: string, executionTime: number): void {
        const current = this.metrics.get(name) || { count: 0, totalTime: 0, maxTime: 0 };
        current.count++;
        current.totalTime += executionTime;
        current.maxTime = Math.max(current.maxTime, executionTime);
        this.metrics.set(name, current);
    }

    /**
     * Get performance metrics summary
     */
    public getMetricsSummary(): { [key: string]: { count: number; avgTime: number; maxTime: number } } {
        const summary: { [key: string]: { count: number; avgTime: number; maxTime: number } } = {};
        this.metrics.forEach((value, key) => {
            summary[key] = {
                count: value.count,
                avgTime: value.totalTime / value.count,
                maxTime: value.maxTime
            };
        });
        return summary;
    }

    /**
     * Clear all recorded metrics
     */
    public clearMetrics(): void {
        this.metrics.clear();
    }
}

/**
 * Decorator for recording performance metrics
 * @param metricName Name of the metric to record
 */
export function recordPerformance(metricName: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        const monitor = PerformanceMonitor.getInstance();

        if (originalMethod.constructor.name === 'AsyncFunction') {
            descriptor.value = async function (...args: any[]) {
                const startTime = performance.now();
                const result = await originalMethod.apply(this, args);
                const executionTime = performance.now() - startTime;
                monitor.recordMetric(metricName, executionTime);
                return result;
            };
        } else {
            descriptor.value = function (...args: any[]) {
                const startTime = performance.now();
                const result = originalMethod.apply(this, args);
                const executionTime = performance.now() - startTime;
                monitor.recordMetric(metricName, executionTime);
                return result;
            };
        }

        return descriptor;
    };
}