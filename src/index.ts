// Python source reference:
//
// from browser_use.logging_config import setup_logging
//
// setup_logging()
//
// from browser_use.agent.prompts import SystemPrompt as SystemPrompt
// from browser_use.agent.service import Agent as Agent
// from browser_use.agent.views import ActionModel as ActionModel
// from browser_use.agent.views import ActionResult as ActionResult
// from browser_use.agent.views import AgentHistoryList as AgentHistoryList
// from browser_use.browser.browser import Browser as Browser
// from browser_use.browser.browser import BrowserConfig as BrowserConfig
// from browser_use.controller.service import Controller as Controller
// from browser_use.dom.service import DomService as DomService
//
// __all__ = [
// 	'Agent',
// 	'Browser',
// 	'BrowserConfig',
// 	'Controller',
// 	'DomService',
// 	'SystemPrompt',
// 	'ActionResult',
// 	'ActionModel',
// 	'AgentHistoryList',
// ]

// TypeScript implementation:

import { SystemPrompt } from './agent/prompts';
import { Agent } from './agent/service';
import { ActionModel, ActionResult, AgentHistoryList } from './agent/views';
import { Browser, BrowserConfig } from './browser/browser';
import { Controller } from './controller/service';
import { DomService } from './dom/service';
import { setupLogging } from './utils/logging';

// Initialize logging
setupLogging();

export {
  ActionModel, ActionResult, Agent, AgentHistoryList, Browser,
  BrowserConfig,
  Controller,
  DomService,
  SystemPrompt
};
