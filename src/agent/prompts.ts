// Python source reference:
// """
// Agent prompts.
// """
//
// from dataclasses import dataclass
// from typing import Optional
//
// from langchain_core.messages import HumanMessage
//
// from browser_use.agent.views import ActionResult, AgentStepInfo
// from browser_use.browser.views import BrowserState
//
//
// @dataclass
// class SystemPrompt:
// 	"""System prompt for agent."""
//
// 	task: str
// 	action_descriptions: str
// 	max_actions_per_step: int
//
// 	def get_prompt(self) -> str:
// 		"""Get prompt."""
// 		return f"""You are a browser automation agent. Your task is to: {self.task}
//
// You can use the following actions to interact with the browser:
// {self.action_descriptions}
//
// You can use up to {self.max_actions_per_step} actions per step.
//
// You should return a JSON object with the following structure:
// {{
// 	"current_state": {{
// 		"evaluation_previous_goal": "Evaluation of the previous goal. If this is the first step, just say 'First step'.",
// 		"memory": "Memory of what happened in the previous steps. If this is the first step, just say 'First step'.",
// 		"next_goal": "Next goal to achieve. This should be a clear and concise description of what you want to do next."
// 	}},
// 	"action": [
// 		{{
// 			"action_name": "action_parameters"
// 		}}
// 	]
// }}
//
// The action_name should be one of the actions described above.
// The action_parameters should be the parameters required by the action.
// """
//
//
// @dataclass
// class AgentMessagePrompt:
// 	"""Agent message prompt."""
//
// 	state: BrowserState
// 	result: Optional[list[ActionResult]] = None
// 	step_info: Optional[AgentStepInfo] = None
// 	include_attributes: list[str] = None
// 	max_error_length: int = 400
//
// 	def get_user_message(self) -> HumanMessage:
// 		"""Get user message."""
// 		content = []
//
// 		if self.step_info:
// 			content.append(
// 				f'Step {self.step_info.step_id}: {self.step_info.step_name} - {self.step_info.step_description}'
// 			)
//
// 		if self.result:
// 			content.append('Previous action results:')
// 			for result in self.result:
// 				if result.error:
// 					error = result.error
// 					if len(error) > self.max_error_length:
// 						error = error[: self.max_error_length] + '...'
// 					content.append(f'Error: {error}')
// 				if result.extracted_content:
// 					content.append(f'Extracted content: {result.extracted_content}')
//
// 		content.append('Current browser state:')
// 		content.append(f'URL: {self.state.url}')
// 		content.append(f'Title: {self.state.title}')
//
// 		if self.state.tabs:
// 			content.append('Tabs:')
// 			for tab in self.state.tabs:
// 				content.append(f'- Tab {tab.page_id}: {tab.title} ({tab.url})')
//
// 		content.append('Clickable elements:')
// 		content.append(
// 			self.state.element_tree.clickable_elements_to_string(
// 				include_attributes=self.include_attributes
// 			)
// 		)
//
// 		return HumanMessage(content='\n'.join(content))

import { HumanMessage } from 'langchain/schema';
import type { BrowserState } from '../browser/views';
import type { ActionResult, AgentStepInfo } from './views';

export interface SystemPromptConfig {
  task: string;
  actionDescriptions: string;
  maxActionsPerStep: number;
}

export class SystemPrompt {
  private task: string;
  private actionDescriptions: string;
  private maxActionsPerStep: number;

  constructor({ task, actionDescriptions, maxActionsPerStep }: SystemPromptConfig) {
    this.task = task;
    this.actionDescriptions = actionDescriptions;
    this.maxActionsPerStep = maxActionsPerStep;
  }

  getPrompt(): string {
    return `You are a browser automation agent. Your task is to: ${this.task}

You can use the following actions to interact with the browser:
${this.actionDescriptions}

You can use up to ${this.maxActionsPerStep} actions per step.

You should return a JSON object with the following structure:
{
  "current_state": {
    "evaluation_previous_goal": "Evaluation of the previous goal. If this is the first step, just say 'First step'.",
    "memory": "Memory of what happened in the previous steps. If this is the first step, just say 'First step'.",
    "next_goal": "Next goal to achieve. This should be a clear and concise description of what you want to do next."
  },
  "action": [
    {
      "action_name": "action_parameters"
    }
  ]
}

The action_name should be one of the actions described above.
The action_parameters should be the parameters required by the action.`;
  }
}

export interface AgentMessagePromptConfig {
  state: BrowserState;
  result?: ActionResult[];
  stepInfo?: AgentStepInfo;
  includeAttributes?: string[];
  maxErrorLength?: number;
}

export class AgentMessagePrompt {
  private state: BrowserState;
  private result?: ActionResult[];
  private stepInfo?: AgentStepInfo;
  private includeAttributes: string[];
  private maxErrorLength: number;

  constructor({
    state,
    result,
    stepInfo,
    includeAttributes = [],
    maxErrorLength = 400
  }: AgentMessagePromptConfig) {
    this.state = state;
    this.result = result;
    this.stepInfo = stepInfo;
    this.includeAttributes = includeAttributes;
    this.maxErrorLength = maxErrorLength;
  }

  getUserMessage(): HumanMessage {
    const content: string[] = [];

    if (this.stepInfo) {
      content.push(
        `Step ${this.stepInfo.stepId}: ${this.stepInfo.stepName} - ${this.stepInfo.stepDescription}`
      );
    }

    if (this.result) {
      content.push('Previous action results:');
      for (const result of this.result) {
        if (result.error) {
          let error = result.error;
          if (error.length > this.maxErrorLength) {
            error = error.slice(0, this.maxErrorLength) + '...';
          }
          content.push(`Error: ${error}`);
        }
        if (result.extractedContent) {
          content.push(`Extracted content: ${result.extractedContent}`);
        }
      }
    }

    content.push('Current browser state:');
    content.push(`URL: ${this.state.url}`);
    content.push(`Title: ${this.state.title}`);

    if (this.state.tabs) {
      content.push('Tabs:');
      for (const tab of this.state.tabs) {
        content.push(`- Tab ${tab.pageId}: ${tab.title} (${tab.url})`);
      }
    }

    content.push('Clickable elements:');
    content.push(
      this.state.elementTree.clickableElementsToString(
        this.includeAttributes
      )
    );

    return new HumanMessage(content.join('\n'));
  }
}
