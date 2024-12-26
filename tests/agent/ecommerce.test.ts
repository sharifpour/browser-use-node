import { Browser } from '@/browser/browser';
import type { BrowserContext } from '@/browser/context';
import { Controller } from '@/controller/controller';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('E-commerce Interactions', () => {
    let browser: Browser;
    let context: BrowserContext;
    let controller: Controller;

    beforeEach(async () => {
        browser = new Browser({
            headless: true,
            disableSecurity: true
        });
        context = await browser.newContext();
        controller = new Controller();
    });

    afterEach(async () => {
        await context?.close();
        await browser?.close();
    });

    it('should perform product search and filtering', async () => {
        // Register actions
        controller.action('Navigate to site', async (url: string, context: BrowserContext) => {
            const page = await context.getPage();
            await page.goto(url);
            return 'Navigation completed';
        });

        controller.action('Search for product', async (query: string, context: BrowserContext) => {
            const state = await context.getState();
            const searchInput = state.clickableElements.find(el =>
                el.tagName === 'INPUT' &&
                (el.attributes.type === 'search' || el.attributes.name?.includes('search'))
            );
            if (!searchInput) throw new Error('Search input not found');
            await context.inputTextElementNode(searchInput, query);
            return 'Search input completed';
        });

        controller.action('Apply filter', async (filterText: string, context: BrowserContext) => {
            const state = await context.getState();
            const filterElement = state.clickableElements.find(el =>
                el.textContent.toLowerCase().includes(filterText.toLowerCase())
            );
            if (!filterElement) throw new Error(`Filter ${filterText} not found`);
            await context.clickElementNode(filterElement);
            return 'Filter applied';
        });

        controller.action('Get first result price', async (context: BrowserContext) => {
            const state = await context.getState();
            const priceElement = state.clickableElements.find(el =>
                el.textContent.match(/\$\d+(\.\d{2})?/)
            );
            if (!priceElement) throw new Error('Price element not found');
            return `Found price: ${priceElement.textContent}`;
        });

        // Execute action sequence
        const results = await controller.executeActions([
            { name: 'navigate_to_site', params: { url: 'https://www.amazon.com' } },
            { name: 'search_for_product', params: { query: 'laptop' } },
            { name: 'apply_filter', params: { filterText: '4 Stars & Up' } },
            { name: 'get_first_result_price', params: {} }
        ], context);

        // Verify results
        expect(results).toHaveLength(4);
        expect(results[0].result).toBe('Navigation completed');
        expect(results[1].result).toBe('Search input completed');
        expect(results[2].result).toBe('Filter applied');
        expect(results[3].result).toMatch(/Found price: \$\d+(\.\d{2})?/);
    });

    it('should handle shopping cart operations', async () => {
        // Register actions
        controller.action('Add to cart', async (context: BrowserContext) => {
            const state = await context.getState();
            const addToCartButton = state.clickableElements.find(el =>
                el.textContent.toLowerCase().includes('add to cart')
            );
            if (!addToCartButton) throw new Error('Add to cart button not found');
            await context.clickElementNode(addToCartButton);
            return 'Product added to cart';
        });

        controller.action('View cart', async (context: BrowserContext) => {
            const state = await context.getState();
            const cartButton = state.clickableElements.find(el =>
                el.textContent.toLowerCase().includes('cart') ||
                el.attributes.href?.includes('cart')
            );
            if (!cartButton) throw new Error('Cart button not found');
            await context.clickElementNode(cartButton);
            return 'Cart opened';
        });

        controller.action('Update quantity', async (quantity: number, context: BrowserContext) => {
            const state = await context.getState();
            const quantityInput = state.clickableElements.find(el =>
                el.tagName === 'INPUT' &&
                (el.attributes.name?.includes('quantity') || el.attributes.type === 'number')
            );
            if (!quantityInput) throw new Error('Quantity input not found');
            await context.inputTextElementNode(quantityInput, quantity.toString());
            return 'Quantity updated';
        });

        // Execute shopping cart sequence
        const results = await controller.executeActions([
            { name: 'navigate_to_site', params: { url: 'https://www.amazon.com' } },
            { name: 'search_for_product', params: { query: 'laptop' } },
            { name: 'add_to_cart', params: {} },
            { name: 'view_cart', params: {} },
            { name: 'update_quantity', params: { quantity: 2 } }
        ], context);

        // Verify results
        expect(results).toHaveLength(5);
        expect(results[2].result).toBe('Product added to cart');
        expect(results[3].result).toBe('Cart opened');
        expect(results[4].result).toBe('Quantity updated');
    });

    it('should handle product comparison', async () => {
        // Register actions
        controller.action('Select product for comparison', async (index: number, context: BrowserContext) => {
            const state = await context.getState();
            const compareCheckbox = state.clickableElements.filter(el =>
                el.tagName === 'INPUT' &&
                el.attributes.type === 'checkbox' &&
                (el.attributes.name?.includes('compare') || el.textContent.toLowerCase().includes('compare'))
            )[index];
            if (!compareCheckbox) throw new Error(`Compare checkbox ${index} not found`);
            await context.clickElementNode(compareCheckbox);
            return `Product ${index + 1} selected for comparison`;
        });

        controller.action('Compare products', async (context: BrowserContext) => {
            const state = await context.getState();
            const compareButton = state.clickableElements.find(el =>
                el.textContent.toLowerCase().includes('compare')
            );
            if (!compareButton) throw new Error('Compare button not found');
            await context.clickElementNode(compareButton);
            return 'Comparison view opened';
        });

        // Execute comparison sequence
        const results = await controller.executeActions([
            { name: 'navigate_to_site', params: { url: 'https://www.amazon.com' } },
            { name: 'search_for_product', params: { query: 'laptop' } },
            { name: 'select_product_for_comparison', params: { index: 0 } },
            { name: 'select_product_for_comparison', params: { index: 1 } },
            { name: 'compare_products', params: {} }
        ], context);

        // Verify results
        expect(results).toHaveLength(5);
        expect(results[2].result).toBe('Product 1 selected for comparison');
        expect(results[3].result).toBe('Product 2 selected for comparison');
        expect(results[4].result).toBe('Comparison view opened');
    });

    it('should handle checkout process', async () => {
        // Register actions
        controller.action('Proceed to checkout', async (context: BrowserContext) => {
            const state = await context.getState();
            const checkoutButton = state.clickableElements.find(el =>
                el.textContent.toLowerCase().includes('checkout') ||
                el.attributes.href?.includes('checkout')
            );
            if (!checkoutButton) throw new Error('Checkout button not found');
            await context.clickElementNode(checkoutButton);
            return 'Checkout started';
        });

        controller.action('Fill shipping info', async (info: {
            name: string;
            address: string;
            city: string;
            zip: string;
        }, context: BrowserContext) => {
            const state = await context.getState();
            const inputs = state.clickableElements.filter(el => el.tagName === 'INPUT');

            for (const input of inputs) {
                if (input.attributes.name?.includes('name')) {
                    await context.inputTextElementNode(input, info.name);
                } else if (input.attributes.name?.includes('address')) {
                    await context.inputTextElementNode(input, info.address);
                } else if (input.attributes.name?.includes('city')) {
                    await context.inputTextElementNode(input, info.city);
                } else if (input.attributes.name?.includes('zip')) {
                    await context.inputTextElementNode(input, info.zip);
                }
            }
            return 'Shipping info filled';
        });

        // Execute checkout sequence
        const results = await controller.executeActions([
            { name: 'navigate_to_site', params: { url: 'https://www.amazon.com' } },
            { name: 'search_for_product', params: { query: 'laptop' } },
            { name: 'add_to_cart', params: {} },
            { name: 'proceed_to_checkout', params: {} },
            {
                name: 'fill_shipping_info',
                params: {
                    info: {
                        name: 'John Doe',
                        address: '123 Main St',
                        city: 'New York',
                        zip: '10001'
                    }
                }
            }
        ], context);

        // Verify results
        expect(results).toHaveLength(5);
        expect(results[3].result).toBe('Checkout started');
        expect(results[4].result).toBe('Shipping info filled');
    });
});