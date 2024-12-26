# browser-use-node

Browser automation powered by LLMs in JavaScript/TypeScript.

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

```bash
npm install browser-use-node
```

### Requirements

- Node.js >= 18.0.0
- npm or yarn
- OpenAI API key

### Setting Up Your OpenAI API Key

There are several ways to configure your OpenAI API key:

1. Using environment variables directly:
```bash
export OPENAI_API_KEY=your_api_key_here
```

2. Using a `.env` file:
```bash
# Create a .env file in your project root
echo "OPENAI_API_KEY=your_api_key_here" > .env

# Install dotenv if you haven't already
npm install dotenv

# In your code
import * as dotenv from 'dotenv';
dotenv.config();
```

3. Using environment variables in Windows:
```cmd
set OPENAI_API_KEY=your_api_key_here
```

4. Passing the API key directly in code (not recommended for production):
```typescript
const llm = new ChatOpenAI({
  modelName: "gpt-4",
  openAIApiKey: "your_api_key_here", // Not recommended for production
  maxTokens: 500,
  temperature: 0,
});
```

> ⚠️ **Security Note**: Never commit your API key to version control. Always use environment variables or secure secret management in production.

## Quick Start

First, make sure to set up your OpenAI API key in your environment variables:

```bash
export OPENAI_API_KEY=your_api_key_here
```

Then, create a simple browser automation script:

```typescript
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Agent } from "browser-use-node";

async function main() {
  // Initialize the LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    openAIApiKey: process.env.OPENAI_API_KEY,
    maxTokens: 500,
    temperature: 0,
  });

  // Create and run the agent
  const agent = new Agent({
    task: "Search for a product on Amazon",
    llm,
  });

  try {
    const result = await agent.run(5); // Allow up to 5 steps for the operation
    console.log("Agent result:", result);
  } catch (error) {
    console.error("Error running agent:", error);
  }
}

main().catch(console.error);
```

This example demonstrates how to:
1. Set up the LLM (GPT-4 in this case)
2. Create an Agent with a specific task
3. Run the agent and handle the results

## Examples

The library comes with several example scripts that demonstrate its capabilities:

1. Amazon Search Example:
```bash
npm run example:amazon
```

2. Multi-tab Operations:
```bash
npm run example:multi-tab
```

## API Documentation

Coming soon...

## Development

To set up the development environment:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Lint the code
npm run lint

# Format the code
npm run format
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

