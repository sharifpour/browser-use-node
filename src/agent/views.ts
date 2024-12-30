import { z } from 'zod';
import type { BrowserStateHistory } from '../browser/views';
import type { ActionModel } from '../controller/registry/views';
import type { DOMElementNode } from '../dom/types';

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

  constructor(data: { currentState: AgentBrain; action: ActionModel[] }) {
    this.currentState = new AgentBrain(data.currentState);
    this.action = data.action;
  }

  static typeWithCustomActions(ActionModelClass: typeof ActionModel) {
    return z.object({
      currentState: z.object({
        evaluation_previous_goal: z.string(),
        memory: z.string(),
        next_goal: z.string()
      }).transform(data => ({
        evaluationPreviousGoal: data.evaluation_previous_goal,
        memory: data.memory,
        nextGoal: data.next_goal
      })),
      action: z.array(
        z.object({}).catchall(z.record(z.any())).transform(data => {
          const actionName = Object.keys(data)[0];
          const actionData = data[actionName];
          return new ActionModelClass({ [actionName]: actionData });
        })
      )
    });
  }
}

export interface AgentStepInfo {
  stepNumber: number;
  maxSteps: number;
}

export class AgentHistory {
  modelOutput: {
    currentState: {
      evaluation_previous_goal: string;
      memory: string;
      next_goal: string;
    };
    action: ActionModel[];
  } | null;
  result: ActionResult[];
  state: BrowserStateHistory;

  constructor(data: {
    modelOutput: {
      currentState: {
        evaluation_previous_goal: string;
        memory: string;
        next_goal: string;
      };
      action: ActionModel[];
    } | null;
    result: ActionResult[];
    state: BrowserStateHistory;
  }) {
    this.modelOutput = data.modelOutput;
    this.result = data.result;
    this.state = data.state;
  }

  static getInteractedElement(
    modelOutput: AgentOutput,
    selectorMap: Record<number, DOMElementNode>
  ): (DOMElementNode | null)[] {
    return modelOutput.action.map(action => {
      const index = action.getIndex?.();
      if (index === null || index === undefined) return null;
      return selectorMap[index] || null;
    });
  }
}

export class AgentHistoryList {
  history: AgentHistory[];

  constructor(data: { history: AgentHistory[] }) {
    this.history = data.history;
  }

  lastAction(): Record<string, any> | null {
    if (this.history.length && this.history[this.history.length - 1].modelOutput) {
      const lastHistory = this.history[this.history.length - 1];
      const lastAction = lastHistory.modelOutput!.action[lastHistory.modelOutput!.action.length - 1];

      // Handle actions that don't have getIndex
      if (lastAction.constructor.name === 'NavigateAction') {
        return {
          name: lastAction.constructor.name,
          url: (lastAction as any).url
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
    return this.history.filter(h => h.state.url).map(h => h.state.url);
  }

  screenshots(): string[] {
    return this.history.filter(h => h.state.screenshot).map(h => h.state.screenshot!);
  }

  actionNames(): string[] {
    return this.modelActions().map(action => Object.keys(action)[0]);
  }

  modelThoughts(): AgentBrain[] {
    return this.history
      .filter(h => h.modelOutput)
      .map(h => new AgentBrain({
        evaluationPreviousGoal: h.modelOutput!.currentState.evaluation_previous_goal,
        memory: h.modelOutput!.currentState.memory,
        nextGoal: h.modelOutput!.currentState.next_goal
      }));
  }

  modelOutputs(): AgentOutput[] {
    return this.history
      .filter(h => h.modelOutput)
      .map(h => new AgentOutput({
        currentState: new AgentBrain({
          evaluationPreviousGoal: h.modelOutput!.currentState.evaluation_previous_goal,
          memory: h.modelOutput!.currentState.memory,
          nextGoal: h.modelOutput!.currentState.next_goal
        }),
        action: h.modelOutput!.action
      }));
  }

  modelActions(): ActionModel[] {
    return this.history
      .filter(h => h.modelOutput)
      .flatMap(h => h.modelOutput!.action);
  }
}

export class AgentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentError';
  }
}