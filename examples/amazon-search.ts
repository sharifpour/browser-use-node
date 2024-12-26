import { ChatOpenAI } from 'langchain/chat_models/openai';
import { Browser } from '../src/browser/browser';
import { BrowserContext } from '../src/browser/context';
import { Controller } from '../src/controller/controller';
import { Agent } from '../src/agent/agent';

async function main() {
	// Initialize OpenAI
	const llm = new ChatOpenAI({
		modelName: 'gpt-4',
		temperature: 0,
		maxTokens: -1
	});

	// Initialize browser components
	const browser = new Browser();
	const context = new BrowserContext(browser);
	const controller = new Controller();

	// Get action descriptions
	const actionDescriptions = controller.getActionDescriptions();

	// Initialize agent
	const agent = new Agent({
		llm,
		task: 'Go to Amazon.com and search for "gaming laptop". Extract the title and price of the first result.',
		actionDescriptions,
		maxSteps: 5,
		maxActionsPerStep: 3,
		maxInputTokens: 128000
	});

	try {
		let state = await context.getState();
		let result = null;

		while (true) {
			// Get next action from agent
			const actions = await agent.getNextAction(state, result);
			console.log('Actions:', actions);

			// Execute actions
			result = await controller.multiAct(actions, context);
			console.log('Result:', result);

			// Update state
			state = await context.getState();

			// Check if we're done
			if (result.some(r => r.is_done)) {
				console.log('Task completed');
				break;
			}
		}
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await browser.close();
	}
}

main().catch(console.error);
