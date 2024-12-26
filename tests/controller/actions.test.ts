import { Controller } from '@/controller/controller';
import { Browser } from '@/browser/browser';
import { BrowserContext } from '@/browser/context';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('Controller Actions', () => {
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

    it('should register and execute simple actions', async () => {
        // Register a simple action
        controller.action('Print a message', async (message: string) => {
            console.log(`Message: ${message}`);
            return `Printed message: ${message}`;
        });

        // Register a numeric action
        controller.action('Add two numbers', async (a: number, b: number) => {
            const result = a + b;
            return `The sum is ${result}`;
        });

        // Execute actions
        const printResult = await controller.executeAction('print_message', { message: 'Hello, World!' });
        expect(printResult.result).toBe('Printed message: Hello, World!');

        const addResult = await controller.executeAction('add_numbers', { a: 10, b: 20 });
        expect(addResult.result).toBe('The sum is 30');
    });

    it('should handle model-based actions', async () => {
        interface SimpleModel {
            name: string;
            age: number;
        }

        interface Address {
            street: string;
            city: string;
        }

        interface NestedModel {
            user: SimpleModel;
            address: Address;
        }

        // Register model-based actions
        controller.action('Process simple model', async (model: SimpleModel) => {
            return `Processed ${model.name}, age ${model.age}`;
        });

        controller.action('Process nested model', async (model: NestedModel) => {
            const userInfo = `${model.user.name}, age ${model.user.age}`;
            const addressInfo = `${model.address.street}, ${model.address.city}`;
            return `Processed user ${userInfo} at address ${addressInfo}`;
        });

        // Execute model-based actions
        const simpleResult = await controller.executeAction('process_simple_model', {
            model: { name: 'Alice', age: 30 }
        });
        expect(simpleResult.result).toBe('Processed Alice, age 30');

        const nestedResult = await controller.executeAction('process_nested_model', {
            model: {
                user: { name: 'Bob', age: 25 },
                address: { street: '123 Maple St', city: 'Springfield' }
            }
        });
        expect(nestedResult.result).toBe('Processed user Bob, age 25 at address 123 Maple St, Springfield');
    });

    it('should handle browser-based actions', async () => {
        // Register browser-based action
        controller.action('Navigate and click', async (url: string, context: BrowserContext) => {
            const page = await context.getPage();
            await page.goto(url);
            const state = await context.getState();
            const link = state.clickableElements[0];
            await context.clickElementNode(link);
            return 'Navigation and click completed';
        });

        // Execute browser-based action
        const result = await controller.executeAction('navigate_and_click',
            { url: 'https://example.com' },
            context
        );
        expect(result.result).toBe('Navigation and click completed');
    });

    it('should handle action sequences', async () => {
        // Register sequence actions
        controller.action('Open URL', async (url: string, context: BrowserContext) => {
            const page = await context.getPage();
            await page.goto(url);
            return 'URL opened';
        });

        controller.action('Input search', async (text: string, context: BrowserContext) => {
            const state = await context.getState();
            const input = state.clickableElements.find(el => el.tagName === 'INPUT');
            if (input) {
                await context.inputTextElementNode(input, text);
                return 'Text input completed';
            }
            throw new Error('Input element not found');
        });

        // Execute action sequence
        const results = await controller.executeActions([
            { name: 'open_url', params: { url: 'https://google.com' } },
            { name: 'input_search', params: { text: 'test search' } }
        ], context);

        expect(results).toHaveLength(2);
        expect(results[0].result).toBe('URL opened');
        expect(results[1].result).toBe('Text input completed');
    });

    it('should handle async actions', async () => {
        // Register async action
        controller.action('Calculate area', async (length: number, width: number) => {
            // Simulate async operation
            await new Promise(resolve => setTimeout(resolve, 100));
            const area = length * width;
            return `The area is ${area}`;
        });

        const result = await controller.executeAction('calculate_area', {
            length: 5.5,
            width: 3.2
        });
        expect(result.result).toBe('The area is 17.6');
    });

    it('should handle errors gracefully', async () => {
        // Register action that might fail
        controller.action('Risky operation', async () => {
            throw new Error('Operation failed');
        });

        try {
            await controller.executeAction('risky_operation', {});
            fail('Should have thrown an error');
        } catch (error) {
            expect(error.message).toBe('Operation failed');
        }
    });

    it('should validate action parameters', async () => {
        // Register action with required parameters
        controller.action('Greet person', async (name: string, age: number) => {
            if (typeof name !== 'string' || name.length === 0) {
                throw new Error('Invalid name');
            }
            if (typeof age !== 'number' || age < 0) {
                throw new Error('Invalid age');
            }
            return `Hello ${name}, you are ${age} years old`;
        });

        // Valid parameters
        const validResult = await controller.executeAction('greet_person', {
            name: 'Alice',
            age: 30
        });
        expect(validResult.result).toBe('Hello Alice, you are 30 years old');

        // Invalid parameters
        try {
            await controller.executeAction('greet_person', {
                name: '',
                age: -1
            });
            fail('Should have thrown an error');
        } catch (error) {
            expect(error.message).toBe('Invalid name');
        }
    });
});