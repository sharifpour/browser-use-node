import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import type { BrowserContextOptions, ElementHandle, Page, Browser as PlaywrightBrowser, BrowserContext as PlaywrightBrowserContext } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { DomService } from '../dom/service';
import { DOMElementNode } from '../dom/types';
import { logger } from '../utils/logging';
import { BrowserError, type BrowserState, type TabInfo } from './views';

export interface BrowserContextWindowSize {
  width: number;
  height: number;
}

export class BrowserContextConfig {
  cookiesFile?: string;
  minimumWaitPageLoadTime = 0.5;
  waitForNetworkIdlePageLoadTime = 1;
  maximumWaitPageLoadTime = 5;
  waitBetweenActions = 1;
  disableSecurity = false;
  browserWindowSize: BrowserContextWindowSize = { width: 1280, height: 1100 };
  noViewport?: boolean;
  saveRecordingPath?: string;
  tracePath?: string;

  constructor(config: Partial<BrowserContextConfig> = {}) {
    Object.assign(this, config);
  }
}

interface BrowserSession {
  context: PlaywrightBrowserContext;
  currentPage: Page;
  cachedState: BrowserState;
}

export class BrowserContext {
  contextId: string;
  config: BrowserContextConfig;
  browser: PlaywrightBrowser;
  session: BrowserSession | null = null;
  private domService: DomService | null = null;

  constructor(
    browser: PlaywrightBrowser,
    config: BrowserContextConfig = new BrowserContextConfig()
  ) {
    this.contextId = uuidv4();
    logger.debug(`Initializing new browser context with id: ${this.contextId}`);
    this.config = config;
    this.browser = browser;
  }

  async [Symbol.asyncDispose]() {
    await this.close();
  }

  async close(): Promise<void> {
    logger.debug('Closing browser context');

    try {
      if (!this.session) {
        return;
      }

      await this.saveCookies();

      if (this.config.tracePath) {
        try {
          await this.session.context.tracing.stop({
            path: join(this.config.tracePath, `${this.contextId}.zip`)
          });
        } catch (error) {
          logger.debug(`Failed to stop tracing: ${error}`);
        }
      }

      try {
        await this.session.context.close();
      } catch (error) {
        logger.debug(`Failed to close context: ${error}`);
      }
    } finally {
      this.session = null;
      this.domService = null;
    }
  }

  async initializeSession(): Promise<BrowserSession> {
    logger.debug('Initializing browser context');

    const context = await this.createContext(this.browser);
    const page = await context.newPage();

    const initialState: BrowserState = {
      elementTree: new DOMElementNode(
        true,  // isVisible
        'root', // tagName
        '',     // xpath
        {},     // attributes
        [],     // children
        false,  // isInteractive
        true,   // isTopElement
        false,  // shadowRoot
        null,   // highlightIndex
        null    // parent
      ),
      selectorMap: {},
      url: page.url(),
      title: await page.title(),
      tabs: [],
      screenshot: undefined
    };

    const session: BrowserSession = {
      context,
      currentPage: page,
      cachedState: initialState
    };

    await this.addNewPageListener(context);

    this.session = session;
    return session;
  }

  async addNewPageListener(context: PlaywrightBrowserContext): Promise<void> {
    context.on('page', async (page: Page) => {
      await page.waitForLoadState();
      logger.debug(`New page opened: ${page.url()}`);
      if (this.session) {
        this.session.currentPage = page;
      }
    });
  }

  async getSession(): Promise<BrowserSession> {
    if (!this.session) {
      return await this.initializeSession();
    }
    return this.session;
  }

  async getCurrentPage(): Promise<Page> {
    const session = await this.getSession();
    return session.currentPage;
  }

