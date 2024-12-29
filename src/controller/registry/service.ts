import type { BrowserContext } from '../../browser';
import { MainContentExtractor } from '../../utils/content-extractor';
import { logger } from '../../utils/logger';
import type { ActionFunction, ActionRegistration } from '../types';

export class Registry {
  private readonly actions: Map<string, ActionRegistration> = new Map();

  constructor() {
    this._register_default_actions();
  }

  private _register_default_actions() {
    // Register all default browser actions
    this._register_navigation_actions();
    this._register_element_actions();
    this._register_tab_actions();
    this._register_content_actions();
    this._register_scroll_actions();
    this._register_keyboard_actions();
    this._register_dialog_actions();
    this._register_emulation_actions();
    this._register_cookie_actions();
    this._register_javascript_actions();
  }

  private _register_navigation_actions() {
    // Basic Navigation Actions
    this.action('search_google', 'Search Google in the current tab', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        await page.goto(`https://www.google.com/search?q=${args.query}`);
        await page.waitForLoadState();
        const msg = `🔍 Searched for "${args.query}" in Google`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    this.action('go_to_url', 'Navigate to URL in the current tab', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        await page.goto(args.url as string);
        await page.waitForLoadState();
        const msg = `🔗 Navigated to ${args.url}`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    this.action('go_back', 'Go back', true)(async (_args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        await page.goBack();
        await page.waitForLoadState();
        const msg = '🔙 Navigated back';
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  private _register_element_actions() {
    // Element Interaction Actions
    this.action('click_element', 'Click element', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const session = await browser.get_session();
        const state = session.cached_state;
        const index = args.index as number;

        if (!(index in state.selector_map)) {
          throw new Error(`Element with index ${index} does not exist - retry or use alternative actions`);
        }

        const element_node = state.selector_map[index];
        const initial_pages = session.context.pages().length;

        // Check if element has file uploader
        if (await browser.is_file_uploader(element_node)) {
          const msg = `Index ${index} - has an element which opens file upload dialog. To upload files please use a specific function to upload files`;
          logger.info(msg);
          return [{
            extracted_content: msg,
            include_in_memory: true,
            is_done: false
          }];
        }

        await browser._click_element_node(element_node);
        let msg = `🖱️ Clicked index ${index}`;
        logger.info(msg);
        logger.debug(`Element xpath: ${element_node.xpath}`);

        if (session.context.pages().length > initial_pages) {
          const new_tab_msg = 'New tab opened - switching to it';
          msg += ` - ${new_tab_msg}`;
          logger.info(new_tab_msg);
          await browser.switch_to_tab(-1);
        }

        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        logger.warning(`Element no longer available with index ${args.index} - most likely the page changed`);
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    this.action('input_text', 'Input text into a input interactive element', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const session = await browser.get_session();
        const state = session.cached_state;
        const index = args.index as number;
        const text = args.text as string;

        if (!(index in state.selector_map)) {
          throw new Error(`Element index ${index} does not exist - retry or use alternative actions`);
        }

        const element_node = state.selector_map[index];
        await browser._input_text_element_node(element_node, text);
        const msg = `⌨️ Input "${text}" into index ${index}`;
        logger.info(msg);
        logger.debug(`Element xpath: ${element_node.xpath}`);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  private _register_tab_actions() {
    // Tab Management Actions
    this.action('switch_tab', 'Switch tab', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        await browser.switch_to_tab(args.page_id as number);
        // Wait for tab to be ready
        const page = await browser.get_current_page();
        await page.waitForLoadState();
        const msg = `🔄 Switched to tab ${args.page_id}`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    this.action('open_tab', 'Open url in new tab', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        await browser.create_new_tab(args.url as string);
        const msg = `🔗 Opened new tab with ${args.url}`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  private _register_content_actions() {
    // Content Actions
    this.action('extract_page_content', 'Extract page content to get the text or markdown', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const html = await page.content();
        const content = MainContentExtractor.extract(html, args.value as 'text' | 'markdown');
        const msg = `📄 Extracted page content\n: ${content}\n`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    this.action('done', 'Complete task', false)(async (args: Record<string, unknown>) => {
      return [{
        is_done: true,
        extracted_content: args.text as string
      }];
    });
  }

  private _register_scroll_actions() {
    // Scroll Actions
    this.action('scroll_down', 'Scroll down the page by pixel amount', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const amount = args.amount as number | undefined;

        if (amount !== undefined) {
          await page.evaluate(`window.scrollBy(0, ${amount});`);
        } else {
          await page.keyboard.press('PageDown');
        }

        const amountStr = amount !== undefined ? `${amount} pixels` : 'one page';
        const msg = `🔍 Scrolled down the page by ${amountStr}`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    this.action('scroll_up', 'Scroll up the page by pixel amount - if no amount is specified, scroll up one page', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const amount = args.amount as number | undefined;

        if (amount !== undefined) {
          await page.evaluate(`window.scrollBy(0, -${amount});`);
        } else {
          await page.keyboard.press('PageUp');
        }

        const amountStr = amount !== undefined ? `${amount} pixels` : 'one page';
        const msg = `🔍 Scrolled up the page by ${amountStr}`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    // Scroll to Text Action
    this.action('scroll_to_text', 'If you dont find something which you want to interact with, scroll to it', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const text = args.text as string;

        // Try different locator strategies
        const locators = [
          page.getByText(text, { exact: false }),
          page.locator(`text=${text}`),
          page.locator(`//*[contains(text(), '${text}')]`)
        ];

        for (const locator of locators) {
          try {
            if (await locator.count() > 0 && await locator.first().isVisible()) {
              await locator.first().scrollIntoViewIfNeeded();
              await new Promise(resolve => setTimeout(resolve, 500)); // Wait for scroll to complete
              const msg = `🔍 Scrolled to text: ${text}`;
              logger.info(msg);
              return [{
                extracted_content: msg,
                include_in_memory: true,
                is_done: false
              }];
            }
          } catch (e) {
            continue;
          }
        }

        return [{
          error: `Could not find text: ${text}`,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  private _register_keyboard_actions() {
    // Keyboard Actions
    this.action('send_keys', 'Send keyboard keys and shortcuts', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const keys = args.keys as string;

        await page.keyboard.press(keys);
        const msg = `⌨️ Sent keys: ${keys}`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  private _register_dialog_actions() {
    // Dialog Actions
    this.action('accept_dialog', 'Accept dialog with optional text', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        page.on('dialog', dialog => dialog.accept(args.text as string));
        const msg = '✅ Dialog accepted';
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  private _register_emulation_actions() {
    // Emulation Actions
    this.action('set_viewport', 'Set viewport size and properties', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        await page.setViewportSize({
          width: args.width as number,
          height: args.height as number
        });
        const msg = `📱 Set viewport to ${args.width}x${args.height}`;
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  private _register_cookie_actions() {
    // Cookie Actions
    this.action('set_cookies', 'Set browser cookies', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const context = page.context();
        await context.addCookies(args.cookies as any[]);
        const msg = '🍪 Cookies set successfully';
        logger.info(msg);
        return [{
          extracted_content: msg,
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  private _register_javascript_actions() {
    // JavaScript Actions
    this.action('execute_javascript', 'Execute JavaScript in page context', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const result = await page.evaluate(args.script as string, ...(args.args as any[] || []));
        const msg = `🔧 JavaScript executed: ${args.script}`;
        logger.info(msg);
        return [{
          extracted_content: JSON.stringify(result),
          include_in_memory: true,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });
  }

  public action(name: string, description: string, requiresBrowser = false) {
    return (handler: ActionFunction): void => {
      this.actions.set(name, {
        description,
        handler,
        options: { requiresBrowser }
      });
    };
  }

  public get_action(name: string): ActionFunction | undefined {
    const registration = this.actions.get(name);
    return registration?.handler;
  }
}