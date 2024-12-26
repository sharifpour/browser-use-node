import { config } from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import type { BrowserContext } from "../dist";
import { Agent, Browser } from "../dist";

// Load environment variables
config();

async function main() {
  let browser: Browser | null = null;
  let browserContext: BrowserContext | null = null;

  try {
    console.log('🚀 Starting browser...');
    browser = new Browser({
      headless: true
    });

    console.log('🌐 Creating browser context...');
    browserContext = await browser.newContext({
      viewport: {
        width: 1280,
        height: 800
      },
      recordVideo: true,
      recordVideoPath: 'videos',
      recordVideoSize: {
        width: 1280,
        height: 800
      },
      // minimumWaitPageLoadTime: 2.0,
      // waitForNetworkIdlePageLoadTime: 5.0,
      // maximumWaitPageLoadTime: 30.0,
      // waitBetweenActions: 2.0
    });

    console.log('🤖 Initializing LLM...');
    const llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0,
      maxTokens: 256,
      maxRetries: 3,
      maxConcurrency: 1
    });

    console.log('🎯 Creating agent...');
    const agent = new Agent({
      task: 'Compare the weather between Kyiv and Lviv. Use duckduckgo',
      llm,
      useVision: false,
      browser,
      browserContext,
    });

    console.log('▶️  Running agent...');
    const result = await agent.run(10);

    // Format the output nicely
    console.log('\n📊 Task Results:');
    console.log('================');
    if (result.current_state?.memory) {
      console.log(result.current_state.memory);
    }
    if (result.action?.[0]?.done?.data) {
      console.log('\n📝 Details:');
      console.log(result.action[0].done.data);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    console.log('\n🧹 Cleaning up...');
    if (browserContext) await browserContext.close();
    if (browser) await browser.close();
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled rejection:', error);
  process.exit(1);
});

main();
