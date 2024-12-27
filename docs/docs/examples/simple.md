---
sidebar_position: 1
---

# Simple Example

This example demonstrates basic usage of browser-use-node for a simple web interaction.

## Basic Navigation

```typescript
import { BrowserUse } from 'browser-use-node';

async function main() {
  // Create a new browser instance
  const browser = new BrowserUse();

  try {
    // Navigate to a website
    await browser.goto('https://example.com');

    // Let AI read and describe the page
    const description = await browser.extract('Describe the main content of this page');
    console.log('Page description:', description);

    // Interact with the page using AI
    await browser.interact('Click on the first link you find');

    // Take a screenshot of the result
    await browser.screenshot('result.png');
  } finally {
    // Always close the browser
    await browser.close();
  }
}

main().catch(console.error);
```

## Explanation

This example shows:
1. Creating a browser instance
2. Navigating to a webpage
3. Using AI to extract information
4. Performing AI-guided interactions
5. Capturing screenshots
6. Proper cleanup with error handling

## Running the Example

1. Ensure you have set up your environment variables:
```bash
OPENAI_API_KEY=your_api_key_here
```

2. Save the code in a file (e.g., `simple.ts`)

3. Run with Bun:
```bash
bun run simple.ts
```

## Next Steps

- Try the [Multi-Tab Example](./multi-tab.md) for more complex scenarios
- Learn about [Network Interception](./network-interception.md)
- See how to handle [Screenshots and PDFs](./screenshot-pdf.md)