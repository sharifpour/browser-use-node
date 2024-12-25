"use strict";
/**
 * Browser action controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
/**
 * Controller for browser actions
 */
class Controller {
    constructor() {
        this.registry = new Map();
        this.registerDefaultActions();
    }
    /**
     * Register all default browser actions
     */
    registerDefaultActions() {
        // Basic Navigation Actions
        const searchGoogleHandler = async (params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for search_google action");
            }
            const page = await browser.getPage();
            await page.goto(`https://www.google.com/search?q=${params.query}`);
            await page.waitForLoadState();
            const msg = `🔍  Searched for "${params.query}" in Google`;
            console.log(msg);
            return {
                extractedContent: msg,
                includeInMemory: true,
            };
        };
        searchGoogleHandler.requiresBrowser = true;
        this.registry.set("search_google", {
            name: "search_google",
            description: "Search Google for a query",
            handler: searchGoogleHandler,
        });
        const goToUrlHandler = async (params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for go_to_url action");
            }
            const page = await browser.getPage();
            await page.goto(params.url);
            await page.waitForLoadState();
            const msg = `🔗  Navigated to ${params.url}`;
            console.log(msg);
            return {
                extractedContent: msg,
                includeInMemory: true,
            };
        };
        goToUrlHandler.requiresBrowser = true;
        this.registry.set("go_to_url", {
            name: "go_to_url",
            description: "Navigate to a specific URL",
            handler: goToUrlHandler,
        });
        const goBackHandler = async (_params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for go_back action");
            }
            const page = await browser.getPage();
            await page.goBack();
            await page.waitForLoadState();
            const msg = "🔙  Navigated back";
            console.log(msg);
            return {
                extractedContent: msg,
                includeInMemory: true,
            };
        };
        goBackHandler.requiresBrowser = true;
        this.registry.set("go_back", {
            name: "go_back",
            description: "Navigate back in history",
            handler: goBackHandler,
        });
        // Element Interaction Actions
        const clickElementHandler = async (params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for click_element action");
            }
            const page = await browser.getPage();
            const initialPages = (await browser.getPages()).length;
            try {
                // Special handling for Google search results
                if (page.url().includes('google.com')) {
                    // Try to click the first search result
                    const searchResults = await page.$$('div.g a');
                    if (searchResults.length > 0) {
                        await searchResults[0].click();
                        const msg = "🖱️  Clicked first Google search result";
                        console.log(msg);
                        return {
                            success: true,
                            extractedContent: msg,
                            includeInMemory: true,
                        };
                    }
                }
                // Default index-based behavior
                const session = await browser.getSession();
                const state = session.cachedState;
                if (!(params.index in state.selectorMap)) {
                    throw new Error(`Element with index ${params.index} does not exist - retry or use alternative actions`);
                }
                const elementNode = state.selectorMap[params.index];
                // Check if element is a file uploader
                if (await browser.isFileUploader(elementNode)) {
                    const msg = `Index ${params.index} - has an element which opens file upload dialog. To upload files please use a specific function to upload files`;
                    console.log(msg);
                    return {
                        success: true,
                        extractedContent: msg,
                        includeInMemory: true,
                    };
                }
                // Get viewport size for default click position
                const viewport = page.viewportSize() || { width: 800, height: 600 };
                // Use center of viewport if no coordinates provided
                const x = params.x ?? Math.floor(viewport.width / 2);
                const y = params.y ?? Math.floor(viewport.height / 2);
                // Click at coordinates
                await page.mouse.click(x, y);
                let msg = `🖱️  Clicked at (${x}, ${y})`;
                console.log(msg);
                // Check if a new tab was opened
                const currentPages = (await browser.getPages()).length;
                if (currentPages > initialPages) {
                    const newTabMsg = "New tab opened - switching to it";
                    msg += ` - ${newTabMsg}`;
                    console.log(newTabMsg);
                    await browser.switchToTab(-1);
                }
                return {
                    success: true,
                    extractedContent: msg,
                    includeInMemory: true,
                };
            }
            catch (error) {
                console.warn(error.message);
                return {
                    success: false,
                    error: error.message,
                };
            }
        };
        clickElementHandler.requiresBrowser = true;
        this.registry.set("click_element", {
            name: "click_element",
            description: "Click on an element",
            handler: clickElementHandler,
        });
        const inputTextHandler = async (params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for input_text action");
            }
            const page = await browser.getPage();
            try {
                // Press Enter after typing if it's a search
                const isSearch = params.text.toLowerCase().includes('search') ||
                    page.url().includes('google.com') ||
                    page.url().includes('search');
                await page.keyboard.type(params.text);
                if (isSearch) {
                    await page.keyboard.press('Enter');
                }
                const msg = `⌨️  Typed "${params.text}"${isSearch ? ' and pressed Enter' : ''}`;
                console.log(msg);
                return {
                    isDone: false,
                    message: msg,
                    data: { text: params.text }
                };
            }
            catch (error) {
                throw new Error(`Failed to input text: ${error.message}`);
            }
        };
        inputTextHandler.requiresBrowser = true;
        this.registry.set("input_text", {
            name: "input_text",
            description: "Input text into an element",
            handler: inputTextHandler,
        });
        // Tab Management Actions
        const switchTabHandler = async (params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for switch_tab action");
            }
            await browser.switchToTab(params.index);
            const page = await browser.getPage();
            await page.waitForLoadState();
            const msg = `🔄  Switched to tab ${params.index}`;
            console.log(msg);
            return {
                extractedContent: msg,
                includeInMemory: true,
            };
        };
        switchTabHandler.requiresBrowser = true;
        this.registry.set("switch_tab", {
            name: "switch_tab",
            description: "Switch to a different tab",
            handler: switchTabHandler,
        });
        const openTabHandler = async (params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for open_tab action");
            }
            await browser.createNewTab(params.url);
            const msg = `🔗  Opened new tab with ${params.url}`;
            console.log(msg);
            return {
                extractedContent: msg,
                includeInMemory: true,
            };
        };
        openTabHandler.requiresBrowser = true;
        this.registry.set("open_tab", {
            name: "open_tab",
            description: "Open URL in new tab",
            handler: openTabHandler,
        });
        // Content Actions
        const extractPageContentHandler = async (params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for extract_page_content action");
            }
            const page = await browser.getPage();
            try {
                // Get page content based on format
                const format = params.format || 'text';
                let content;
                switch (format) {
                    case 'html':
                        content = await page.content();
                        break;
                    case 'markdown':
                        // Convert HTML to markdown-like format
                        content = await page.evaluate(() => {
                            const links = Array.from(document.querySelectorAll('a')).map(a => `[${a.textContent}](${a.href})`).join('\n');
                            const text = document.body.innerText
                                .split('\n')
                                .filter(line => line.trim())
                                .join('\n\n');
                            return `${text}\n\nLinks:\n${links}`;
                        });
                        break;
                    default: // handles 'text' and any other cases
                        content = await page.evaluate(() => {
                            // Get search results
                            const results = Array.from(document.querySelectorAll('div.g')).map(div => {
                                const title = div.querySelector('h3')?.textContent || '';
                                const snippet = div.querySelector('div.VwiC3b')?.textContent || '';
                                const link = div.querySelector('a')?.href || '';
                                return `${title}\n${snippet}\n${link}\n`;
                            }).join('\n---\n');
                            return results || document.body.innerText;
                        });
                        break;
                }
                const msg = `📄 Extracted page content (${format} format):\n${content.slice(0, 150)}...`;
                console.log(msg);
                return {
                    success: true,
                    extractedContent: content,
                    includeInMemory: true,
                    data: { format, content }
                };
            }
            catch (error) {
                console.warn(error.message);
                return {
                    success: false,
                    error: error.message,
                };
            }
        };
        extractPageContentHandler.requiresBrowser = true;
        this.registry.set("extract_page_content", {
            name: "extract_page_content",
            description: "Extract content from the current page",
            handler: extractPageContentHandler,
        });
        const scrollDownHandler = async (params, browser) => {
            if (!browser) {
                throw new Error("Browser context is required for scroll_down action");
            }
            const page = await browser.getPage();
            if (params.amount !== undefined) {
                await page.evaluate(`window.scrollBy(0, ${params.amount});`);
            }
            else {
                await page.keyboard.press("PageDown");
            }
            const amount = params.amount !== undefined ? `${params.amount} pixels` : "one page";
            const msg = `🔍  Scrolled down the page by ${amount}`;
            console.log(msg);
            return {
                extractedContent: msg,
                includeInMemory: true,
            };
        };
        scrollDownHandler.requiresBrowser = true;
        this.registry.set("scroll_down", {
            name: "scroll_down",
            description: "Scroll down the page",
            handler: scrollDownHandler,
        });
        const doneHandler = async (params) => {
            return {
                extractedContent: params.message,
                includeInMemory: true,
                data: params.data,
                isDone: true,
            };
        };
        this.registry.set("done", {
            name: "done",
            description: "Complete task",
            handler: doneHandler,
        });
    }
    /**
     * Execute an action
     */
    async executeAction(actionName, params, browser) {
        const action = this.registry.get(actionName);
        if (!action) {
            throw new Error(`Unknown action: ${actionName}`);
        }
        if (action.handler.requiresBrowser && !browser) {
            throw new Error(`Action ${actionName} requires a browser context`);
        }
        return action.handler(params, browser);
    }
}
exports.Controller = Controller;
