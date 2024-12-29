import { logger } from './logging';

export function timeExecutionSync(name: string): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = function (this: any, ...args: any[]) {
      const start = Date.now();
      const result = originalMethod.apply(this, args);
      const end = Date.now();
      logger.debug(`${name} took ${((end - start) / 1000).toFixed(2)} seconds`);
      return result;
    };

    return descriptor;
  };
}

export function timeExecutionAsync(label: string): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor => {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = async function (this: any, ...args: any[]) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        const end = Date.now();
        logger.debug(`${label} took ${end - start}ms`);
      }
    };

    return descriptor;
  };
}

export * from './logging';
