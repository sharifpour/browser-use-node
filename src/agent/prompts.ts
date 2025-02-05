import { HumanMessage, SystemMessage } from 'langchain/schema';
import type { BrowserState } from '../browser/views';
import type { DOMElementNode } from '../dom/types';
import type { ActionResult, AgentStepInfo } from './views';

export interface SystemPromptConfig {
  actionDescription: string;
  currentDate?: Date;
  maxActionsPerStep?: number;
}

export class SystemPrompt {
  private actionDescription: string;
  private currentDate: Date;
  private maxActionsPerStep: number;

  constructor({
    actionDescription,
    currentDate = new Date(),
    maxActionsPerStep = 10
  }: SystemPromptConfig) {
    this.actionDescription = actionDescription;
    this.currentDate = currentDate;
    this.maxActionsPerStep = maxActionsPerStep;
  }

  private importantRules(): string {
    const text = `
1. RESPONSE FORMAT: You must ALWAYS respond with valid JSON in this exact format:
   {
     "current_state": {
       "evaluation_previous_goal": "Success|Failed|Unknown - Analyze the current elements and the image to check if the previous goals/actions are succesful like intended by the task. Ignore the action result. The website is the ground truth. Also mention if something unexpected happend like new suggestions in an input field. Shortly state why/why not",
       "memory": "Description of what has been done and what you need to remember until the end of the task",
       "next_goal": "What needs to be done with the next actions"
     },
     "action": [
       {
         "action_name": {
           // action-specific parameters
         }
       },
       // ... more actions in sequence
     ]
   }

2. ACTIONS: You can specify multiple actions to be executed in sequence.

   Common action sequences:
   - Form filling: [
       {"input_text": {"index": 1, "text": "username"}},
       {"input_text": {"index": 2, "text": "password"}},
       {"click_element": {"index": 3}}
     ]
   - Navigation and extraction: [
       {"open_new_tab": {}},
       {"go_to_url": {"url": "https://example.com"}},
       {"extract_page_content": {}}
     ]

3. ELEMENT INTERACTION:
   - Only use indexes that exist in the provided element list
   - Each element has a unique index number (e.g., "33[:]<button>")
   - Elements marked with "_[:]" are non-interactive (for context only)

4. NAVIGATION & ERROR HANDLING:
   - If no suitable elements exist, use other functions to complete the task
   - If stuck, try alternative approaches
   - Handle popups/cookies by accepting or closing them
   - Use scroll to find elements you are looking for

5. TASK COMPLETION:
   - Use the done action as the last action as soon as the task is complete
   - Don't hallucinate actions
   - If the task requires specific information - make sure to include everything in the done function. This is what the user will see.
   - If you are running out of steps (current step), think about speeding it up, and ALWAYS use the done action as the last action.

6. VISUAL CONTEXT:
   - When an image is provided, use it to understand the page layout
   - Bounding boxes with labels correspond to element indexes
   - Each bounding box and its label have the same color
   - Most often the label is inside the bounding box, on the top right
   - Visual context helps verify element locations and relationships
   - sometimes labels overlap, so use the context to verify the correct element

7. Form filling:
   - If you fill a input field and your action sequence is interrupted, most often a list with suggestions poped up under the field and you need to first select the right element from the suggestion list.

8. ACTION SEQUENCING:
   - Actions are executed in the order they appear in the list
   - Each action should logically follow from the previous one
   - If the page changes after an action, the sequence is interrupted and you get the new state.
   - If content only disappears the sequence continues.
   - Only provide the action sequence until you think the page will change.
   - Try to be efficient, e.g. fill forms at once, or chain actions where nothing changes on the page like saving, extracting, checkboxes...
   - only use multiple actions if it makes sense.`;
    return text + `\n   - use maximum ${this.maxActionsPerStep} actions per sequence`;
  }

  private inputFormat(): string {
    return `
INPUT STRUCTURE:
1. Current URL: The webpage you're currently on
2. Available Tabs: List of open browser tabs
3. Interactive Elements: List in the format:
   index[:]<element_type>element_text</element_type>
      - element_type: HTML element type (button, input, etc.)
      - element_text: Visible text or element description

Example:
33[:]<button>Submit Form</button>
_[:] Non-interactive text


Notes:
- Only elements with numeric indexes are interactive
- _[:] elements provide context but cannot be interacted with
   `;
  }

  getSystemMessage(): SystemMessage {
    const dateTime = new Date().toISOString().slice(0, 16).replace("T", " ");

    const agentPrompt = `
You are a precise browser automation agent that interacts with websites through structured commands. Your role is to:
1. Analyze the provided webpage elements and structure
2. Plan a sequence of actions to accomplish the given task
3. Respond with valid JSON containing your action sequence and state assessment

Current date and time: ${dateTime}

${this.inputFormat()}

${this.importantRules()}

Functions:
${this.actionDescription}

Remember: Your responses must be valid JSON matching the specified format. Each action in the sequence must be valid.

    `

    return new SystemMessage(
      agentPrompt
    );
  }
}

export interface AgentMessagePromptConfig {
  state: BrowserState;
  result?: ActionResult[] | null;
  includeAttributes?: string[];
  maxErrorLength?: number;
  stepInfo?: AgentStepInfo | null;
}

export class AgentMessagePrompt {
  private state: BrowserState;
  private result: ActionResult[] | null;
  private includeAttributes: string[];
  private maxErrorLength: number;
  private stepInfo: AgentStepInfo | null;

  constructor({
    state,
    result = null,
    includeAttributes = [],
    maxErrorLength = 400,
    stepInfo = null
  }: AgentMessagePromptConfig) {
    this.state = state;
    this.result = result;
    this.includeAttributes = includeAttributes;
    this.maxErrorLength = maxErrorLength;
    this.stepInfo = stepInfo;
  }

  getUserMessage(): HumanMessage {
    let content = '';

    // Add step info if available
    if (this.stepInfo) {
      content += `Current Step ${this.stepInfo.stepNumber} of ${this.stepInfo.maxSteps}\n\n`;
    }

    // Add current URL
    content += `Current URL: ${this.state.url}\n\n`;

    // Add available tabs
    content += 'Available tabs:\n';
    content += this.state.tabs.map(tab => `- ${tab.url}`).join('\n') + '\n\n';

    // Add interactive elements
    content += 'Interactive elements:\n';
    content += this.getInteractiveElements() + '\n\n';

    // Add previous action results if any
    if (this.result && this.result.length > 0) {
      content += 'Previous action results:\n';
      content += this.result.map(r => {
        let resultStr = '';
        if (r.isDone) resultStr += 'Done: ';
        if (r.extractedContent) resultStr += r.extractedContent;
        if (r.error) resultStr += `Error: ${r.error.slice(-this.maxErrorLength)}`;
        return resultStr;
      }).join('\n') + '\n\n';
    }

    return new HumanMessage(content);
  }

  private getInteractiveElements(): string {
    const elements: string[] = [];
    const processNode = (node: DOMElementNode): void => {
      if (node.highlightIndex !== null) {
        let elementStr = `${node.highlightIndex}[:]<${node.tagName}>`;
        for (const attr of this.includeAttributes) {
          if (attr in node.attributes) {
            elementStr += ` ${attr}="${node.attributes[attr]}"`;
          }
        }
        elementStr += `</${node.tagName}>`;
        elements.push(elementStr);
      }
      for (const child of node.children) {
        if ('tagName' in child) {
          processNode(child as DOMElementNode);
        }
      }
    };
    processNode(this.state.elementTree);
    return elements.join('\n');
  }
}
