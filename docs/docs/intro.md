---
sidebar_position: 1
slug: /
---

# Getting Started with browser-use-node

> ⚠️ **Development Status**: This library is currently under heavy development and not ready for production use.
> The API is unstable and subject to major changes.

## What is browser-use-node?

`browser-use-node` is a powerful library that combines browser automation capabilities with Large Language Models (LLMs) to create intelligent browser interactions. Built on top of Playwright and LangChain, it provides a seamless way to automate browser tasks with AI assistance.

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) (Required for development)
- A modern browser (Chrome/Firefox/Edge)
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/browser-use/browser-use-node.git
cd browser-use-node

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### Running Your First Example

```typescript
import { BrowserUse } from 'browser-use-node';

async function main() {
  const browser = new BrowserUse();

  // Navigate to a website
  await browser.goto('https://example.com');

  // Let the AI interact with the page
  await browser.interact('Click on the first link you find');

  await browser.close();
}

main().catch(console.error);
```

## Next Steps

- Check out our [Guides](./guides/index.md) for detailed usage instructions
- See [Examples](./examples/index.md) for more complex scenarios
- Read the [API Reference](./api/globals.md) for detailed documentation
- Learn how to [Contribute](./contributing/index.md) to the project
