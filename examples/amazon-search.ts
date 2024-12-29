import { Agent } from '../src/agent/service';

async function main() {


  const agent = new Agent({
    task: 'Go to google.com, search for Atlantic Wiz band from kiev and give me the names of the members',
    validate_output: true,
    max_failures: 1,
    retry_delay: 1,
    save_conversation_path: './tmp'
  });

  await agent.run();
}

main().catch(console.error);