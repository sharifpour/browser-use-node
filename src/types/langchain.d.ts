import type { BaseMessage } from 'langchain/schema';

export interface BaseChatModel {
  withStructuredOutput<T>(outputSchema: new () => T): {
    invoke(messages: BaseMessage[]): Promise<{ parsed: T }>;
  };
  getNumTokensFromMessages(messages: BaseMessage[]): number;
}

export type { BaseMessage };
