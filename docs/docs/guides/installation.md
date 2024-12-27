---
sidebar_position: 1
---

# Installation Guide

This guide will walk you through the process of installing and setting up browser-use-node in your project.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Bun](https://bun.sh) (Required for development)
- A modern browser (Chrome/Firefox/Edge)
- OpenAI API key

## Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/browser-use/browser-use-node.git
cd browser-use-node
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=your_api_key_here
```

## Verifying Installation

To verify your installation:

1. Run the tests:
```bash
bun test
```

2. Try a simple example:
```typescript
import { BrowserUse } from 'browser-use-node';

async function main() {
  const browser = new BrowserUse();
  await browser.goto('https://example.com');
  await browser.close();
}

main().catch(console.error);
```

## Next Steps

- Learn about [Basic Browser Control](./basic-browser-control.md)
- Check out our [Examples](../examples/index.md)
- Read the [API Reference](../api/index.md) 