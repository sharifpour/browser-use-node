import { Browser } from '../src';
import { Agent } from '../src/agent';
import { ChatOpenAI } from 'langchain/chat_models/openai';

// Example tasks
const TASKS = {
    FLIGHT_SEARCH: `Find the lowest-priced one-way flight from Cairo to Montreal on February 21, 2025, including the total travel time and number of stops. on https://www.google.com/travel/flights/`,
    COURSE_SEARCH: `Browse Coursera, which universities offer Master of Advanced Study in Engineering degrees? Tell me what is the latest application deadline for this degree? on https://www.coursera.org/`,
    HOTEL_SEARCH: `Find and book a hotel in Paris with suitable accommodations for a family of four (two adults and two children) offering free cancellation for the dates of February 14-21, 2025. on https://www.booking.com/`
};

async function main() {
    const browser = new Browser({
        headless: false,
        disableSecurity: true,
        newContextConfig: {
            disableSecurity: true,
            minimumWaitPageLoadTime: 1000,
            maximumWaitPageLoadTime: 10000,
            browserWindowSize: {
                width: 1280,
                height: 1100
            }
        }
    });

    const llm = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature: 0
    });

    const agent = new Agent({
        task: TASKS.HOTEL_SEARCH, // Choose which task to run
        llm,
        browser,
        validateOutput: true
    });

    try {
        const history = await agent.run(50); // Max 50 steps

        // Save history to file
        const fs = require('node:fs');
        const path = require('node:path');
        const historyDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(historyDir)) {
            fs.mkdirSync(historyDir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(historyDir, 'history.json'),
            JSON.stringify(history, null, 2)
        );
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}