import { ChatOpenAI } from 'langchain/chat_models/openai';
import { type BaseMessage, SystemMessage } from 'langchain/schema';
import { v4 as uuidv4 } from 'uuid';
import { Browser } from '../browser/browser';
import { BrowserContext } from '../browser/context';
import { type BrowserState, BrowserStateHistory } from '../browser/views';
import {
  ClickAction,
  DoneAction,
  ExtractAction,
  InputAction,
  NavigateAction,
  ScrollAction,
  TabAction
} from '../controller/registry/actions';
import type { ActionModel } from '../controller/registry/views';
import { Controller } from '../controller/service';
import { type DOMHistoryElement, HistoryTreeProcessor } from '../dom/history_tree_processor/service';
import { timeExecutionAsync } from '../utils';
import { logger } from '../utils/logging';
import { MessageManager } from './message_manager/service';
import { AgentMessagePrompt, SystemPrompt } from './prompts';
import {
  ActionResult,
  AgentError,
  AgentHistory,
  AgentHistoryList,
  AgentOutput,
  type AgentStepInfo
} from './views';

interface ValidationResult {
  isValid: boolean;
  reason: string;
}

type ActionUnionType = 'go_to_url' | 'click_element' | 'input_text' | 'extract_page_content' | 'done' | 'scroll' | 'tab';

type AgentConfig = {
  task: string;
  llm: ChatOpenAI;
  browser: Browser;
  browserContext: BrowserContext;
  controller: Controller;
  useVision: boolean;
  saveConversationPath?: string;
  maxFailures: number;
  retryDelay: number;
  systemPromptClass: typeof SystemPrompt;
  maxInputTokens: number;
  includeAttributes: string[];
  maxErrorLength: number;
  maxActionsPerStep: number;
  validateOutput: boolean;
  messageManager: MessageManager;
  history: AgentHistoryList;
  nSteps: number;
  consecutiveFailures: number;


  shouldValidateOutput: boolean;
};

const defaultBrowser = new Browser();
const defaultBrowserContext = new BrowserContext(defaultBrowser);
const defaultConfig: AgentConfig = {
  task: '',
  llm: new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0,
    maxTokens: 1000,
    streaming: false
  }),
  browser: defaultBrowser,
  browserContext: defaultBrowserContext,
  controller: new Controller(),
  useVision: true,
  saveConversationPath: undefined,
  maxFailures: 5,
  retryDelay: 10,
  systemPromptClass: SystemPrompt,
  maxInputTokens: 128000,
  validateOutput: false,
  includeAttributes: [],
  maxErrorLength: 1000,
  maxActionsPerStep: 10,
  messageManager: new MessageManager({
    llm: new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      maxTokens: 1000,
      streaming: false
    }),
    task: '',
    actionDescriptions: '',
    systemPromptClass: SystemPrompt,
    maxInputTokens: 128000,
    includeAttributes: [],
    maxErrorLength: 1000,
    maxActionsPerStep: 10
  }),
  history: new AgentHistoryList({ history: [] }),
  nSteps: 1,
  consecutiveFailures: 0,
  shouldValidateOutput: false
};

interface ActionWithIndex {
  getIndex?: () => number;
}

export class Agent {
  private agentId: string;
  private task: string;
  private useVision: boolean;
  private llm: ChatOpenAI;
  private saveConversationPath?: string;
  private lastResult: ActionResult[] | null = null;
  private includeAttributes: string[];
  private maxErrorLength: number;
  private controller: Controller;
  private maxActionsPerStep: number;
  private injectedBrowser: boolean;
  private injectedBrowserContext: boolean;
  private browser: Browser;
  private browserContext: BrowserContext;
  private systemPromptClass: typeof SystemPrompt;
  private maxInputTokens: number;
  private messageManager: MessageManager;
  private history: AgentHistoryList;
  private nSteps: number;
  private consecutiveFailures: number;
  private maxFailures: number;
  private retryDelay: number;
  private shouldValidateOutput: boolean;

