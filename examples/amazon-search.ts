import { config } from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Agent, Browser } from "../dist";

// Load environment variables
config();

async function main() {
  // Initialize the browser
  const browser = new Browser({
    headless: false,
    disableSecurity: true
  });

  // Create browser context
  const browserContext = await browser.newContext({
    viewport: {
      width: 1280,
      height: 800
    }
  });

  // Initialize the LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0,
  });

  // Create an agent with a specific task
  const agent = new Agent({
    task: "Go to Amazon.com and search for 'mechanical keyboard'. Find a keyboard under $100 with good reviews and extract its details.",
    llm,
    useVision: true,
    browser,
    browserContext, // Pass the browser context
  });

  try {
    const result = await agent.run(5);
    console.log('Task completed:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browserContext.close();
    await browser.close();
  }
}

main().catch(console.error);
