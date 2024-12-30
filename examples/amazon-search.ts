import { Agent } from '../src/agent/service';

async function main() {
  const agent = new Agent({
    task: 'Go to google.com, search for "Kiev, Ukraine"',
    useVision: true,
    maxInputTokens: 1000,
    maxErrorLength: 400,
  });

  await agent.run();
}

main().catch(console.error);