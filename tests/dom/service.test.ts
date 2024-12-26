import { Browser } from '@/browser/browser';
import type { BrowserContext } from '@/browser/context';
import { DOMService } from '@/dom/service';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('DOM Service', () => {
  let browser: Browser;
  let context: BrowserContext;
  let domService: DOMService;

  beforeEach(async () => {
    browser = new Browser({
      headless: true,
      disableSecurity: true
    });
    context = await browser.newContext();
    const page = await context.getPage();
    domService = new DOMService(page);
  });

  afterEach(async () => {
    await domService.cleanup();
    await context?.close();
    await browser?.close();
  });

  it('should observe DOM mutations', async () => {
    const mutations: any[] = [];
    await domService.startObserving();

    domService.onMutation(event => {
      mutations.push(event);
    });

    const page = await context.getPage();
    await page.setContent('<div id="root"></div>');
    await page.evaluate(() => {
      const root = document.getElementById('root');
      const child = document.createElement('span');
      child.textContent = 'test';
      root?.appendChild(child);
    });

    // Wait for mutation events
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mutations.length).toBeGreaterThan(0);
    expect(mutations.some(m => m.type === 'added')).toBe(true);
  });

  it('should wait for elements', async () => {
    const page = await context.getPage();
    await page.setContent('<div id="root"></div>');

    // Add element after delay
    setTimeout(() => {
      page.evaluate(() => {
        const root = document.getElementById('root');
        const child = document.createElement('span');
        child.id = 'test';
        child.textContent = 'test';
        root?.appendChild(child);
      });
    }, 100);

    await domService.waitForElement('#test');
    const element = await page.$('#test');
    expect(element).toBeDefined();
  });

  it('should wait for element removal', async () => {
    const page = await context.getPage();
    await page.setContent('<div id="root"><span id="test">test</span></div>');

    // Remove element after delay
    setTimeout(() => {
      page.evaluate(() => {
        const element = document.getElementById('test');
        element?.remove();
      });
    }, 100);

    await domService.waitForElementRemoval('#test');
    const element = await page.$('#test');
    expect(element).toBeNull();
  });

  it('should handle shadow DOM', async () => {
    const page = await context.getPage();
    await page.setContent(`
            <div id="host"></div>
            <script>
                const host = document.getElementById('host');
                const shadow = host.attachShadow({mode: 'open'});
                const child = document.createElement('span');
                child.id = 'shadow-child';
                child.textContent = 'shadow content';
                shadow.appendChild(child);
            </script>
        `);

    const element = await domService.querySelectorDeep('#shadow-child');
    expect(element).toBeDefined();
    const text = await element?.evaluate(el => el.textContent);
    expect(text).toBe('shadow content');
  });

  it('should handle iframes', async () => {
    const page = await context.getPage();
    await page.setContent(`
            <iframe id="frame1" srcdoc="<div id='frame-content'>frame text</div>"></iframe>
        `);

    // Wait for iframe to load
    await page.waitForSelector('#frame1');
    const iframe = await page.$('iframe');
    expect(iframe).toBeDefined();

    const content = await domService.getIframeContent(iframe!);
    expect(content).toBeDefined();
    expect(content?.textContent).toContain('frame text');
  });

  it('should check element visibility', async () => {
    const page = await context.getPage();
    await page.setContent(`
            <div id="visible">visible</div>
            <div id="hidden" style="display: none">hidden</div>
            <div id="transparent" style="opacity: 0">transparent</div>
        `);

    const visibleElement = await page.$('#visible');
    const hiddenElement = await page.$('#hidden');
    const transparentElement = await page.$('#transparent');

    expect(await domService.isElementVisible(visibleElement!)).toBe(true);
    expect(await domService.isElementVisible(hiddenElement!)).toBe(false);
    expect(await domService.isElementVisible(transparentElement!)).toBe(false);
  });

  it('should get detailed visibility info', async () => {
    const page = await context.getPage();
    await page.setContent(`
            <div id="test" style="position: absolute; top: 0; left: 0; width: 100px; height: 100px;">
                test element
            </div>
        `);

    const element = await page.$('#test');
    const info = await domService.getElementVisibilityInfo(element!);

    expect(info.isVisible).toBe(true);
    expect(info.isInViewport).toBe(true);
    expect(info.isClickable).toBe(true);
    expect(info.opacity).toBe(1);
    expect(info.boundingBox).toBeDefined();
    expect(info.boundingBox?.width).toBe(100);
    expect(info.boundingBox?.height).toBe(100);
  });

  it('should wait for element to become clickable', async () => {
    const page = await context.getPage();
    await page.setContent(`
            <button id="test" style="display: none">Click me</button>
            <script>
                setTimeout(() => {
                    document.getElementById('test').style.display = 'block';
                }, 100);
            </script>
        `);

    const element = await domService.waitForElementClickable('#test');
    expect(element).toBeDefined();
    const isVisible = await domService.isElementVisible(element);
    expect(isVisible).toBe(true);
  });

  it('should find most visible element', async () => {
    const page = await context.getPage();
    await page.setContent(`
            <div id="back" style="position: absolute; z-index: 1;">back element</div>
            <div id="front" style="position: absolute; z-index: 2;">front element</div>
        `);

    const elements = await page.$$('div');
    const mostVisible = await domService.getMostVisibleElement(elements);
    expect(mostVisible).toBeDefined();
    const id = await mostVisible?.evaluate(el => el.id);
    expect(id).toBe('front');
  });

  it('should build DOM tree with shadow DOM', async () => {
    const page = await context.getPage();
    await page.setContent(`
            <div id="host">
                <div class="regular">regular content</div>
            </div>
            <script>
                const host = document.getElementById('host');
                const shadow = host.attachShadow({mode: 'open'});
                const child = document.createElement('div');
                child.className = 'shadow';
                child.textContent = 'shadow content';
                shadow.appendChild(child);
            </script>
        `);

    const tree = await domService.buildDOMTreeWithShadow();
    expect(tree).toBeDefined();
    expect(tree.children.some(child =>
      child.children.some(grandChild =>
        grandChild.attributes.class === 'shadow'
      )
    )).toBe(true);
  });
});