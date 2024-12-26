import { Browser } from '../src';
import { Agent } from '../src/agent';
import { ChatOpenAI } from 'langchain/chat_models/openai';

async function main() {
    const browser = new Browser({
        headless: false
    });

    const llm = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature: 0
    });

    const agent = new Agent({
        task: "Navigate to 'https://en.wikipedia.org/wiki/Internet' and scroll down to find the section about 'The vast majority of computer'",
        llm,
        browser
    });

    try {
        await agent.run();
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}