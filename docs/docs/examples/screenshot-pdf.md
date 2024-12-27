---
sidebar_position: 4
---

# Screenshots and PDFs

This example shows how to capture screenshots and generate PDFs using browser-use-node.

## Basic Screenshots

```typescript
import { BrowserUse } from 'browser-use-node';

async function takeScreenshots() {
  const browser = new BrowserUse();

  try {
    await browser.goto('https://example.com');

    // Take a full page screenshot
    await browser.screenshot('full-page.png', {
      fullPage: true
    });

    // Take a screenshot of a specific element
    await browser.screenshot('element.png', {
      selector: '.main-content'
    });

    // Take a screenshot of a specific area
    await browser.screenshot('area.png', {
      clip: {
        x: 100,
        y: 100,
        width: 500,
        height: 500
      }
    });
  } finally {
    await browser.close();
  }
}
```

## Advanced Screenshot Options

```typescript
async function advancedScreenshots() {
  const browser = new BrowserUse();

  try {
    await browser.goto('https://example.com');

    // High-quality screenshot
    await browser.screenshot('high-quality.png', {
      quality: 100,
      fullPage: true,
      type: 'jpeg'
    });

    // Screenshot with custom viewport
    await browser.setViewport(1920, 1080);
    await browser.screenshot('desktop.png');

    // Mobile device screenshot
    await browser.emulate('iPhone 12');
    await browser.screenshot('mobile.png');

    // Screenshot after interaction
    await browser.interact('Click the menu button');
    await browser.screenshot('after-click.png');
  } finally {
    await browser.close();
  }
}
```

## PDF Generation

```typescript
async function generatePdfs() {
  const browser = new BrowserUse();

  try {
    await browser.goto('https://example.com');

    // Generate a basic PDF
    await browser.pdf('basic.pdf');

    // Generate PDF with custom options
    await browser.pdf('custom.pdf', {
      format: 'A4',
      landscape: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      printBackground: true
    });

    // Generate PDF of specific content
    await browser.pdf('article.pdf', {
      selector: 'article',
      scale: 0.8
    });
  } finally {
    await browser.close();
  }
}
```

## Batch Processing

```typescript
async function batchProcess() {
  const browser = new BrowserUse();

  try {
    const urls = [
      'https://example1.com',
      'https://example2.com',
      'https://example3.com'
    ];

    for (const [index, url] of urls.entries()) {
      await browser.goto(url);
      await browser.screenshot(`page-${index}.png`);
      await browser.pdf(`page-${index}.pdf`);
    }
  } finally {
    await browser.close();
  }
}
```

## AI-Assisted Capture

```typescript
async function aiAssistedCapture() {
  const browser = new BrowserUse();

  try {
    await browser.goto('https://example.com');

    // Let AI find and capture important elements
    await browser.interact('Find the main article content');
    await browser.screenshot('article.png', {
      selector: '.article'
    });

    // Generate PDF of relevant content
    await browser.perform('Capture the pricing table as PDF');
    await browser.pdf('pricing.pdf', {
      selector: '.pricing-table'
    });
  } finally {
    await browser.close();
  }
}
```

## Next Steps

- Try the [Multiple Agents Example](./multiple-agents.md)
- Learn about [Web Voyager](./web-voyager.md)
- Explore [Performance Optimization](./performance.md)