  async createContext(browser: PlaywrightBrowser): Promise<PlaywrightBrowserContext> {
    const contexts = browser.contexts();
    if (contexts.length > 0) {
      return contexts[0];
    }

    const contextOptions: BrowserContextOptions = {
      viewport: this.config.browserWindowSize,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
      javaScriptEnabled: true,
      bypassCSP: this.config.disableSecurity,
      ignoreHTTPSErrors: this.config.disableSecurity,
      recordVideo: this.config.saveRecordingPath ? {
        dir: this.config.saveRecordingPath
      } : undefined
    };

    const context = await browser.newContext(contextOptions);

    if (this.config.tracePath) {
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    }

    return context;
  }

  async waitForStableNetwork(): Promise<void> {
    const page = await this.getCurrentPage();
    const startTime = Date.now();
    let lastRequestTime = startTime;
    let requestCount = 0;
    let responseCount = 0;

    const requestListener = () => {
      requestCount++;
      lastRequestTime = Date.now();
    };

    const responseListener = () => {
      responseCount++;
    };

    page.on('request', requestListener);
    page.on('response', responseListener);

    try {
      while (Date.now() - lastRequestTime < this.config.waitForNetworkIdlePageLoadTime * 1000) {
        if (Date.now() - startTime > this.config.maximumWaitPageLoadTime * 1000) {
          logger.debug('Maximum wait time exceeded, proceeding');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      page.off('request', requestListener);
      page.off('response', responseListener);
    }

    logger.debug(`Network stabilized after ${Date.now() - startTime}ms`);
    logger.debug(`Requests: ${requestCount}, Responses: ${responseCount}`);
  }

  async waitForPageAndFramesLoad(timeoutOverwrite?: number): Promise<void> {
    const page = await this.getCurrentPage();
    const timeout = timeoutOverwrite || this.config.maximumWaitPageLoadTime * 1000;

    try {
      await Promise.all([
        page.waitForLoadState('load', { timeout }),
        page.waitForLoadState('domcontentloaded', { timeout }),
        this.waitForStableNetwork()
      ]);
    } catch (error) {
      logger.debug(`Page load timeout after ${timeout}ms: ${error}`);
    }

    await new Promise(resolve => setTimeout(resolve, this.config.minimumWaitPageLoadTime * 1000));
  }

  async navigateTo(url: string): Promise<void> {
    const page = await this.getCurrentPage();
    try {
      logger.debug(`Navigating to ${url}`);
      const response = await page.goto(url);
      if (!response) {
        throw new Error('Navigation failed - no response received');
      }
      if (!response.ok()) {
        throw new Error(`Navigation failed with status ${response.status()}: ${response.statusText()}`);
      }
      logger.debug(`Successfully navigated to ${url}`);
      await this.waitForPageAndFramesLoad();
    } catch (error) {
      logger.error(`Navigation failed: ${error}`);
      throw new BrowserError(`Failed to navigate to ${url}: ${error}`);
    }
  }

  async refreshPage(): Promise<void> {
    const page = await this.getCurrentPage();
    await page.reload();
    await this.waitForPageAndFramesLoad();
  }

  async goBack(): Promise<void> {
    const page = await this.getCurrentPage();
    await page.goBack();
    await this.waitForPageAndFramesLoad();
  }

  async goForward(): Promise<void> {
    const page = await this.getCurrentPage();
    await page.goForward();
    await this.waitForPageAndFramesLoad();
  }

  async closeCurrentTab(): Promise<void> {
    const session = await this.getSession();
    const pages = session.context.pages();

    if (pages.length <= 1) {
      throw new BrowserError('Cannot close the last tab');
    }

    await session.currentPage.close();
    session.currentPage = pages[pages.length - 2];
  }

  async getPageHtml(): Promise<string> {
    const page = await this.getCurrentPage();
    return await page.content();
  }

  async executeJavaScript<T>(script: string): Promise<T> {
    const page = await this.getCurrentPage();
    return await page.evaluate(script) as T;
  }

  async getState(useVision = false): Promise<BrowserState> {
    const session = await this.getSession();
    if (!this.domService) {
      this.domService = new DomService(session.currentPage);
    }
    return this.updateState(useVision);
  }

  async updateState(useVision = false): Promise<BrowserState> {
    const session = await this.getSession();
    if (!this.domService) {
      this.domService = new DomService(session.currentPage);
    }

    const domState = await this.domService.getDomState(useVision);
    const tabs = await this.getTabsInfo();
    const url = session.currentPage.url();
    const title = await session.currentPage.title();
    const screenshot = useVision ? await this.takeScreenshot() : undefined;

    const state: BrowserState = {
      elementTree: domState.elementTree,
      selectorMap: domState.selectorMap,
      url,
      title,
      tabs: tabs.map(tab => ({
        pageId: Number(tab.pageId),
        url: tab.url,
        title: tab.title
      })),
      screenshot
    };

    session.cachedState = state;
    return state;
  }

  async takeScreenshot(fullPage = false): Promise<string | undefined> {
    const session = await this.getSession();
    try {
      const buffer = await session.currentPage.screenshot({
        fullPage,
        type: 'jpeg',
        quality: 80
      });
      return buffer.toString('base64');
    } catch (error) {
      logger.error(`Failed to take screenshot: ${error}`);
      return undefined;
    }
  }

  async removeHighlights(): Promise<void> {
    const page = await this.getCurrentPage();
    await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-highlight]');
      elements.forEach((el: Element) => {
        el.removeAttribute('data-highlight');
        (el as HTMLElement).style.removeProperty('outline');
        (el as HTMLElement).style.removeProperty('background-color');
      });
    });
  }

  convertSimpleXPathToCssSelector(xpath: string): string {
    // Convert simple XPath expressions to CSS selectors
    const match = xpath.match(/^\/\/(\w+)(?:\[@id='([^']+)'\])?(?:\[@class='([^']+)'\])?$/);
    if (!match) return '';

    const [, tag, id, className] = match;
    let selector = tag || '*';
    if (id) selector += `#${id}`;
    if (className) selector += `.${className.replace(/\s+/g, '.')}`;
    return selector;
  }

  enhancedCssSelectorForElement(element: DOMElementNode): string {
    const selectors: string[] = [];
    let current: DOMElementNode = element;
    let depth = 0;
    const maxDepth = 3;

    while (current && depth < maxDepth) {
      const tagName = current.tagName.toLowerCase();
      let selector = tagName;

      if (current.attributes.id) {
        selector = `#${current.attributes.id}`;
        selectors.unshift(selector);
        break;
      }

      if (current.attributes.class) {
        const classes = current.attributes.class.split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }

      if (current.parent) {
        const siblings = (current.parent.children as DOMElementNode[]).filter(
          child => child instanceof DOMElementNode && child.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      selectors.unshift(selector);
      const nextParent = current.parent;
      if (!nextParent || !(nextParent instanceof DOMElementNode)) {
        break;
      }
      current = nextParent;
      depth++;
    }

    return selectors.join(' > ');
  }

  async getLocateElement(element: DOMElementNode): Promise<ElementHandle | null> {
    const page = await this.getCurrentPage();

    // Try CSS selector first
    const cssSelector = this.enhancedCssSelectorForElement(element);
    try {
      const elementHandle = await page.$(cssSelector);
      if (elementHandle) return elementHandle;
    } catch (error) {
      logger.debug(`Failed to locate element with CSS selector: ${cssSelector}`);
    }

    // Fallback to XPath
    try {
      const [elementHandle] = await page.$$(element.xpath);
      return elementHandle || null;
    } catch (error) {
      logger.debug(`Failed to locate element with XPath: ${element.xpath}`);
      return null;
    }
  }

  async inputTextElementNode(elementNode: DOMElementNode, text: string): Promise<void> {
    try {
      const page = await this.getCurrentPage();
      const element = await this.getLocateElement(elementNode);

      if (!element) {
        throw new BrowserError(`Element not found: ${elementNode.xpath}`);
      }

      await element.scrollIntoViewIfNeeded();
      await element.fill('');
      await element.type(text);

      // Wait for potential dynamic updates
      await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => { });

    } catch (error) {
      throw new BrowserError(
        `Failed to input text into element: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async clickElementNode(elementNode: DOMElementNode): Promise<void> {
    const element = await this.getLocateElement(elementNode);
    if (!element) {
      throw new BrowserError('Element not found');
    }

    try {
      await element.click();
    } catch (error) {
      logger.debug(`Failed to click element: ${error}`);
      throw new BrowserError('Failed to click element');
    }
  }

  async getTabsInfo(): Promise<TabInfo[]> {
    const session = await this.getSession();
    const pages = session.context.pages();
    const tabInfos: TabInfo[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      tabInfos.push({
        pageId: i,
        url: page.url(),
        title: await page.title()
      });
    }

    return tabInfos;
  }

  async switchToTab(pageId: number): Promise<void> {
    const session = await this.getSession();
    const pages = session.context.pages();

    if (pageId < 0 || pageId >= pages.length) {
      throw new BrowserError('Invalid page ID');
    }

    session.currentPage = pages[pageId];
    await this.waitForPageAndFramesLoad();
  }

  async createNewTab(url?: string): Promise<void> {
    const session = await this.getSession();
    const page = await session.context.newPage();
    session.currentPage = page;

    if (url) {
      await this.navigateTo(url);
    }
  }

  async getSelectorMap(): Promise<Record<string, string>> {
    return {};
  }

  async getElementByIndex(index: number): Promise<ElementHandle | null> {
    const session = await this.getSession();
    if (!this.domService) {
      this.domService = new DomService(session.currentPage);
    }

    const state = await this.getState();
    const element = state.selectorMap[index];
    if (!element) {
      return null;
    }

    return this.getLocateElement(element);
  }

  async updateSelectorMap(): Promise<void> {
    const state = await this.getState();
    const page = await this.getCurrentPage();
    const elements = await page.$$('[data-highlight-index]');

    for (const element of elements) {
      const index = await element.getAttribute('data-highlight-index');
      if (index) {
        const elementNode = state.selectorMap[parseInt(index)];
        if (elementNode) {
          elementNode.xpath = `[data-highlight-index="${index}"]`;
        }
      }
    }
  }

  async saveCookies(): Promise<void> {
    if (!this.config.cookiesFile || !this.session) {
      return;
    }

    try {
      const cookies = await this.session.context.cookies();
      const cookiesDir = dirname(this.config.cookiesFile);
      if (cookiesDir) {
        await mkdir(cookiesDir, { recursive: true });
      }
      await writeFile(this.config.cookiesFile, JSON.stringify(cookies, null, 2));
      logger.info(`Saved ${cookies.length} cookies to ${this.config.cookiesFile}`);
    } catch (error) {
      logger.warning(`Failed to save cookies: ${error}`);
    }
  }

  async isFileUploader(
    elementNode: DOMElementNode,
    maxDepth = 3,
    currentDepth = 0
  ): Promise<boolean> {
    if (currentDepth >= maxDepth) {
      return false;
    }

    if (!(elementNode instanceof DOMElementNode)) {
      return false;
    }

    // Check for file input attributes
    if (elementNode.tagName.toLowerCase() === 'input') {
      const isUploader = (
        elementNode.attributes.type === 'file' ||
        elementNode.attributes.accept !== undefined
      );

      if (isUploader) {
        return true;
      }
    }

    // Recursively check children
    if (elementNode.children && currentDepth < maxDepth) {
      for (const child of elementNode.children) {
        if (child instanceof DOMElementNode) {
          if (await this.isFileUploader(child, maxDepth, currentDepth + 1)) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
