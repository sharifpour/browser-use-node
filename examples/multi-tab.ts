import { config } from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Agent } from "../dist";

// Load environment variables
config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
	throw new Error("OPENAI_API_KEY environment variable is required");
}

async function main() {
	// Initialize the LLM
	const llm = new ChatOpenAI({
		modelName: "gpt-4o",
		openAIApiKey: OPENAI_API_KEY,
    maxTokens: 500,
		temperature: 0,
	});

	// Create and run the agent
	const agent = new Agent({
		task: "Search Ukraine in Google",
		llm,
	});

	try {
		const result = await agent.run(5); // Allow more steps for multi-tab operations
		console.log("Agent result:", result);
	} catch (error) {
		console.error("Error running agent:", error);
	}
}

// Run the example
main().catch((error) => {
	console.error("Unhandled error:", error);
	process.exit(1);
});
