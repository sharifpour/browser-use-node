import { HumanMessage } from '@langchain/core/messages';
import type { BrowserState } from '../../browser/types';
import type { ActionResult, AgentStepInfo } from '../types';

/**
 * Agent message prompt
 */
export class AgentMessagePrompt {
  constructor(
    private readonly state: BrowserState,
    private readonly last_result: ActionResult[] | null = null,
    private readonly include_attributes: string[] = [],
    private readonly max_error_length: number = 400,
    private readonly step_info: AgentStepInfo | null = null
  ) { }

  public get_user_message(): HumanMessage {
    let step_info_description = '';
    if (this.step_info) {
      step_info_description = `Current step: ${this.step_info.step_number + 1}/${this.step_info.max_steps}`;
    }

    const state_description = `
${step_info_description}
Current url: ${this.state.url}
Available tabs:
${this.state.tabs ? this.state.tabs.map(tab => `- ${tab.title} (${tab.url})`).join('\n') : 'No tabs'}
Interactive elements:
${this.state.element_tree ? this.state.element_tree.clickable_elements_to_string(this.include_attributes) : 'No elements'}
        `;

    let content = state_description;

    if (this.last_result) {
      for (let i = 0; i < this.last_result.length; i++) {
        const result = this.last_result[i];
        if (result.extracted_content) {
          content += `\nResult of action ${i + 1}/${this.last_result.length}: ${result.extracted_content}`;
        }
        if (result.error) {
          // only use last characters of error
          const error = result.error.slice(-this.max_error_length);
          content += `\nError of action ${i + 1}/${this.last_result.length}: ...${error}`;
        }
      }
    }

    if (this.state.screenshot) {
      // Format message for vision model
      return new HumanMessage({
        content: [
          { type: 'text', text: content },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${this.state.screenshot}` }
          }
        ]
      });
    }

    return new HumanMessage({ content });
  }
}