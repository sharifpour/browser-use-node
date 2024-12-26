# Examples

## Basic Examples

### Simple Navigation
```typescript
import { Browser } from 'browser-use-node';

async function simpleNavigation() {
  const browser = new Browser({ headless: true });
  const context = await browser.newContext();
  const page = await context.getPage();

  try {
    await page.goto('https://example.com');
    console.log('Page title:', await page.title());
  } finally {
    await browser.close();
  }
}
```

### Form Submission
```typescript
async function formSubmission() {
  const browser = new Browser({ headless: true });
  const context = await browser.newContext();
  const page = await context.getPage();

  try {
    await page.goto('https://example.com/login');
    await page.type('#username', 'user123');
    await page.type('#password', 'pass123');
    await page.click('#submit');
    await page.waitForNavigation();
  } finally {
    await browser.close();
  }
}
```

## Advanced Examples

### Multi-Tab Operations
```typescript
async function multiTabExample() {
  const browser = new Browser({ headless: true });
  const context = await browser.newContext();

  try {
    // Open first tab
    const page1 = await context.getPage();
    await page1.goto('https://example.com/page1');

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('https://example.com/page2');

    // Switch between tabs
    await page1.bringToFront();
    await page2.bringToFront();
  } finally {
    await browser.close();
  }
}
```

### DOM Observation
```typescript
async function domObservationExample() {
  const browser = new Browser({ headless: true });
  const context = await browser.newContext();
  const page = await context.getPage();
  const domService = new DOMService(page);

  try {
    await domService.startObserving();

    domService.onMutation(event => {
      if (event.type === 'added') {
        console.log('New element added:', event.target);
      }
    });

    await page.goto('https://example.com');
    await page.click('#load-more');
  } finally {
    await domService.cleanup();
    await browser.close();
  }
}
```

### Custom Actions
```typescript
async function customActionsExample() {
  const browser = new Browser({ headless: true });
  const context = await browser.newContext();
  const controller = new Controller();

  try {
    // Register custom action
    controller.registerAction('waitAndClick', async (selector: string) => {
      const page = await context.getPage();
      await page.waitForSelector(selector);
      await page.click(selector);
    });

    // Use custom action
    await controller.executeAction('waitAndClick', '#button');
  } finally {
    await browser.close();
  }
}
```

### Error Handling
```typescript
async function errorHandlingExample() {
  const browser = new Browser({ headless: true });
  const context = await browser.newContext();
  const page = await context.getPage();

  try {
    await page.goto('https://example.com');

    try {
      await page.click('#non-existent', { timeout: 5000 });
    } catch (error) {
      console.error('Element not found:', error);
      // Implement fallback behavior
    }
  } finally {
    await browser.close();
  }
}
```

### Resource Management
```typescript
async function resourceManagementExample() {
  const browser = new Browser({ headless: true });
  const context = await browser.newContext();
  const page = await context.getPage();
  const domService = new DOMService(page);

  try {
    await domService.startObserving();
    await page.goto('https://example.com');

    // Perform operations

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Clean up in reverse order of creation
    await domService.cleanup();
    await context.close();
    await browser.close();
  }
}
```

### Performance Optimization
```typescript
async function performanceExample() {
  const browser = new Browser({
    headless: true,
    timeout: 30000,
    networkIdleTimeout: 5000
  });
  const context = await browser.newContext();
  const page = await context.getPage();

  try {
    // Set default timeout
    page.setDefaultTimeout(10000);

    // Wait for network idle
    await page.goto('https://example.com', {
      waitUntil: 'networkidle'
    });

    // Use efficient selectors
    await page.waitForSelector('[data-testid="button"]');

    // Batch operations
    await Promise.all([
      page.click('#button1'),
      page.click('#button2'),
      page.click('#button3')
    ]);
  } finally {
    await browser.close();
  }
}
``` 