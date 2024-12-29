import { logger } from './logging';

// Python source reference:
// """
// Utility functions.
// """
//
// import functools
// import logging
// import time
// from typing import Any, Callable, TypeVar
//
// logger = logging.getLogger(__name__)
//
// T = TypeVar('T')
//
//
// def time_execution_sync(name: str) -> Callable[[Callable[..., T]], Callable[..., T]]:
// 	"""Time execution of a function."""
//
// 	def decorator(func: Callable[..., T]) -> Callable[..., T]:
// 		@functools.wraps(func)
// 		def wrapper(*args: Any, **kwargs: Any) -> T:
// 			start = time.time()
// 			result = func(*args, **kwargs)
// 			end = time.time()
// 			logger.debug(f'{name} took {end - start:.2f} seconds')
// 			return result
//
// 		return wrapper
//
// 	return decorator

export function timeExecutionSync(name: string) {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const result = await originalMethod.apply(this, args);
      const end = Date.now();
      logger.debug(`${name} took ${((end - start) / 1000).toFixed(2)} seconds`);
      return result;
    };

    return descriptor;
  };
}

export function timeExecutionAsync(label: string) {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        return await originalMethod.apply(this, args);
      } finally {
        const end = Date.now();
        logger.debug(`${label} took ${end - start}ms`);
      }
    };

    return descriptor;
  };
}

export * from './logging';
