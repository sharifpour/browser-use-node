---
sidebar_position: 2
---

# Multi-Tab Example

This example shows how to work with multiple browser tabs using browser-use-node.

## Working with Multiple Tabs

```typescript
import { BrowserUse } from 'browser-use-node';

async function main() {
  const browser = new BrowserUse();

  try {
    // Open first tab and navigate
    await browser.goto('https://example.com');

    // Open a new tab
    const tab2 = await browser.newTab();
    await tab2.goto('https://another-example.com');

    // Switch between tabs
    await browser.switchToTab(0); // Switch to first tab
    await browser.interact('Click the about link');

    await browser.switchToTab(1); // Switch to second tab
    await browser.interact('Find and click the contact button');

    // Extract information from both tabs
    await browser.switchToTab(0);
    const tab1Info = await browser.extract('Get the main heading');

    await browser.switchToTab(1);
    const tab2Info = await browser.extract('Get the contact information');

    console.log('Tab 1:', tab1Info);
    console.log('Tab 2:', tab2Info);

    // Take screenshots of both tabs
    await browser.switchToTab(0);
    await browser.screenshot('tab1.png');

    await browser.switchToTab(1);
    await browser.screenshot('tab2.png');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
```

## Key Features

This example demonstrates:
- Opening multiple tabs
- Switching between tabs
- Performing actions in different tabs
- Extracting information from multiple tabs
- Taking screenshots of different tabs

## Advanced Usage

You can also perform parallel operations:

```typescript
async function parallelExample() {
  const browser = new BrowserUse();

  try {
    // Open multiple tabs
    const tabs = await Promise.all([
      browser.goto('https://example1.com'),
      browser.newTab().then(tab => tab.goto('https://example2.com')),
      browser.newTab().then(tab => tab.goto('https://example3.com'))
    ]);

    // Perform parallel operations
    const results = await Promise.all(tabs.map((tab, index) =>
      browser.switchToTab(index).then(() =>
        browser.extract('Get the page title')
      )
    ));

    console.log('Results:', results);
  } finally {
    await browser.close();
  }
}
```

## Error Handling

Always handle tab-related errors:

```typescript
try {
  await browser.switchToTab(999); // Invalid tab index
} catch (error) {
  console.error('Failed to switch tabs:', error);
}
```

## Next Steps

- Check out [Network Interception](./network-interception.md)
- Learn about [Screenshots and PDFs](./screenshot-pdf.md)
- See the [Web Voyager Example](./web-voyager.md) for advanced navigation