import type { ActionFunction, ActionRegistration } from '../types';

export class Registry {
  private readonly actions: Map<string, ActionRegistration> = new Map();

  public action(description: string, requiresBrowser = false) {
    return (handler: ActionFunction): void => {
      const name = description.toLowerCase().replace(/\s+/g, '_');
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

  constructor() {
    // Register default actions
    this.action('Navigate to URL', true)(async (params, browser) => {
      if (!browser) {
        return { success: false, error: 'Browser context required' };
      }
      const page = await browser.get_current_page();
      await page.goto(params.url as string);
      return { success: true };
    });

    this.action('Click element', true)(async (params, browser) => {
      if (!browser) {
        return { success: false, error: 'Browser context required' };
      }
      const page = await browser.get_current_page();
      await page.click(params.selector as string);
      return { success: true };
    });

    this.action('Type text', true)(async (params, browser) => {
      if (!browser) {
        return { success: false, error: 'Browser context required' };
      }
      const page = await browser.get_current_page();
      await page.type(params.selector as string, params.text as string);
      return { success: true };
    });

    this.action('Get text', true)(async (params, browser) => {
      if (!browser) {
        return { success: false, error: 'Browser context required' };
      }
      const page = await browser.get_current_page();
      const text = await page.$eval(params.selector as string, el => el.textContent);
      return { success: true, extracted_content: text || '' };
    });
  }
}