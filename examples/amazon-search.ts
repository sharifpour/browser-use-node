import { SystemPrompt } from '../src/agent/prompts';
import { Agent } from '../src/agent/service';
import { Controller } from '../src/controller/service';

async function main() {
  const agent = new Agent({
    task: 'Go to google.com, search for Atlantic Wiz band from kiev and give me the names of the members',
    useVision: true,
    saveConversationPath: './tmp',
    maxFailures: 1,
    retryDelay: 1,
    validateOutput: true,
    controller: new Controller(),
    systemPromptClass: SystemPrompt,
    maxInputTokens: 128000,
    includeAttributes: [
      'title',
      'type',
      'name',
      'role',
      'tabindex',
      'aria-label',
      'placeholder',
      'value',
      'alt',
      'aria-expanded'
    ],
    maxErrorLength: 400,
    maxActionsPerStep: 10
  });

  await agent.run();
}

main().catch(console.error);