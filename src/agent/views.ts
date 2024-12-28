import type { SelectorMap } from '../browser/types';
import type { BrowserStateHistoryData } from '../browser/views';
import type { AgentOutput } from './types';

export interface AgentHistoryState {
  state: BrowserStateHistoryData;
}

export const AgentHistoryUtils = {
  getInteractedElement(_output: AgentOutput, _selector_map: SelectorMap): (Element | null)[] {
    // TODO: Implement this method to match Python's behavior
    return [null];
  }
};

export class AgentHistoryList {
  private history: AgentHistoryState[] = [];

  constructor(history: AgentHistoryState[] = []) {
    this.history = history;
  }

  add(state: BrowserStateHistoryData): void {
    this.history.push({ state });
  }
}