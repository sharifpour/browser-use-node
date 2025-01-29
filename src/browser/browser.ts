import { chromium, type Browser as PlaywrightBrowser, type BrowserContext as PlaywrightBrowserContext } from 'playwright';
import { logger } from '../utils/logging';
import { BrowserContext, BrowserContextConfig } from './context';

export interface BrowserConfig {
  headless?: boolean;
  disableSecurity?: boolean;
  extraChromiumArgs?: string[];
  chromeInstancePath?: string;
  wssUrl?: string;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  newContextConfig?: BrowserContextConfig;
}

const defaultConfig: BrowserConfig = {
  headless: false,
  disableSecurity: true,
  extraChromiumArgs: [],
  chromeInstancePath: undefined,
  wssUrl: undefined,
  proxy: undefined,
  newContextConfig: new BrowserContextConfig()
};

export class Browser {
  private config: BrowserConfig;
  private playwrightBrowser: PlaywrightBrowser | null = null;

  constructor(config: BrowserConfig = {}) {
    logger.debug('Initializing new browser');
    this.config = { ...defaultConfig, ...config };
  }

  async newContext(config: BrowserContextConfig = new BrowserContextConfig()): Promise<BrowserContext> {
    const browser = await this.getPlaywrightBrowser();
    const browserContext = new BrowserContext(browser, config);
    await browserContext.initializeSession();
    return browserContext;
  }

  async getPlaywrightBrowser(): Promise<PlaywrightBrowser> {
    if (!this.playwrightBrowser) {
      this.playwrightBrowser = await this.init();
    }
    return this.playwrightBrowser;
  }

  private async init(): Promise<PlaywrightBrowser> {
    return await this.setupBrowser();
  }

  private async setupBrowser(): Promise<PlaywrightBrowser> {
    if (this.config.wssUrl) {
      return await chromium.connectOverCDP(this.config.wssUrl);
    }

    const args = [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--disable-background-timer-throttling',
      '--disable-popup-blocking',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-window-activation',
      '--disable-focus-on-load',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-startup-window',
      '--window-position=0,0',
      ...(this.config.disableSecurity ? [
        '--disable-web-security',
        '--disable-site-isolation-trials',
        '--disable-features=IsolateOrigins,site-per-process',
      ] : []),
      ...(this.config.extraChromiumArgs || [])
    ];

    return await chromium.launch({
      headless: this.config.headless,
      args,
      proxy: this.config.proxy
    });
  }

  async close(): Promise<void> {
    if (this.playwrightBrowser) {
      await this.playwrightBrowser.close();
      this.playwrightBrowser = null;
    }
  }

  // Forward Playwright Browser methods
  contexts(): PlaywrightBrowserContext[] {
    return this.playwrightBrowser?.contexts() || [];
  }

  isConnected(): boolean {
    return this.playwrightBrowser?.isConnected() || false;
  }

  version(): string {
    return this.playwrightBrowser?.version() || '';
  }

  // Cast this instance to PlaywrightBrowser
  async asPlaywrightBrowser(): Promise<PlaywrightBrowser> {
    if (!this.playwrightBrowser) {
      this.playwrightBrowser = await this.init();
    }
    return this.playwrightBrowser;
  }
}
