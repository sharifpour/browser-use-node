import { config } from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Agent, Browser } from "../dist";

// Load environment variables
config();

async function main() {
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
  const browserContext = await browser.newContext({
    viewport: {
      width: 1280,
      height: 800
    },
    minimumWaitPageLoadTime: 0.1,
    waitForNetworkIdlePageLoadTime: 0.2,
    maximumWaitPageLoadTime: 1.0,
    waitBetweenActions: 0.1,

  });
	// Initialize the LLM
	const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
		temperature: 0,
	});

  // Create an agent with a multi-tab task
	const agent = new Agent({
    task: `
			1. Open Amazon.com and search for 'gaming mouse'
			2. In a new tab, open BestBuy.com and search for the same product
			3. Compare prices and reviews of similar models
			4. Find the best deal between the two sites
		`,
		llm,
    useVision: false
	});

	try {
    // Run the agent with maxSteps
    const result = await agent.run(20);
    console.log('Task completed:', result);
	} catch (error) {
    console.error('Error:', error);
	}
}

// Run the example
main().catch(console.error);
