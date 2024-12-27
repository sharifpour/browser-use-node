---
sidebar_position: 3
---

# Working with Pages

This guide covers how to work with browser pages in browser-use-node.

## Opening and Closing Pages

```typescript
const browser = new BrowserUse();

// Open a new page
await browser.newPage();

// Close the current page
await browser.closePage();
```

## Navigation

```typescript
// Navigate to a URL
await browser.goto('https://example.com');

// Wait for navigation to complete
await browser.waitForNavigation();
```

## Page Interactions

```typescript
// Click elements
await browser.click('button');

// Type text
await browser.type('input', 'Hello World');

// Get page content
const content = await browser.getContent();
```

## Multiple Pages

```typescript
// Open multiple pages
const page1 = await browser.newPage();
const page2 = await browser.newPage();

// Switch between pages
await browser.switchToPage(0); // Switch to first page
await browser.switchToPage(1); // Switch to second page
```

## Page Events

```typescript
// Listen for page events
browser.on('load', () => {
  console.log('Page loaded');
});

browser.on('console', (msg) => {
  console.log('Console message:', msg);
});
```

## Error Handling

```typescript
try {
  await browser.goto('https://example.com');
} catch (error) {
  console.error('Navigation failed:', error);
}
```