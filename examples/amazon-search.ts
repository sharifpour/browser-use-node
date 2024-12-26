import { config } from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Agent, Browser } from "../dist";

// Load environment variables
config();

async function main() {
  // Initialize the browser
  const browser = new Browser({
    headless: false,
    extraChromiumArgs: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--disable-blink-features=AutomationControlled',
      '--disable-blink-features=AutomationControlled',
      '--disable-blink-features=AutomationControlled',
    ]
  });
  // Create browser context
  const browserContext = await browser.newContext({
    viewport: {
      width: 1280,
      height: 800
    },
    minimumWaitPageLoadTime: 0.1,
    waitForNetworkIdlePageLoadTime: 0.2,
    maximumWaitPageLoadTime: 1.0,
    waitBetweenActions: 0.1,
    recordWalkthrough: true,
    walkthroughPath: './walkthrough.gif',
    walkthroughDelay: 1000
  });


  // Initialize the LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.1,
    maxTokens: 1000,
    maxRetries: 3,
    maxConcurrency: 10
  });

  // Create an agent with a specific task
  const agent = new Agent({
    task: "Go to Amazon.com and search for 'mechanical keyboard'. Find a keyboard under $100 with good reviews and extract its details.",
    llm,
    useVision: false,
    browser,
    browserContext, // Pass the browser context
  });

  try {
    console.log('Running agent...');
    const result = await agent.run(5);
    console.log('Task completed:', result);

    // Save walkthrough before closing
    console.log('Saving walkthrough...');
    await browserContext.saveWalkthrough();
    await browserContext.close();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browserContext.close();
    await browser.close();
  }
}

main().catch(console.error);
