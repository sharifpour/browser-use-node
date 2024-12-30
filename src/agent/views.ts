import { mkdir, readFileSync, writeFileSync } from 'fs';
import { RateLimitError } from 'openai';
import { dirname } from 'path';
import type { BrowserStateHistory } from '../browser/views';
import { NavigateAction } from '../controller/registry/actions';
import type { ActionModel } from '../controller/registry/views';
import type { DOMElementNode, SelectorMap } from '../dom/views';

export interface AgentStepInfo {
  stepNumber: number;
  maxSteps: number;
  stepId: number;
  stepName: string;
  stepDescription: string;
}

export class ActionResult {
  isDone = false;
  extractedContent: string | null = null;
  error: string | null = null;
  includeInMemory = false;

  constructor(data?: Partial<ActionResult> | { error: string }) {
    if (data) {
      if ('error' in data && typeof data.error === 'string') {
        this.error = data.error;
        this.isDone = false;
        this.extractedContent = null;
        this.includeInMemory = true;
      } else {
        Object.assign(this, data);
      }
    }
  }

  toJSON() {
    return {
      isDone: this.isDone,
      extractedContent: this.extractedContent,
      error: this.error,
      includeInMemory: this.includeInMemory
    };
  }
}

export class AgentBrain {
  evaluationPreviousGoal: string;
  memory: string;
  nextGoal: string;

  constructor(data: {
    evaluationPreviousGoal: string;
    memory: string;
    nextGoal: string;
  }) {
    this.evaluationPreviousGoal = data.evaluationPreviousGoal;
    this.memory = data.memory;
    this.nextGoal = data.nextGoal;
  }

  toJSON() {
    return {
      evaluationPreviousGoal: this.evaluationPreviousGoal,
      memory: this.memory,
      nextGoal: this.nextGoal
    };
  }
}

export class AgentOutput {
  currentState: AgentBrain;
  action: ActionModel[];

  constructor(data: {
    current_state: {
      evaluation_previous_goal: string;
      memory: string;
      next_goal: string;
    };
    action: any[];
  }) {
    this.currentState = new AgentBrain({
      evaluationPreviousGoal: data.current_state.evaluation_previous_goal,
      memory: data.current_state.memory,
      nextGoal: data.current_state.next_goal
    });
    this.action = data.action;
  }

  toJSON() {
    return {
      current_state: {
        evaluation_previous_goal: this.currentState.evaluationPreviousGoal,
        memory: this.currentState.memory,
        next_goal: this.currentState.nextGoal
      },
      action: this.action.map(a => {
        if (a instanceof NavigateAction) {
          return {
            name: a.constructor.name,
            url: a.url
          };
        }
        return {
          name: a.constructor.name,
          index: 'getIndex' in a ? a.getIndex() : undefined
        };
      })
    };
  }

  static typeWithCustomActions(_customActions: new () => ActionModel): typeof AgentOutput {
    return class extends AgentOutput {
      constructor(data: {
        current_state: {
          evaluation_previous_goal: string;
          memory: string;
          next_goal: string;
        };
        action: any[];
      }) {
        super({
          current_state: {
            evaluation_previous_goal: data.current_state.evaluation_previous_goal,
            memory: data.current_state.memory,
            next_goal: data.current_state.next_goal
          },
          action: data.action
        });
      }
    };
  }
}

export class AgentHistory {
  modelOutput: AgentOutput | null;
  result: ActionResult[];
  state: BrowserStateHistory;

  constructor(data: {
    modelOutput: {
      current_state: {
        evaluation_previous_goal: string;
        memory: string;
        next_goal: string;
      };
      action: any[];
    } | null;
    result: ActionResult[];
    state: BrowserStateHistory;
  }) {
    this.modelOutput = data.modelOutput ? new AgentOutput({
      current_state: {
        evaluation_previous_goal: data.modelOutput.current_state.evaluation_previous_goal,
        memory: data.modelOutput.current_state.memory,
        next_goal: data.modelOutput.current_state.next_goal
      },
      action: data.modelOutput.action
    }) : null;
    this.result = data.result.map(r => new ActionResult(r));
    this.state = data.state;
  }

  static getInteractedElement(
    modelOutput: AgentOutput,
    selectorMap: SelectorMap
  ): (DOMElementNode | null)[] {
    const elements: (DOMElementNode | null)[] = [];
    for (const action of modelOutput.action) {
      const index = action.getIndex();
      if (index && index in selectorMap) {
        const el: DOMElementNode = selectorMap[index];
        elements.push(el);
      } else {
        elements.push(null);
      }
    }
    return elements;
  }

  toJSON() {
    let modelOutputDump = null;
    if (this.modelOutput) {
      modelOutputDump = this.modelOutput.toJSON();
    }

    return {
      modelOutput: modelOutputDump,
      result: this.result.map(r => r.toJSON()),
      state: this.state.toDict()
    };
  }
}

export class AgentHistoryList {
  history: AgentHistory[];

  constructor(data: {
    history: Array<{
      modelOutput: {
        current_state: {
          evaluation_previous_goal: string;
          memory: string;
          next_goal: string;
        };
        action: any[];
      } | null;
      result: ActionResult[];
      state: BrowserStateHistory;
    }>
  }) {
    this.history = data.history.map(h => new AgentHistory(h));
  }

