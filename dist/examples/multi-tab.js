Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const src_1 = require("../src");
// Load environment variables
(0, dotenv_1.config)();
if (!process.env.OPENAI_API_KEY) {
	throw new Error("OPENAI_API_KEY environment variable is required");
}
async function main() {
	const browser = new src_1.BrowserUse({
		headless: false,
		disableSecurity: true,
		keepOpen: true, // Keep browser open like in the Python example
	});
	try {
		await browser.initialize();
		const task =
			"Go to amazon.com, search for laptop, sort by best rating, and give me the price of the first result";
		const createResult = await browser.createAgent({
			task,
			model: "gpt-4", // Use GPT-4 like in the Python example
		});
		if (createResult.status === "error") {
			throw new Error(`Failed to create agent: ${createResult.message}`);
		}
		const runResult = await browser.runAgent({
			max_steps: 3,
			create_history_gif: true,
		});
		if (runResult.status === "error") {
			throw new Error(`Agent execution failed: ${runResult.message}`);
		}
		console.log("Agent result:", runResult.data);
	} finally {
		await browser.close();
	}
}
main().catch((error) => {
	console.error("Unhandled error:", error);
	process.exit(1);
});
