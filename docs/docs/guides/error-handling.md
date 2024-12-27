---
sidebar_position: 5
---

# Error Handling

This guide covers error handling strategies in browser-use-node.

## Basic Error Handling

```typescript
const browser = new BrowserUse();

try {
  await browser.goto('https://example.com');
  await browser.click('#non-existent-button');
} catch (error) {
  console.error('Operation failed:', error.message);
}
```

## Common Error Types

```typescript
// Navigation errors
try {
  await browser.goto('https://invalid-url');
} catch (NavigationError) {
  // Handle navigation failure
}

// Element not found
try {
  await browser.click('#missing-element');
} catch (ElementNotFoundError) {
  // Handle missing element
}

// Timeout errors
try {
  await browser.waitForSelector('.slow-loading', { timeout: 5000 });
} catch (TimeoutError) {
  // Handle timeout
}
```

## Retry Mechanisms

```typescript
// Retry with exponential backoff
const result = await browser.retry(async () => {
  await browser.click('#flaky-button');
}, {
  maxAttempts: 3,
  backoff: 'exponential'
});

// Custom retry logic
await browser.retryWithCondition(
  async () => await browser.click('#button'),
  async () => await browser.isElementVisible('#success-message')
);
```

## Error Recovery Strategies

```typescript
// Automatic error recovery
browser.setErrorRecovery({
  autoRetry: true,
  maxAttempts: 3,
  recoveryActions: ['refresh', 'wait', 'retry']
});

// Custom recovery actions
browser.addRecoveryStrategy('elementNotFound', async (error) => {
  await browser.scrollIntoView(error.selector);
  await browser.click(error.selector);
});
```

## Logging and Debugging

```typescript
// Enable detailed logging
browser.setLogLevel('debug');

// Custom error logging
browser.on('error', (error) => {
  console.error('Browser error:', error);
  // Send to error tracking service
});

// Screenshot on error
browser.on('error', async (error) => {
  await browser.screenshot({ path: `error-${Date.now()}.png` });
});
```

## Best Practices

```typescript
// Cleanup resources
try {
  await browser.doSomething();
} catch (error) {
  // Handle error
} finally {
  await browser.close();
}

// Graceful degradation
try {
  await browser.performComplexAction();
} catch (error) {
  // Fall back to simpler approach
  await browser.performSimpleAction();
}
```