  constructor(
    config?: Partial<AgentConfig>
  ) {
    const mergedConfig = { ...defaultConfig, ...config };
    this.agentId = uuidv4();
    this.task = mergedConfig.task;
    this.useVision = mergedConfig.useVision;
    this.llm = mergedConfig.llm || new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      maxTokens: 1000,
      streaming: false
    });
    this.saveConversationPath = mergedConfig.saveConversationPath;
    this.includeAttributes = mergedConfig.includeAttributes;
    this.maxErrorLength = mergedConfig.maxErrorLength;
    this.controller = mergedConfig.controller || new Controller();
    this.maxActionsPerStep = mergedConfig.maxActionsPerStep;
    this.browser = mergedConfig.browser;
    this.browserContext = mergedConfig.browserContext;
    this.systemPromptClass = mergedConfig.systemPromptClass;
    this.maxInputTokens = mergedConfig.maxInputTokens;
    this.maxFailures = mergedConfig.maxFailures;
    this.retryDelay = mergedConfig.retryDelay;
    this.shouldValidateOutput = mergedConfig.validateOutput;

    this.injectedBrowser = mergedConfig.browser !== undefined;
    this.injectedBrowserContext = mergedConfig.browserContext !== undefined;

    // Initialize browser first if needed
    this.browser = mergedConfig.browser || (mergedConfig.browserContext ? null : new Browser());

    // Initialize browser context
    if (mergedConfig.browserContext) {
      this.browserContext = mergedConfig.browserContext;
    } else if (this.browser) {
      this.browserContext = new BrowserContext(this.browser);
    } else {
      this.browser = new Browser();
      this.browserContext = new BrowserContext(this.browser);
    }

    this.messageManager = new MessageManager({
      llm: this.llm,
      task: this.task,
      actionDescriptions: this.controller.getPromptDescription(),
      systemPromptClass: this.systemPromptClass,
      maxInputTokens: this.maxInputTokens,
      includeAttributes: this.includeAttributes,
      maxErrorLength: this.maxErrorLength,
      maxActionsPerStep: this.maxActionsPerStep
    });

    this.history = new AgentHistoryList({ history: [] });
    this.nSteps = 1;
    this.consecutiveFailures = 0;
    this.maxFailures = mergedConfig.maxFailures;
    this.retryDelay = mergedConfig.retryDelay;
    this.shouldValidateOutput = mergedConfig.validateOutput;

    if (this.saveConversationPath) {
      logger.info(`Saving conversation to ${this.saveConversationPath}`);
    }

    // Register action types with the controller

  }

  @timeExecutionAsync('step')
  async step(stepInfo?: AgentStepInfo): Promise<void> {
    logger.info(`\n📍 Step ${this.nSteps}`);
    let state: BrowserState | null = null;
    let modelOutput: AgentOutput | null = null;
    let result: ActionResult[] = [];

    try {
      state = await this.browserContext.getState(this.useVision);
      this.messageManager.addStateMessage(state, this.lastResult, stepInfo);
      const inputMessages = this.messageManager.getMessages();
      modelOutput = await this.getNextAction(inputMessages);

      // Convert the raw actions to ActionModel instances
      modelOutput.action = modelOutput.action.map(action => this.convertAction(action));

      this.saveConversation(inputMessages, modelOutput);
      this.messageManager.removeLastStateMessage();
      this.messageManager.addModelOutput(modelOutput);

      result = await this.controller.multiAct(modelOutput.action, this.browserContext);
      this.lastResult = result;

      if (result.length > 0 && result[result.length - 1].isDone) {
        logger.info(`📄 Result: ${result[result.length - 1].extractedContent}`);
      }

      this.consecutiveFailures = 0;
    } catch (error) {
      result = await this.handleStepError(error);
      this.lastResult = result;
    } finally {
      if (result && result.length > 0) {
        for (const r of result) {
          if (r.error) {
            // TODO: Implement telemetry
          }
        }
        if (state) {
          this.makeHistoryItem(modelOutput, state, result);
        }
      }
    }
  }

  private handleStepError(error: unknown): ActionResult[] {
    const errorMsg = error instanceof Error
      ? AgentError.formatError(error, true)
      : String(error);
    const prefix = `❌ Result failed ${this.consecutiveFailures + 1}/${this.maxFailures} times:\n `;

    logger.error(`${prefix}${errorMsg}`);
    if (errorMsg.includes('Max token limit reached')) {
      this.messageManager.maxInputTokens = this.maxInputTokens - 500;
      logger.info(`Cutting tokens from history - new max input tokens: ${this.messageManager.maxInputTokens}`);
      this.messageManager.cutMessages();
    }
    this.consecutiveFailures++;

    return [new ActionResult({
      isDone: false,
      extractedContent: null,
      error: errorMsg,
      includeInMemory: true
    })];
  }

  private makeHistoryItem(
    modelOutput: AgentOutput | null,
    state: BrowserState,
    result: ActionResult[]
  ): void {
    const interactedElements = modelOutput
      ? this.getInteractedElement(modelOutput, state.selectorMap)
        .map(el => {
          if (el === null) return null;
          return el.toString();
        })
      : [null];

    const stateHistory = new BrowserStateHistory({
      url: state.url,
      title: state.title,
      tabs: state.tabs,
      interactedElement: interactedElements,
      screenshot: state.screenshot
    });

    const historyItem = new AgentHistory({
      modelOutput: modelOutput ? {
        current_state: {
          evaluation_previous_goal: modelOutput.currentState.evaluationPreviousGoal,
          memory: modelOutput.currentState.memory,
          next_goal: modelOutput.currentState.nextGoal
        },
        action: modelOutput.action
      } : null,
      result,
      state: stateHistory
    });

    this.history.history.push(historyItem);
  }

  private getInteractedElement(output: AgentOutput, selectorMap: Map<number, DOMHistoryElement>): (DOMHistoryElement | null)[] {
    return output.action.map(action => {
      // Special handling for NavigateAction
      if (action instanceof NavigateAction) {
        return null;
      }

      const actionWithIndex = action as ActionWithIndex;
      if (!actionWithIndex.getIndex) {
        return null;
      }

      try {
        const index = actionWithIndex.getIndex();
        return selectorMap.get(index) || null;
      } catch (error) {
        logger.debug(`Failed to get index for action ${action.constructor.name}: ${error}`);
        return null;
      }
    });
  }

  @timeExecutionAsync('getNextAction')
  private async getNextAction(inputMessages: BaseMessage[]): Promise<AgentOutput> {
    logger.info(`Input messages: ${JSON.stringify(inputMessages)}`);

    const structuredLlm = this.llm.bind({
      functions: [{
        name: 'agent_action',
        description: 'Agent action response',
        parameters: {
          type: 'object',
          properties: {
            current_state: {
              type: 'object',
              properties: {
                evaluation_previous_goal: { type: 'string' },
                memory: { type: 'string' },
                next_goal: { type: 'string' }
              },
              required: ['evaluation_previous_goal', 'memory', 'next_goal']
            },
            action: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  go_to_url: {
                    type: 'object',
                    properties: {
                      url: { type: 'string' }
                    },
                    required: ['url']
                  },
                  click_element: {
                    type: 'object',
                    properties: {
                      index: { type: 'number' }
                    },
                    required: ['index']
                  },
                  input_text: {
                    type: 'object',
                    properties: {
                      index: { type: 'number' },
                      text: { type: 'string' }
                    },
                    required: ['index', 'text']
                  },
                  extract_page_content: {
                    type: 'object',
                    properties: {
                      index: { type: 'number' }
                    },
                    required: ['index']
                  },
                  done: {
                    type: 'object',
                    properties: {
                      result: { type: 'string' }
                    },
                    required: ['result']
                  },
                  scroll: {
                    type: 'object',
                    properties: {
                      direction: { type: 'string' },
                      amount: { type: 'number' }
                    },
                    required: ['direction', 'amount']
                  },
                  tab: {
                    type: 'object',
                    properties: {
                      action: { type: 'string' },
                      url: { type: 'string' },
                      page_id: { type: 'string' }
                    },
                    required: ['action']
                  }
                }
              }
            }
          },
          required: ['current_state', 'action']
        }
      }],
      function_call: { name: 'agent_action' }
    });

    const response = await structuredLlm.invoke(inputMessages);
    logger.info(`Raw response: ${JSON.stringify(response)}`);

    if (!response || !response.additional_kwargs?.function_call?.arguments) {
      throw new Error('Invalid response from LLM: Response or function call arguments are missing');
    }

    try {
      const parsed = JSON.parse(response.additional_kwargs.function_call.arguments);
      logger.info(`Response parsed: ${JSON.stringify(parsed)}`);

      // Ensure the action array exists and has the correct format
      if (!parsed.action) {
        parsed.action = [];
      }

      // Add initial navigation action if on blank page
      if (this.nSteps === 1) {
        parsed.action = [{
          go_to_url: {
            url: 'https://google.com'
          }
        }];
      }

      const output = new AgentOutput(parsed);
      logger.info(`Parsed: ${JSON.stringify(output)}`);
      output.action = output.action.slice(0, this.maxActionsPerStep);
      logger.info(`Parsed action: ${JSON.stringify(output.action)}`);
      this.logResponse(output);
      this.nSteps++;
      return output;
    } catch (error) {
      throw new Error(`Failed to parse LLM response: ${error}`);
    }
  }

  private logResponse(response: AgentOutput): void {
    const emoji = response.currentState.evaluationPreviousGoal.includes('Success')
      ? '👍'
      : response.currentState.evaluationPreviousGoal.includes('Failed')
        ? '⚠️'
        : '🤷';

    logger.info(`${emoji} Eval: ${response.currentState.evaluationPreviousGoal}`);
    logger.info(`🧠 Memory: ${response.currentState.memory}`);
    logger.info(`🎯 Next goal: ${response.currentState.nextGoal}`);
    response.action.forEach((action, i) => {
      logger.info(`🛠️  Action ${i + 1}/${response.action.length}: ${JSON.stringify(action)}`);
    });
  }

  private saveConversation(_inputMessages: BaseMessage[], _response: any): void {
    if (!this.saveConversationPath) return;
    // TODO: Implement conversation saving
  }

  async run(maxSteps = 100): Promise<AgentHistoryList> {
    try {
      logger.info(`🚀 Starting task: ${this.task}`);

      for (let step = 0; step < maxSteps; step++) {
        if (this.tooManyFailures()) break;

        await this.step();

        if (this.history.isDone()) {
          if (this.shouldValidateOutput && step < maxSteps - 1) {
            if (!await this.validateOutput) continue;
          }
          logger.info('✅ Task completed successfully');
          break;
        }
      }

      return this.history;
    } finally {
      if (!this.injectedBrowserContext) {
        await this.browserContext.close();
      }
      if (!this.injectedBrowser && this.browser) {
        await this.browser.close();
      }
    }
  }

  private tooManyFailures(): boolean {
    if (this.consecutiveFailures >= this.maxFailures) {
      logger.error(`❌ Stopping due to ${this.maxFailures} consecutive failures`);
      return true;
    }
    return false;
  }

  private async validateOutput(): Promise<boolean> {
    const systemMsg = `You are a validator of an agent who interacts with a browser.
      Validate if the output of last action is what the user wanted and if the task is completed.
      If the task is unclear defined, you can let it pass. But if something is missing or the image does not show what was requested dont let it pass.
      Try to understand the page and help the model with suggestions like scroll, do x, ... to get the solution right.
      Task to validate: ${this.task}. Return a JSON object with 2 keys: is_valid and reason.
      is_valid is a boolean that indicates if the output is correct.
      reason is a string that explains why it is valid or not.
      example: {"is_valid": false, "reason": "The user wanted to search for 'cat photos', but the agent searched for 'dog photos' instead."}`;

    if (!this.browserContext.session) return true;

    const state = await this.browserContext.getState(this.useVision);
    const content = new AgentMessagePrompt({
      state,
      result: this.lastResult || [],
      includeAttributes: this.includeAttributes,
      maxErrorLength: this.maxErrorLength
    });

    const msg = [new SystemMessage(systemMsg), content.getUserMessage()];
    const response = await this.llm.call(msg);
    let parsed: ValidationResult;

    try {
      const responseText = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
      parsed = JSON.parse(responseText) as ValidationResult;
    } catch (error) {
      logger.error('Failed to parse validation response');
      return true;
    }

    if (!parsed.isValid) {
      logger.info(`❌ Validator decision: ${parsed.reason}`);
      const msg = `The output is not yet correct. ${parsed.reason}.`;
      this.lastResult = [
        new ActionResult({
          isDone: false,
          extractedContent: msg,
          error: null,
          includeInMemory: true
        })
      ];
    } else {
      logger.info(`✅ Validator decision: ${parsed.reason}`);
    }

    return parsed.isValid;
  }

  async rerunHistory(
    history: AgentHistoryList,
    maxRetries = 3,
    skipFailures = true,
    delayBetweenActions = 2.0
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (let i = 0; i < history.history.length; i++) {
      const historyItem = history.history[i];
      const goal = historyItem.modelOutput?.currentState.nextGoal || '';
      logger.info(`Replaying step ${i + 1}/${history.history.length}: goal: ${goal}`);

      if (!historyItem.modelOutput?.action || historyItem.modelOutput.action.length === 0) {
        logger.warning(`Step ${i + 1}: No action to replay, skipping`);
        results.push(new ActionResult({
          isDone: false,
          extractedContent: null,
          error: 'No action to replay',
          includeInMemory: true
        }));
        continue;
      }

      let retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          const result = await this.executeHistoryStep(historyItem, delayBetweenActions);
          results.push(...result);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            const errorMsg = `Step ${i + 1} failed after ${maxRetries} attempts: ${error}`;
            logger.error(errorMsg);
            if (!skipFailures) {
              results.push(new ActionResult({
                isDone: false,
                extractedContent: null,
                error: errorMsg,
                includeInMemory: true
              }));
              throw new Error(errorMsg);
            }
          } else {
            logger.warning(`Step ${i + 1} failed (attempt ${retryCount}/${maxRetries}), retrying...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenActions * 1000));
          }
        }
      }
    }

    return results;
  }

  private async executeHistoryStep(
    historyItem: AgentHistory,
    delay: number
  ): Promise<ActionResult[]> {
    const state = await this.browserContext.getState();
    if (!state || !historyItem.modelOutput) {
      return [new ActionResult({
        isDone: false,
        extractedContent: null,
        error: 'Invalid state or model output',
        includeInMemory: true
      })];
    }

    const updatedActions = [];
    for (let i = 0; i < historyItem.modelOutput.action.length; i++) {
      const updatedAction = await this.updateActionIndices(
        historyItem.state.toDict().interactedElement?.[i] || null,
        historyItem.modelOutput.action[i],
        state
      );
      updatedActions.push(updatedAction);

      if (updatedAction === null) {
        return [new ActionResult({
          isDone: false,
          extractedContent: null,
          error: `Could not find matching element ${i} in current page`,
          includeInMemory: true
        })];
      }
    }

    const result = await this.controller.multiAct(updatedActions, this.browserContext);
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
    return result;
  }

  private async updateActionIndices(
    historicalElement: DOMHistoryElement | null,
    action: ActionModel,
    currentState: BrowserState
  ): Promise<ActionModel | null> {
    if (!historicalElement || !currentState.elementTree) {
      return action;
    }

    const currentElement = HistoryTreeProcessor.findHistoryElementInTree(
      historicalElement,
      currentState.elementTree
    );

    if (!currentElement || currentElement.highlightIndex === undefined) {
      return null;
    }

    const oldIndex = action.getIndex();
    if (oldIndex !== currentElement.highlightIndex) {
      action.setIndex(currentElement.highlightIndex);
      logger.info(`Element moved in DOM, updated index from ${oldIndex} to ${currentElement.highlightIndex}`);
    }

    return action;
  }

  async loadAndRerun(
    historyFile?: string,
    options: {
      maxRetries?: number;
      skipFailures?: boolean;
      delayBetweenActions?: number;
    } = {}
  ): Promise<ActionResult[]> {
    if (!historyFile) {
      historyFile = 'AgentHistory.json';
    }
    const history = AgentHistoryList.loadFromFile(historyFile, AgentOutput);
    return await this.rerunHistory(history, options.maxRetries, options.skipFailures, options.delayBetweenActions);
  }

  saveHistory(filePath?: string): void {
    if (!filePath) {
      filePath = 'AgentHistory.json';
    }
    this.history.saveToFile(filePath);
  }

  private convertAction(action: Record<ActionUnionType, ActionModel>): ActionModel {

    const actionType = Object.keys(action)[0] as ActionUnionType;
    const ActionClass = this.controller.getActionType(actionType);
    if (!ActionClass) {
      throw new Error(`Unknown action type: ${actionType}`);
    }
    // Create a new instance of the action class with the appropriate parameters
    this.c
  }

  private async handleError(error: Error): Promise<ActionResult> {
    logger.error(`Error: ${error.message}`);
    return new ActionResult({
      isDone: false,
      extractedContent: null,
      error: error.message,
      includeInMemory: true
    });
  }

  private async handleRateLimitError(error: Error): Promise<ActionResult> {
    logger.error(`Rate limit error: ${error.message}`);
    return new ActionResult({
      isDone: false,
      extractedContent: null,
      error: error.message,
      includeInMemory: true
    });
  }
}
