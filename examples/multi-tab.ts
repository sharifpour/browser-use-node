import { config } from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Agent } from "../dist";

// Load environment variables
config();

async function main() {
	// Initialize the LLM
	const llm = new ChatOpenAI({
    modelName: "gpt-4",
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
    useVision: true
	});

	try {
    // Run the agent with maxSteps
    const result = await agent.run(8);
    console.log('Task completed:', result);
	} catch (error) {
    console.error('Error:', error);
	}
}

// Run the example
main().catch(console.error);
