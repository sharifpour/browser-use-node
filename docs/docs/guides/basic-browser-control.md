---
sidebar_position: 2
---

# Basic Browser Control

This guide covers the fundamental operations for controlling a browser using browser-use-node.

## Browser Instance

Create and manage a browser instance:

```typescript
import { BrowserUse } from 'browser-use-node';

// Create a new browser instance
const browser = new BrowserUse();

// Close the browser when done
await browser.close();
```

## Navigation

Navigate to web pages:

```typescript
// Navigate to a URL
await browser.goto('https://example.com');

// Wait for navigation to complete
await browser.waitForLoad();

// Get the current URL
const currentUrl = await browser.getCurrentUrl();
```

## Page Interactions

Interact with page elements:

```typescript
// Click elements
await browser.click('button.submit');

// Type text
await browser.type('input#search', 'search query');

// Get text content
const text = await browser.getText('h1');

// Check if element exists
const exists = await browser.exists('.my-element');
```

## AI-Assisted Interactions

Use AI to interact with the page:

```typescript
// Let AI find and interact with elements
await browser.interact('Click the login button');

// Ask AI to extract information
const data = await browser.extract('Get the main heading text');

// Let AI perform complex tasks
await browser.perform('Fill out the contact form with my information');
```

## Screenshots and PDFs

Capture page content:

```typescript
// Take a screenshot
await browser.screenshot('screenshot.png');

// Generate PDF
await browser.pdf('page.pdf');
```

## Error Handling

Handle common scenarios:

```typescript
try {
  await browser.goto('https://example.com');
  await browser.interact('Click the non-existent button');
} catch (error) {
  console.error('Failed to interact:', error);
}
```

## Next Steps

- Learn about [Working with Pages](./working-with-pages.md)
- See [AI Interactions](./ai-interactions.md) for more advanced AI features
- Check out [Error Handling](./error-handling.md) for robust automation