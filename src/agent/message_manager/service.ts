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
  estimatedTokensPerCharacter?: number;
  imageTokens?: number;
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
  private estimatedTokensPerCharacter: number;
  private imageTokens: number;
  private includeAttributes: string[];
  private maxErrorLength: number;
  private maxActionsPerStep: number;
  private messages: BaseMessage[] = [];
  private systemPrompt!: SystemMessage;

  constructor({
    llm,
    task,
    actionDescriptions,
    systemPromptClass = SystemPrompt,
    maxInputTokens = 128000,
    estimatedTokensPerCharacter = 3,
    imageTokens = 800,
    includeAttributes = [],
    maxErrorLength = 400,
    maxActionsPerStep = 10
  }: MessageManagerConfig) {
    this.llm = llm;
    this.task = task;
    this.actionDescriptions = actionDescriptions;
    this.systemPromptClass = systemPromptClass;
    this.maxInputTokens = maxInputTokens;
    this.estimatedTokensPerCharacter = estimatedTokensPerCharacter;
    this.imageTokens = imageTokens;
    this.includeAttributes = includeAttributes;
    this.maxErrorLength = maxErrorLength;
    this.maxActionsPerStep = maxActionsPerStep;

    this.addSystemMessage();
    this.addTaskMessage();
  }

  private addSystemMessage(): void {
    const systemPrompt = new this.systemPromptClass({
      actionDescription: this.actionDescriptions,
      maxActionsPerStep: this.maxActionsPerStep
    });
    const message = systemPrompt.getSystemMessage();
    this.systemPrompt = message;
    this.addMessageWithTokens(message);
  }

  private addTaskMessage(): void {
    const message = new HumanMessage(`Your task is: ${this.task}`);
    this.addMessageWithTokens(message);
  }

  addStateMessage(
    state: BrowserState,
    result?: ActionResult[] | null,
    stepInfo?: AgentStepInfo
  ): void {
    // Add memory items first
    if (result) {
      for (const r of result) {
        if (r.includeInMemory) {
          if (r.extractedContent) {
            const msg = new HumanMessage(String(r.extractedContent));
            this.addMessageWithTokens(msg);
          }
          if (r.error) {
            const msg = new HumanMessage(String(r.error).slice(-this.maxErrorLength));
            this.addMessageWithTokens(msg);
          }
          result = undefined; // if result in history, we don't want to add it again
        }
      }
    }

    const content = new AgentMessagePrompt({
      state,
      result,
      includeAttributes: this.includeAttributes,
      maxErrorLength: this.maxErrorLength,
      stepInfo
    });
    this.addMessageWithTokens(content.getUserMessage());
  }

  addModelOutput(modelOutput: AgentOutput): void {
    this.addMessageWithTokens(
      new HumanMessage(JSON.stringify(modelOutput))
    );
  }

  getMessages(): BaseMessage[] {
    return this.messages;
  }

  removeLastStateMessage(): void {
    if (this.messages.length > 2 && this.messages[this.messages.length - 1] instanceof HumanMessage) {
      this.messages.pop();
    }
  }

  cutMessages(): void {
    if (this.messages.length <= 2) {
      return;
    }

    while (this.countTotalTokens() > this.maxInputTokens && this.messages.length > 2) {
      this.messages.splice(1, 1);
    }
  }

  setMaxInputTokens(tokens: number): void {
    this.maxInputTokens = tokens;
  }

  private addMessageWithTokens(message: BaseMessage): void {
    this.messages.push(message);
  }

  private countTotalTokens(): number {
    return this.messages.reduce((total, msg) => {
      return total + this.countTokens(msg);
    }, 0);
  }

  private countTokens(message: BaseMessage): number {
    const text = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    return this.countTextTokens(text);
  }

  private countTextTokens(text: string): number {
    return Math.ceil(text.length * this.estimatedTokensPerCharacter);
  }
}