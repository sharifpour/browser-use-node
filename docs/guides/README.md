# User Guide

## Getting Started

### Installation
```bash
npm install browser-use-node
```

### Basic Setup
```typescript
import { Browser } from 'browser-use-node';

const browser = new Browser({
  headless: true,
  disableSecurity: false
});
```

### Creating a Context
```typescript
const context = await browser.newContext();
const page = await context.getPage();
```

## Common Use Cases

### Navigation
```typescript
await page.goto('https://example.com');
```

### Clicking Elements
```typescript
await page.click('#submit-button');
```

### Form Interaction
```typescript
await page.type('#username', 'user123');
await page.type('#password', 'pass123');
await page.click('#login-button');
```

### Waiting for Elements
```typescript
await page.waitForSelector('.content');
```

### Handling Multiple Tabs
```typescript
const newPage = await context.newPage();
await newPage.goto('https://example.com/new-tab');
```

## Advanced Features

### DOM Observation
```typescript
const domService = new DOMService(page);
await domService.startObserving();

domService.onMutation(event => {
  console.log('DOM changed:', event);
});
```

### Custom Actions
```typescript
const controller = new Controller();

controller.registerAction('customClick', async (selector: string) => {
  // Custom click implementation
});
```

### Error Handling
```typescript
try {
  await page.click('#non-existent');
} catch (error) {
  console.error('Element not found:', error);
}
```

### Resource Cleanup
```typescript
// Always clean up resources
await domService.cleanup();
await context.close();
await browser.close();
```

## Best Practices

1. **Resource Management**
   - Always clean up resources after use
   - Use try/finally blocks for cleanup
   - Close browser contexts when done

2. **Error Handling**
   - Implement proper error handling
   - Use try/catch blocks for actions
   - Log errors appropriately

3. **Performance**
   - Minimize DOM queries
   - Use efficient selectors
   - Clean up observers when not needed

4. **Security**
   - Validate user input
   - Handle sensitive data securely
   - Use secure context options

## Troubleshooting

### Common Issues

1. **Element Not Found**
   - Check selector syntax
   - Ensure element exists
   - Wait for element to be visible

2. **Timeout Errors**
   - Increase timeout values
   - Check network conditions
   - Verify page load state

3. **Memory Leaks**
   - Clean up resources properly
   - Close unused contexts
   - Stop observers when done

### Debugging Tips

1. **Enable Logging**
   ```typescript
   const browser = new Browser({
     headless: false,
     log: true
   });
   ```

2. **Use Debug Mode**
   ```typescript
   process.env.DEBUG = 'browser-use:*';
   ```

3. **Inspect Elements**
   ```typescript
   const element = await page.$('#target');
   console.log(await element.boundingBox());
   ```