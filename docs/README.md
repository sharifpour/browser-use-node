# Browser Use Node Documentation

Welcome to the Browser Use Node documentation! This library provides powerful browser automation capabilities powered by LLMs.

## Table of Contents

### [API Documentation](api/README.md)
- Core Classes
- Actions
- Events
- Types

### [User Guide](guides/README.md)
- Getting Started
- Common Use Cases
- Advanced Features
- Best Practices
- Troubleshooting

### [Examples](examples/README.md)
- Basic Examples
- Advanced Examples
- Performance Examples

## Quick Start

### Installation
```bash
npm install browser-use-node
```

### Basic Usage
```typescript
import { Browser } from 'browser-use-node';

async function example() {
  const browser = new Browser({ headless: true });
  const context = await browser.newContext();
  const page = await context.getPage();

  try {
    await page.goto('https://example.com');
    await page.click('#button');
  } finally {
    await browser.close();
  }
}
```

## Features

- LLM-powered browser automation
- Multi-tab support
- Built on reliable technologies (Playwright, LangChain)
- TypeScript support
- Modern async/await API

## Contributing

Please see our [Contributing Guide](../CONTRIBUTING.md) for details on how to:
- Set up the development environment
- Run tests
- Submit pull requests
- Add new features

## Support

- [GitHub Issues](https://github.com/browser-use/browser-use-node/issues)
- [Discord Community](https://link.browser-use.com/discord)

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.