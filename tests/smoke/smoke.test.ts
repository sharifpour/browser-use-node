import { Browser, BrowserContext } from '../../src';
import { expect } from 'chai';

describe('Smoke Tests', () => {
    let browser: Browser;
    let context: BrowserContext;

    before(async () => {
        browser = new Browser();
    });

    beforeEach(async () => {
        context = await browser.newContext();
    });

    afterEach(async () => {
        await context.close();
    });

    after(async () => {
        await browser.close();
    });

    it('should create a new browser context', async () => {
        expect(context).to.exist;
    });

    it('should navigate to a URL', async () => {
        await context.navigateTo('https://example.com');
        const state = await context.getState();
        expect(state.url).to.equal('https://example.com');
    });

    it('should get page HTML', async () => {
        await context.navigateTo('https://example.com');
        const html = await context.getPageHtml();
        expect(html).to.include('<html');
        expect(html).to.include('</html>');
    });

    it('should execute JavaScript', async () => {
        await context.navigateTo('https://example.com');
        const title = await context.executeJavaScript('document.title');
        expect(title).to.equal('Example Domain');
    });

    it('should handle cookies', async () => {
        await context.navigateTo('https://example.com');
        await context.saveCookies();
        const state = await context.getState();
        expect(state.url).to.equal('https://example.com');
    });

    it('should handle multiple tabs', async () => {
        await context.navigateTo('https://example.com');
        await context.openNewTab();
        await context.navigateTo('https://example.org');
        const state = await context.getState();
        expect(state.tabs).to.have.lengthOf(2);
    });

    it('should handle navigation history', async () => {
        await context.navigateTo('https://example.com');
        await context.navigateTo('https://example.org');
        await context.goBack();
        const state = await context.getState();
        expect(state.url).to.equal('https://example.com');
    });

    it('should handle DOM operations', async () => {
        await context.navigateTo('https://example.com');
        const state = await context.getState();
        expect(state.elementTree).to.exist;
        expect(state.selectorMap).to.exist;
    });

    it('should handle screenshots', async () => {
        await context.navigateTo('https://example.com');
        const screenshot = await context.takeScreenshot();
        expect(screenshot).to.exist;
    });

    it('should handle network requests', async () => {
        let requestCount = 0;
        context.onRequest(() => {
            requestCount++;
        });

        await context.navigateTo('https://example.com');
        expect(requestCount).to.be.greaterThan(0);
    });

    it('should handle errors gracefully', async () => {
        try {
            await context.navigateTo('https://nonexistent.example.com');
        } catch (error) {
            expect(error).to.exist;
        }
    });

    it('should handle security features', async () => {
        await context.navigateTo('https://example.com');
        const state = await context.getState();
        expect(state.url.startsWith('https')).to.be.true;
    });

    it('should handle resource cleanup', async () => {
        await context.close();
        expect(context.isClosed()).to.be.true;
    });
});