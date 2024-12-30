import { Agent } from '../src/agent/service';

async function main() {
  const agent = new Agent({
    task: 'Go to google.com, search for "Kiev, Ukraine" and click the first result, then print the page title',
    useVision: true,
    maxInputTokens: 1000,
    maxErrorLength: 400,
  });

  await agent.run();
}

main().catch(console.error);