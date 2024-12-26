import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BaseMessage, BaseChatModel } from '../types';
import { HumanMessage, SystemMessage } from 'langchain/schema';

export class ChatOpenAIAdapter implements BaseChatModel {
  private model: ChatOpenAI;

  constructor(model: ChatOpenAI) {
    this.model = model;
  }

  async generateStructuredOutput<T>(messages: BaseMessage[], outputSchema: string): Promise<{ parsed: T }> {
    const formattedMessages = messages.map(msg => {
      const content = typeof msg.content === 'string' ? msg.content : msg.content[0].text;
      if (msg.constructor.name === 'SystemMessage') {
        return new SystemMessage({ content });
      }
      return new HumanMessage({ content });
    });

    const response = await this.model.call(formattedMessages);
    try {
      const parsed = JSON.parse(response.content) as T;
      return { parsed };
    } catch (error) {
      throw new Error(`Failed to parse LLM response as JSON: ${error}`);
    }
  }
}