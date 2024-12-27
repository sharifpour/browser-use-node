---
sidebar_position: 3
---

# Network Interception

This example demonstrates how to intercept and modify network requests using browser-use-node.

## Basic Request Interception

```typescript
import { BrowserUse } from 'browser-use-node';

async function main() {
  const browser = new BrowserUse();

  try {
    // Set up request interception
    await browser.interceptRequests(async (request) => {
      // Log all requests
      console.log(`${request.method()} ${request.url()}`);

      // Continue with the request
      await request.continue();
    });

    // Navigate to a page
    await browser.goto('https://example.com');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
```

## Modifying Requests

```typescript
async function modifyRequests() {
  const browser = new BrowserUse();

  try {
    // Modify specific requests
    await browser.interceptRequests(async (request) => {
      if (request.resourceType() === 'image') {
        // Block image loading
        await request.abort();
      } else if (request.url().includes('api')) {
        // Modify API requests
        const headers = request.headers();
        headers['custom-header'] = 'modified';
        await request.continue({ headers });
      } else {
        // Continue other requests normally
        await request.continue();
      }
    });

    await browser.goto('https://example.com');
  } finally {
    await browser.close();
  }
}
```

## Response Modification

```typescript
async function modifyResponses() {
  const browser = new BrowserUse();

  try {
    // Modify responses
    await browser.interceptResponses(async (response) => {
      if (response.url().includes('api/data')) {
        const originalJson = await response.json();
        const modifiedJson = {
          ...originalJson,
          modified: true
        };
        return modifiedJson;
      }
      return response;
    });

    await browser.goto('https://example.com');
  } finally {
    await browser.close();
  }
}
```

## Mock API Responses

```typescript
async function mockApi() {
  const browser = new BrowserUse();

  try {
    // Mock API responses
    await browser.mockRoute('**/api/data', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Mocked response',
          data: [1, 2, 3]
        })
      });
    });

    await browser.goto('https://example.com');
  } finally {
    await browser.close();
  }
}
```

## Error Simulation

```typescript
async function simulateErrors() {
  const browser = new BrowserUse();

  try {
    // Simulate network errors
    await browser.interceptRequests(async (request) => {
      if (request.url().includes('api/critical')) {
        await request.abort('failed'); // Simulate network failure
      } else if (request.url().includes('api/timeout')) {
        await new Promise(resolve => setTimeout(resolve, 30000)); // Simulate timeout
        await request.continue();
      } else {
        await request.continue();
      }
    });

    await browser.goto('https://example.com');
  } finally {
    await browser.close();
  }
}
```

## Next Steps

- Learn about [Screenshots and PDFs](./screenshot-pdf.md)
- Try the [Multiple Agents Example](./multiple-agents.md)
- Explore [Performance Optimization](./performance.md)