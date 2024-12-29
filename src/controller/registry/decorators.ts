
export interface ActionOptions {
  param_model?: any;
  requires_browser?: boolean;
  description: string;
}

export function action(description: string, param_model?: any, requires_browser = false) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      // Here we can add validation using param_model if needed
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

export function time_execution_async() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const end = performance.now();
        console.log(`${propertyKey} took ${end - start}ms`);
        return result;
      } catch (error) {
        const end = performance.now();
        console.error(`${propertyKey} failed after ${end - start}ms`);
        throw error;
      }
    };
    return descriptor;
  };
}

export function time_execution_sync() {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      try {
        const result = originalMethod.apply(this, args);
        const end = performance.now();
        console.log(`${propertyKey} took ${end - start}ms`);
        return result;
      } catch (error) {
        const end = performance.now();
        console.error(`${propertyKey} failed after ${end - start}ms`);
        throw error;
      }
    };
    return descriptor;
  };
}
