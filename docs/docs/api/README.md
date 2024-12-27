**browser-use-node**

***

# browser-use-node

Browser automation powered by LLMs in JavaScript/TypeScript.

> # ⚠️ IMPORTANT NOTE ⚠️
> This library is currently under heavy development and **NOT READY FOR PRODUCTION USE**.
> The API is unstable and subject to major changes.
>
> If you'd like to help develop this library, please check out [port-diff.md](_media/port-diff.md) which outlines the current development priorities and areas where help is needed.

## Overview

`browser-use-node` is a powerful library that combines browser automation capabilities with Large Language Models (LLMs) to create intelligent browser interactions. Built on top of Playwright and LangChain, it provides a seamless way to automate browser tasks with AI assistance.

This is a JavaScript/TypeScript port of the original [browser-use](https://github.com/browser-use/browser-use) Python library.

## Credits

This project is based on [browser-use](https://github.com/browser-use/browser-use), originally created by:
- [Shroominic](https://github.com/Shroominic)
- [LangChain](https://github.com/langchain-ai)

We are grateful for their pioneering work in browser automation with LLMs.

## Features

- LLM-powered browser automation
- Multi-tab support
- Built on reliable technologies (Playwright, LangChain)
- TypeScript support
- Modern async/await API

## Installation

> ⚠️ Note: These instructions are for development purposes only. The library is not yet ready for production use.

### NPM Package (Experimental)
The package is available on npm for experimental purposes:
```bash
# ⚠️ Not recommended for production use
npm install browser-use-node
```
> Note: While the package is available on npm as `browser-use-node`, it's currently intended for exploration only. The API is unstable and will undergo significant changes. For development and contributions, please use the development setup below.

## Development Setup

### Prerequisites
- [Bun](https://bun.sh) (Required for development)
- A modern browser (Chrome/Firefox/Edge)

### Installation Steps
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
   Edit `.env` and add your API keys and configuration:
   - `OPENAI_API_KEY` - Required for LLM functionality
   - Other configuration options as needed

### Running Examples
The `examples/` directory contains sample scripts demonstrating various features:

```bash
bun run examples/amazon-search.ts
```

## Testing During Development

> ⚠️ These are development tests. The test suite is still being expanded.

### Running Tests
```bash
# Run all tests
bun test

# Run specific test suite
bun test --grep "Browser"

# Run tests in watch mode
bun test --watch
```

### Writing Tests
When contributing new features or fixes:
1. Add tests in the `tests/` directory
2. Follow the existing test patterns
3. Include both unit and integration tests where applicable
4. Use the provided test utilities in `tests/utils/`

### Debugging
For development debugging:
1. Use the `DEBUG` environment variable:
   ```bash
   DEBUG=browser-use* bun test
   ```
2. Chrome DevTools are available when running browser tests
3. VSCode launch configurations are provided in `.vscode/launch.json`

### Performance Notes
Bun is used as the primary runtime because it provides:
- Faster dependency installation
- Quicker test execution
- Better TypeScript performance
- Improved overall development experience
- Native test runner with better performance
- Built-in TypeScript support
- Ability to build as a native binary or jsc bytecode which is a huge performance boost

## Build and Development Scripts

### Available Scripts
```bash
# Building
bun run build           # Build the project
bun run build:binary    # Build as native binary
bun run build:examples  # Build example files
bun run clean          # Clean build artifacts

# Development
bun run type-check     # Run TypeScript type checking
bun run format         # Format code with Prettier
bun run lint           # Run ESLint

# Examples
bun run example:amazon     # Run Amazon search example
bun run example:multi-tab  # Run multi-tab example
bun run example:simple     # Run simple example

# Testing
bun run test           # Run all tests
bun run test:smoke     # Run smoke tests
```

### Build Outputs
The project generates these outputs in the `dist` directory:
- Main bundle (target: bun)
- TypeScript declaration files
- Example builds
- Native binary (experimental)

### Development Workflow
1. Start with an example:
   ```bash
   bun run example:simple
   ```
   This helps verify your setup is working.

2. Before committing:
   ```bash
   bun run type-check  # Check types
   bun run format      # Format code
   bun run lint        # Check for issues
   bun run test        # Run tests
   ```

### Environment Configuration
The project supports various environment configurations:

```env
# Required
OPENAI_API_KEY=your_key_here

# Optional
DEBUG=browser-use*           # Enable debug logging
HEADLESS=false             # Run browsers in headed mode
```

### IDE Setup
For the best development experience:

1. VSCode Extensions:
   - ESLint
   - Prettier
   - TypeScript and JavaScript
   - Playwright Test for VSCode

2. Recommended VSCode settings are provided in `.vscode/settings.json`

### Debugging Tips
1. Browser Debugging:
   ```bash
   # Run with browser debugging enabled
   DEBUG=browser-use* HEADLESS=false bun run example:simple
   ```

2. Test Debugging:
   ```bash
   # Run tests with debug output
   DEBUG=browser-use* bun test
   ```

### Performance Optimization
- Use the `build:binary` option for maximum performance and maximum risks

## Documentation

The project uses [Docusaurus](https://docusaurus.io/) for documentation and [TypeDoc](https://typedoc.org/) for API reference.

### Running Documentation Locally
```bash
# Start development server
bun run docs:dev

# Build documentation
bun run docs:build

# Serve built documentation
bun run docs:serve

# Generate API documentation
bun run docs:generate-api
```

### Documentation Structure
- `/docs/` - Main documentation site
  - `/docs/intro` - Getting started guide
  - `/docs/guides` - Usage guides and tutorials
  - `/docs/api` - Auto-generated API documentation
  - `/docs/examples` - Example usage and code snippets

### Contributing to Documentation
1. Documentation source files are in Markdown format
2. API documentation is generated from TypeScript source code comments
3. Examples should include both code and explanation
4. Follow the [documentation style guide](./docs/contributing/documentation.md)

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](_media/CONTRIBUTING.md) for details on how to get started and our development process. By participating in this project, you agree to abide by our [Code of Conduct](_media/CODE_OF_CONDUCT.md).

## Security

We take security seriously. If you discover a security vulnerability, please follow our [Security Policy](_media/SECURITY.md) for responsible disclosure.
