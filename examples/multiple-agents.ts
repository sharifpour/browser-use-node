import { Browser } from '../src';
import { Agent } from '../src/agent';
import { ChatOpenAI } from 'langchain/chat_models/openai';

async function main() {
    // Persist the browser state across agents
    const browser = new Browser();
    const context = await browser.newContext();

    try {
        const llm = new ChatOpenAI({
            modelName: 'gpt-4',
            temperature: 0
        });

        // Initialize first agent
        const agent1 = new Agent({
            task: 'Open 2 tabs with wikipedia articles about the history of Meta and one random wikipedia article.',
            llm,
            browserContext: context
        });

        // Initialize second agent
        const agent2 = new Agent({
            task: 'Considering all open tabs give me the names of the wikipedia articles.',
            llm,
            browserContext: context
        });

        // Run agents sequentially
        console.log('Running first agent...');
        await agent1.run();

        console.log('Running second agent...');
        await agent2.run();

    } finally {
        await context.close();
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}