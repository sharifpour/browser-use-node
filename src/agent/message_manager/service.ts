import { type BaseChatModel } from 'langchain/chat_models/base';
import { type BaseMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import type { BrowserState } from '../../browser/views';
import { AgentMessagePrompt, SystemPrompt } from '../prompts';
import type { ActionResult, AgentOutput, AgentStepInfo } from '../views';

export interface MessageManagerConfig {
  llm: BaseChatModel;
  task: string;
  actionDescriptions: string;
  systemPromptClass?: typeof SystemPrompt;
  maxInputTokens?: number;
  includeAttributes?: string[];
  maxErrorLength?: number;
  maxActionsPerStep?: number;
}

export class MessageManager {
  private llm: BaseChatModel;
  private task: string;
  private actionDescriptions: string;
  private systemPromptClass: typeof SystemPrompt;
  private maxInputTokens: number;
  private includeAttributes: string[];
  private maxErrorLength: number;
  private maxActionsPerStep: number;
  private messages: BaseMessage[] = [];

  constructor({
    llm,
    task,
    actionDescriptions,
    systemPromptClass = SystemPrompt,
    maxInputTokens = 128000,
    includeAttributes = [],
    maxErrorLength = 400,
    maxActionsPerStep = 10
  }: MessageManagerConfig) {
    this.llm = llm;
    this.task = task;
    this.actionDescriptions = actionDescriptions;
    this.systemPromptClass = systemPromptClass;
    this.maxInputTokens = maxInputTokens;
    this.includeAttributes = includeAttributes;
    this.maxErrorLength = maxErrorLength;
    this.maxActionsPerStep = maxActionsPerStep;

    this.addSystemMessage();
  }

  private addSystemMessage(): void {
    const systemPrompt = new this.systemPromptClass({
      task: this.task,
      actionDescriptions: this.actionDescriptions,
      maxActionsPerStep: this.maxActionsPerStep
    });
    this.messages.push(new SystemMessage(systemPrompt.getPrompt()));
  }

  addStateMessage(
    state: BrowserState,
    result: ActionResult[] | undefined | null,
    stepInfo?: AgentStepInfo
  ): void {
    const content = new AgentMessagePrompt({
      state,
      result,
      stepInfo,
      includeAttributes: this.includeAttributes,
      maxErrorLength: this.maxErrorLength
    });
    this.messages.push(content.getUserMessage());
  }

  addModelOutput(modelOutput: AgentOutput): void {
    this.messages.push(
      new HumanMessage(JSON.stringify(modelOutput))
    );
  }

  getMessages(): BaseMessage[] {
    return this.messages;
  }

  removeLastStateMessage(): void {
    this.messages.pop();
  }

  cutMessages(): void {
    if (this.messages.length <= 2) {
      return;
    }

    while (
      this.llm.getNumTokensFromMessages(this.messages) > this.maxInputTokens &&
      this.messages.length > 2
    ) {
      this.messages.splice(1, 1);
    }
  }
}