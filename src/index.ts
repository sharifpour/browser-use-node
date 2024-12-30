

import { SystemPrompt } from './agent/prompts';
import { Agent } from './agent/service';
import {  ActionResult, AgentHistoryList } from './agent/views';
import { Browser, BrowserConfig } from './browser/browser';
import { Controller } from './controller/service';
import { DomService } from './dom/service';
import { logger } from './utils/logging';

// Initialize logging
const setupLogging = () => {
  logger.info('Setting up logging');
  logger.info('Browser User Agent is running');
};

setupLogging();

export {
   ActionResult, Agent, AgentHistoryList, Browser,
  BrowserConfig,
  Controller,
  DomService,
  SystemPrompt
};
