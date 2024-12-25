import { config } from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Agent, Browser } from "../dist";

// Load environment variables
config();

async function main() {
  console.log('Starting browser...');
  const browser = new Browser({
    headless: false,
    disableSecurity: true
  });

  console.log('Creating browser context...');
  const browserContext = await browser.newContext({
    viewport: {
      width: 1280,
      height: 800
    }
  });

  console.log('Initializing LLM...');
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  console.log('Creating agent...');
  const agent = new Agent({
    task: "Go to google.com and search for 'weather today'",
    llm,
    useVision: true,
    browser,
    browserContext,
  });

  try {
    console.log('Running agent...');
    const result = await agent.run(3);
    console.log('Task completed:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('Cleaning up...');
    await browserContext.close();
    await browser.close();
  }
}

main().catch(console.error);
