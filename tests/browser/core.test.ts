import { Browser, BrowserConfig } from '@/browser/browser';
import { BrowserContext } from '@/browser/context';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('Core Browser Functionality', () => {
    let browser: Browser;
    let context: BrowserContext;

    beforeEach(async () => {
        browser = new Browser({
            headless: true,
            disableSecurity: true
        });
        context = await browser.newContext();
    });

    afterEach(async () => {
        await context?.close();
        await browser?.close();
    });

    it('should navigate to URL', async () => {
        await context.getPage().then(page => page.goto('https://example.com'));
        const state = await context.getState();
        expect(state.url).toContain('example.com');
    });

    it('should go back in history', async () => {
        const page = await context.getPage();
        await page.goto('https://example.com');
        await page.goto('https://google.com');
        await page.goBack();
        const state = await context.getState();
        expect(state.url).toContain('example.com');
    });

    it('should click elements', async () => {
        await context.getPage().then(page => page.goto('https://example.com'));
        const state = await context.getState();
        const link = state.clickableElements[0];
        await context.clickElementNode(link);
        const newState = await context.getState();
        expect(newState.url).not.toEqual(state.url);
    });

    it('should input text', async () => {
        await context.getPage().then(page => page.goto('https://google.com'));
        const state = await context.getState();
        const input = state.clickableElements.find(el => el.tagName === 'INPUT');
        expect(input).toBeDefined();
        await context.inputTextElementNode(input!, 'test search');
        const element = await context.getElementByXPath(input!.xpath);
        expect(element?.attributes.value).toBe('test search');
    });

    it('should manage tabs', async () => {
        // Create first tab
        await context.getPage().then(page => page.goto('https://example.com'));

        // Create second tab
        await context.createNewTab('https://google.com');

        // Switch back to first tab
        await context.switchToTab(0);

        const state = await context.getState();
        expect(state.tabs).toHaveLength(2);
        expect(state.url).toContain('example.com');
    });

    it('should extract page content', async () => {
        await context.getPage().then(page => page.goto('https://example.com'));
        const content = await context.getPageHtml();
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('Example Domain');
    });

    it('should handle cookies', async () => {
        await context.getPage().then(page => page.goto('https://example.com'));
        await context.setCookies([{
            name: 'test',
            value: 'value',
            domain: 'example.com',
            path: '/'
        }]);
        const cookies = await context.getCookies();
        expect(cookies).toHaveLength(1);
        expect(cookies[0].name).toBe('test');
        expect(cookies[0].value).toBe('value');
    });

    it('should handle network interception', async () => {
        const requests: string[] = [];
        await context.startRequestInterception();
        context.addRequestInterceptor({
            urlPattern: 'example.com',
            handler: async (route, request) => {
                requests.push(request.url());
                await route.continue();
            }
        });
        await context.getPage().then(page => page.goto('https://example.com'));
        expect(requests.length).toBeGreaterThan(0);
        expect(requests[0]).toContain('example.com');
    });

    it('should handle events', async () => {
        const consoleMessages: string[] = [];
        await context.onConsole(msg => {
            consoleMessages.push(msg.text());
        });
        await context.getPage().then(page =>
            page.evaluate(() => console.log('test message'))
        );
        expect(consoleMessages).toContain('test message');
    });
});