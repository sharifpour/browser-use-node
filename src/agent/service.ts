import * as fs from 'fs/promises';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BaseMessage } from 'langchain/schema';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Browser } from '../browser/browser';
import { BrowserContext, BrowserContextConfig } from '../browser/context';
import { type BrowserState, BrowserStateHistory } from '../browser/views';
import { ActionModel } from '../controller/registry/views';
import { Controller } from '../controller/service';
import { type DOMHistoryElement } from '../dom/history_tree_processor/service';
import { timeExecutionAsync } from '../utils';
import { logger } from '../utils/logging';
import { MessageManager } from './message_manager/service';
import { SystemPrompt } from './prompts';
import {
  ActionResult,
  AgentError,
  AgentHistory,
  AgentHistoryList,
  AgentOutput,
  type AgentStepInfo
} from './views';

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
  private browser: Browser | null;
  private browserContext: BrowserContext;
  private maxFailures: number;
  private retryDelay: number;
  private validateOutput: boolean;
  private messageManager: MessageManager;
  private history: AgentHistoryList;
  private nSteps: number = 1;
  private consecutiveFailures: number = 0;
  private maxInputTokens: number;
  private systemPromptClass: typeof SystemPrompt;
  private ActionModel: typeof ActionModel = ActionModel;
  private AgentOutput: typeof AgentOutput = AgentOutput;

  constructor(
    {
      task,
      llm,
      browser,
      browserContext,
      controller = new Controller(),
      useVision = true,
      saveConversationPath,
      maxFailures = 5,
      retryDelay = 10,
      systemPromptClass = SystemPrompt,
      maxInputTokens = 128000,
      validateOutput = false,
      includeAttributes = [
        'title',
        'type',
        'name',
        'role',
        'tabindex',
        'aria-label',
        'placeholder',
        'value',
        'alt',
        'aria-expanded',
      ],
      maxErrorLength = 400,
      maxActionsPerStep = 10,
    }: {
      task: string;
      llm?: ChatOpenAI;
      browser?: Browser;
      browserContext?: BrowserContext;
      controller?: Controller;
      useVision?: boolean;
      saveConversationPath?: string;
      maxFailures?: number;
      retryDelay?: number;
      systemPromptClass?: typeof SystemPrompt;
      maxInputTokens?: number;
      validateOutput?: boolean;
      includeAttributes?: string[];
      maxErrorLength?: number;
      maxActionsPerStep?: number;
    }
  ) {
    this.agentId = uuidv4();
    this.task = task;
    this.useVision = useVision;
    this.llm = llm || new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0
    });
    this.saveConversationPath = saveConversationPath;
    this.includeAttributes = includeAttributes;
    this.maxErrorLength = maxErrorLength;
    this.controller = controller;
    this.maxActionsPerStep = maxActionsPerStep;
    this.maxInputTokens = maxInputTokens;
    this.systemPromptClass = systemPromptClass;

    // Browser setup
    this.injectedBrowser = browser !== undefined;
    this.injectedBrowserContext = browserContext !== undefined;

    // Initialize browser first if needed
    this.browser = browser || (browserContext ? null : new Browser());

    // Initialize browser context
    if (browserContext) {
      this.browserContext = browserContext;
    } else {
      this.browser = this.browser || new Browser();
      this.browserContext = null as any; // Will be initialized in initialize()
    }

    // Setup action models
    this.setupActionModels();

    // Initialize message manager
    this.messageManager = new MessageManager({
      llm: this.llm,
      task,
      actionDescriptions: this.controller.getPromptDescription(),
      systemPromptClass,
      maxInputTokens,
      includeAttributes,
      maxErrorLength,
      maxActionsPerStep
    });

    // Other settings
    this.maxFailures = maxFailures;
    this.retryDelay = retryDelay;
    this.validateOutput = validateOutput;
    this.history = new AgentHistoryList({ history: [] });

    if (saveConversationPath) {
      logger.info(`Saving conversation to ${saveConversationPath}`);
    }
  }

  private setupActionModels(): void {
    this.ActionModel = this.controller.createActionModel();
  }

  @timeExecutionAsync('--get_next_action')
  private async getNextAction(messages: BaseMessage[]): Promise<AgentOutput> {
    const schema = this.AgentOutput.typeWithCustomActions(this.ActionModel);
    const structuredLLM = this.llm.withStructuredOutput(schema);
    const response = await structuredLLM.invoke(messages);
    const parsed = response as unknown as AgentOutput;

    // Cut the number of actions to max_actions_per_step
    parsed.action = parsed.action.slice(0, this.maxActionsPerStep);
    this.logResponse(parsed);
    this.nSteps++;

    return parsed;
  }

  private logResponse(response: AgentOutput): void {
    let emoji = '🤷';
    if (response.currentState.evaluationPreviousGoal.includes('Success')) {
      emoji = '👍';
    } else if (response.currentState.evaluationPreviousGoal.includes('Failed')) {
      emoji = '⚠️';
    }

    logger.info(`${emoji} Eval: ${response.currentState.evaluationPreviousGoal}`);
    logger.info(`🧠 Memory: ${response.currentState.memory}`);
    logger.info(`🎯 Next goal: ${response.currentState.nextGoal}`);

    response.action.forEach((action, i) => {
      const actionName = action.constructor.name;
      logger.info(
        `🛠️  Action ${i + 1}/${response.action.length}: ${actionName} ${JSON.stringify(action)}`
      );
    });
  }

  private async saveConversation(messages: BaseMessage[], output: AgentOutput | null): Promise<void> {
    if (!this.saveConversationPath) return;

    try {
      const conversationData = {
        messages: messages.map(m => ({
          type: m._getType(),
          content: m.content
        })),
        output: output ? {
          currentState: {
            evaluationPreviousGoal: output.currentState.evaluationPreviousGoal,
            memory: output.currentState.memory,
            nextGoal: output.currentState.nextGoal
          },
          action: output.action.map(a => JSON.parse(JSON.stringify(a)))
        } : null
      };

      const dirPath = path.dirname(this.saveConversationPath);
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(
        this.saveConversationPath,
        JSON.stringify(conversationData, null, 2)
      );
    } catch (error) {
      logger.error(`Failed to save conversation: ${error}`);
    }
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

      this.saveConversation(inputMessages, modelOutput);
      this.messageManager.removeLastStateMessage();
      if (modelOutput) {
        this.messageManager.addModelOutput(modelOutput);
        result = await this.controller.multiAct(modelOutput.action, this.browserContext);
      }
      this.lastResult = result;

      if (result.length > 0 && result[result.length - 1].isDone) {
        logger.info(`📄 Result: ${result[result.length - 1].extractedContent}`);
      }

      this.consecutiveFailures = 0;
    } catch (error) {
      if (error instanceof Error) {
        result = await this.handleStepError(error);
        this.lastResult = result;
      }
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

  private async handleStepError(error: Error): Promise<ActionResult[]> {
    this.consecutiveFailures++;
    logger.error(`Step error: ${error.message}`);

    if (this.consecutiveFailures >= this.maxFailures) {
      throw new AgentError(
        `Max failures (${this.maxFailures}) reached. Last error: ${error.message}`
      );
    }

    logger.info(
      `Retrying in ${this.retryDelay} seconds (failure ${this.consecutiveFailures}/${this.maxFailures})`
    );
    await new Promise(resolve => setTimeout(resolve, this.retryDelay * 1000));

    return [
      new ActionResult({
        error: error.message,
        includeInMemory: true
      })
    ];
  }

  private makeHistoryItem(
    modelOutput: AgentOutput | null,
    state: BrowserState,
    result: ActionResult[]
  ): void {
    let interactedElements: (DOMHistoryElement | null)[] = [null];

    if (modelOutput) {
      interactedElements = AgentHistory.getInteractedElement(modelOutput, state.selectorMap) as (DOMHistoryElement | null)[];
    }

    const stateHistory = new BrowserStateHistory(
      state.url,
      state.title,
      state.tabs,
      interactedElements,
      state.screenshot || null
    );

    this.history.history.push(new AgentHistory({
      modelOutput: modelOutput ? {
        currentState: {
          evaluation_previous_goal: modelOutput.currentState.evaluationPreviousGoal,
          memory: modelOutput.currentState.memory,
          next_goal: modelOutput.currentState.nextGoal
        },
        action: modelOutput.action
      } : null,
      result,
      state: stateHistory
    }));
  }

  async initialize(): Promise<void> {
    if (this.browser && !this.browserContext) {
      const playwrightBrowser = await this.browser.asPlaywrightBrowser();
      this.browserContext = new BrowserContext(playwrightBrowser, new BrowserContextConfig());
      await this.browserContext.initializeSession();
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      let shouldContinue = true;
      while (shouldContinue) {
        const stepInfo: AgentStepInfo = {
          stepNumber: this.nSteps,
          maxSteps: 50 // Maximum steps before forcing completion
        };

        await this.step(stepInfo);

        // Check if we're done
        if (this.history.isDone()) {
          logger.info('Task completed successfully');
          shouldContinue = false;
        }

        // Check if we've hit the max steps
        if (this.nSteps >= stepInfo.maxSteps) {
          logger.warning('Maximum steps reached, forcing completion');
          shouldContinue = false;
        }
      }
    } finally {
      // Clean up if we created the browser/context
      if (!this.injectedBrowserContext) {
        await this.browserContext.close();
      }
      if (!this.injectedBrowser && this.browser) {
        await this.browser.close();
      }
    }
  }
}
