import { ChatOpenAI } from '@langchain/openai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Agent } from '../src/agent';

// Load API key directly from .env file
const envFile = fs.readFileSync('.env', 'utf8');
const apiKeyMatch = envFile.match(/OPENAI_API_KEY="([^"]+)"/);

if (!apiKeyMatch) {
  throw new Error('OPENAI_API_KEY not found in .env file');
}

const apiKey = apiKeyMatch[1];

// Ensure results directory exists
const resultsDir = path.join(process.cwd(), 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

let currentAgent: Agent | null = null;

async function cleanup() {
  if (currentAgent) {
    await currentAgent.cleanup();
    currentAgent = null;
  }
}

async function main() {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    openAIApiKey: apiKey,
    temperature: 0,
    maxTokens: 1000
  });

  currentAgent = new Agent({
    task: 'Go to google.com, search for Atlantic Wiz band from kiev and give me the names of the members',
    llm,
    max_actions_per_step: 3,
    max_failures: 3,
    retry_delay: 5,
    save_conversation_path: path.join(resultsDir, `amazon-search-${Date.now()}.json`)
  });

  try {
    // Set a timeout of 2 minutes
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Task timed out after 2 minutes')), 120000);
    });

    await Promise.race([currentAgent.run(), timeout]);
  } catch (error) {
    console.error('Task failed:', error);
  } finally {
    await cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  await cleanup();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('Uncaught error:', error);
  await cleanup();
  process.exit(1);
});

main().catch(async (error) => {
  console.error('Fatal error:', error);
  await cleanup();
  process.exit(1);
});