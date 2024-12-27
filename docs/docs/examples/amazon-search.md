---
sidebar_position: 2
---

# Amazon Search Example

This example shows how to automate an Amazon product search using browser-use-node.

```typescript
import { BrowserUse } from 'browser-use-node';

async function main() {
  const browser = new BrowserUse();

  try {
    // Navigate to Amazon
    await browser.goto('https://www.amazon.com');

    // Search for a product
    await browser.interact('Search for "wireless headphones"');

    // Filter results
    await browser.interact('Filter by 4 stars and up');

    // Get the first product's details
    const details = await browser.interact('Tell me the name and price of the first product');
    console.log(details);

  } finally {
    await browser.close();
  }
}

main().catch(console.error);
```

## Key Features

- Complex site navigation
- Form interaction
- Filter application
- Data extraction

## Important Notes

- Requires proper error handling
- May need to handle captchas
- Consider rate limiting
- Respect website's terms of service