  toString(): string {
    return `AgentHistoryList(allResults=${this.actionResults()}, allModelOutputs=${this.modelActions()})`;
  }

  saveToFile(filePath: string): void {
    const data = this.toJSON();
    // Ensure directory exists
    const dir = dirname(filePath);
    mkdir(dir, { recursive: true }, (err) => {
      if (err) throw err;
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    });
  }

  toJSON() {
    return {
      history: this.history.map(h => h.toJSON())
    };
  }

  static loadFromFile(filePath: string, outputModel: typeof AgentOutput): AgentHistoryList {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Loop through history and validate output_model actions to enrich with custom actions
    for (const h of data.history) {
      if (h.modelOutput) {
        if (typeof h.modelOutput === 'object') {
          h.modelOutput = new outputModel({
            current_state: {
              evaluation_previous_goal: h.modelOutput.current_state.evaluation_previous_goal,
              memory: h.modelOutput.current_state.memory,
              next_goal: h.modelOutput.current_state.next_goal
            },
            action: h.modelOutput.action
          });
        } else {
          h.modelOutput = null;
        }
      }
      if (!('interactedElement' in h.state)) {
        h.state.interactedElement = null;
      }
    }

    return new AgentHistoryList(data);
  }

  lastAction(): Record<string, any> | null {
    if (this.history.length && this.history[this.history.length - 1].modelOutput) {
      const lastHistory = this.history[this.history.length - 1];
      const lastAction = lastHistory.modelOutput!.action[lastHistory.modelOutput!.action.length - 1];

      // Handle actions that don't have getIndex
      if (lastAction.constructor.name === 'NavigateAction') {
        return {
          name: lastAction.constructor.name,
          url: lastAction.url
        };
      }

      return {
        name: lastAction.constructor.name,
        index: lastAction.getIndex?.() // Make getIndex optional
      };
    }
    return null;
  }

  errors(): string[] {
    const errors: string[] = [];
    for (const h of this.history) {
      errors.push(...h.result.filter(r => r.error).map(r => r.error!));
    }
    return errors;
  }

  finalResult(): string | null {
    if (
      this.history.length &&
      this.history[this.history.length - 1].result.length &&
      this.history[this.history.length - 1].result[this.history[this.history.length - 1].result.length - 1].extractedContent
    ) {
      return this.history[this.history.length - 1].result[this.history[this.history.length - 1].result.length - 1].extractedContent;
    }
    return null;
  }

  isDone(): boolean {
    if (
      this.history.length &&
      this.history[this.history.length - 1].result.length > 0
    ) {
      return this.history[this.history.length - 1].result[this.history[this.history.length - 1].result.length - 1].isDone;
    }
    return false;
  }

  hasErrors(): boolean {
    return this.errors().length > 0;
  }

  urls(): string[] {
    return this.history.filter(h => h.state.toDict().url).map(h => h.state.toDict().url);
  }

  screenshots(): string[] {
    return this.history.filter(h => h.state.toDict().screenshot).map(h => h.state.toDict().screenshot!);
  }

  actionNames(): string[] {
    return this.modelActions().map(action => Object.keys(action)[0]);
  }

  modelThoughts(): AgentBrain[] {
    return this.history
      .filter(h => h.modelOutput)
      .map(h => h.modelOutput!.currentState);
  }

  modelOutputs(): AgentOutput[] {
    return this.history
      .filter(h => h.modelOutput)
      .map(h => h.modelOutput!);
  }

  modelActions(): Record<string, any>[] {
    const outputs: Record<string, any>[] = [];
    for (const h of this.history) {
      if (h.modelOutput) {
        for (const action of h.modelOutput.action) {
          if (action instanceof NavigateAction) {
            outputs.push({
              name: action.constructor.name,
              url: action.url
            });
          } else {
            outputs.push({
              name: action.constructor.name,
              index: 'getIndex' in action ? action.getIndex() : undefined
            });
          }
        }
      }
    }
    return outputs;
  }

  actionResults(): ActionResult[] {
    const results: ActionResult[] = [];
    for (const h of this.history) {
      results.push(...h.result.filter(r => r));
    }
    return results;
  }

  extractedContent(): string[] {
    const content: string[] = [];
    for (const h of this.history) {
      content.push(...h.result.filter(r => r.extractedContent).map(r => r.extractedContent!));
    }
    return content;
  }

  modelActionsFiltered(include: string[] = []): Record<string, any>[] {
    const outputs = this.modelActions();
    const result: Record<string, any>[] = [];
    for (const o of outputs) {
      if (include.length === 0 || include.includes(o.name)) {
        result.push(o);
      }
    }
    return result;
  }
}

export class AgentError extends Error {
  static VALIDATION_ERROR = 'Invalid model output format. Please follow the correct schema.';
  static RATE_LIMIT_ERROR = 'Rate limit reached. Waiting before retry.';
  static NO_VALID_ACTION = 'No valid action found';

  static formatError(error: Error, includeTrace = false): string {
    if (error instanceof Error && error.name === 'ValidationError') {
      return `${AgentError.VALIDATION_ERROR}\nDetails: ${error.message}`;
    }
    if (error instanceof RateLimitError) {
      return AgentError.RATE_LIMIT_ERROR;
    }
    if (includeTrace) {
      return `${error.message}\nStacktrace:\n${error.stack}`;
    }
    return error.message;
  }
}