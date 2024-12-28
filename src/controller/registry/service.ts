import type { BrowserContext } from '../../browser';
import type { ActionFunction, ActionRegistration } from '../types';

export class Registry {
  private readonly actions: Map<string, ActionRegistration> = new Map();

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

  constructor() {
    // Browser actions
    this.action('go_to_url', 'Navigate to a URL', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        await page.goto(args.url as string);
        return [{
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    // Click actions
    this.action('click_element', 'Click an element by index', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const index = args.index as number;
        await page.evaluate((idx: number) => {
          const elements = Array.from(document.querySelectorAll('*'));
          for (const element of elements) {
            const indexAttr = (element as HTMLElement).dataset.index;
            if (indexAttr && Number.parseInt(indexAttr, 10) === idx) {
              (element as HTMLElement).click();
              return;
            }
          }
          throw new Error(`Element with index ${idx} not found`);
        }, index);

        return [{
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    // Input actions
    this.action('input_text', 'Input text into an element', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const index = args.index as number;
        const text = args.text as string;

        await page.evaluate(({ idx, txt }) => {
          const elements = Array.from(document.querySelectorAll('*'));
          for (const element of elements) {
            const indexAttr = (element as HTMLElement).dataset.index;
            if (indexAttr && Number.parseInt(indexAttr, 10) === idx) {
              if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                element.value = txt;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                return;
              }
              throw new Error(`Element with index ${idx} is not an input element`);
            }
          }
          throw new Error(`Element with index ${idx} not found`);
        }, { idx: index, txt: text });

        return [{
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    // Extract actions
    this.action('extract_text', 'Extract text from an element', true)(async (args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const index = args.index as number;
        const text = await page.evaluate((idx: number) => {
          const elements = Array.from(document.querySelectorAll('*'));
          for (const element of elements) {
            const indexAttr = (element as HTMLElement).dataset.index;
            if (indexAttr && Number.parseInt(indexAttr, 10) === idx) {
              return element.textContent || '';
            }
          }
          throw new Error(`Element with index ${idx} not found`);
        }, index);

        return [{
          extracted_content: text,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    this.action('extract_page_content', 'Extract all page content', true)(async (_args: Record<string, unknown>, browser?: BrowserContext) => {
      if (!browser) {
        return [{
          error: 'Browser context required',
          is_done: false
        }];
      }

      try {
        const page = await browser.get_current_page();
        const content = await page.evaluate(() => document.body.textContent || '');
        return [{
          extracted_content: content,
          is_done: false
        }];
      } catch (error) {
        return [{
          error: error instanceof Error ? error.message : String(error),
          is_done: false
        }];
      }
    });

    // Task completion
    this.action('done', 'Mark task as complete', false)(async (args: Record<string, unknown>) => {
      return [{
        extracted_content: args.result as string,
        is_done: true
      }];
    });
  }
}