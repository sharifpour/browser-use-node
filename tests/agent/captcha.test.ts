import { Browser } from '../../src/browser/browser';
import { BrowserContext } from '../../src/browser/context';
import { Controller } from '../../src/controller/controller';
import { beforeEach, describe, expect, it } from '@jest/globals';

interface CaptchaTest {
    name: string;
    url: string;
    successText: string;
    additionalText?: string;
}

const CAPTCHA_TESTS: CaptchaTest[] = [
    {
        name: 'Text Captcha',
        url: 'https://2captcha.com/demo/text',
        successText: 'Captcha is passed successfully!'
    },
    {
        name: 'Basic Captcha',
        url: 'https://captcha.com/demos/features/captcha-demo.aspx',
        successText: 'Correct!'
    },
    {
        name: 'Rotate Captcha',
        url: 'https://2captcha.com/demo/rotatecaptcha',
        successText: 'Captcha is passed successfully',
        additionalText: 'Use multiple clicks at once. click done when image is exact correct position.'
    },
    {
        name: 'MT Captcha',
        url: 'https://2captcha.com/demo/mtcaptcha',
        successText: 'Verified Successfully',
        additionalText: 'Stop when you solved it successfully.'
    }
];

describe('Captcha Solving', () => {
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

    // Register common captcha solving actions
    const registerCaptchaActions = () => {
        controller.action('Navigate to captcha', async (url: string, context: BrowserContext) => {
            const page = await context.getPage();
            await page.goto(url);
            return 'Navigation completed';
        });

        controller.action('Input captcha text', async (text: string, context: BrowserContext) => {
            const state = await context.getState();
            const input = state.clickableElements.find(el =>
                el.tagName === 'INPUT' &&
                !el.attributes.type?.includes('hidden')
            );
            if (!input) throw new Error('Captcha input not found');
            await context.inputTextElementNode(input, text);
            return 'Captcha text entered';
        });

        controller.action('Click verify button', async (context: BrowserContext) => {
            const state = await context.getState();
            const button = state.clickableElements.find(el =>
                el.textContent.toLowerCase().includes('verify') ||
                el.textContent.toLowerCase().includes('submit')
            );
            if (!button) throw new Error('Verify button not found');
            await context.clickElementNode(button);
            return 'Verification attempted';
        });

        controller.action('Rotate image', async (degrees: number, context: BrowserContext) => {
            const state = await context.getState();
            const image = state.clickableElements.find(el =>
                el.tagName === 'IMG' ||
                el.attributes.role === 'img'
            );
            if (!image) throw new Error('Rotatable image not found');

            // Simulate rotation by clicking at calculated positions
            const box = await context.getElementByXPath(image.xpath).then(el =>
                el?.evaluate(node => node.getBoundingClientRect())
            );
            if (!box) throw new Error('Could not get image bounds');

            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;
            const radius = Math.min(box.width, box.height) / 3;
            const angle = (degrees * Math.PI) / 180;

            const clickX = centerX + radius * Math.cos(angle);
            const clickY = centerY + radius * Math.sin(angle);

            await context.getPage().then(page =>
                page.mouse.click(clickX, clickY)
            );

            return `Rotated image by ${degrees} degrees`;
        });

        controller.action('Click done', async (context: BrowserContext) => {
            const state = await context.getState();
            const button = state.clickableElements.find(el =>
                el.textContent.toLowerCase().includes('done')
            );
            if (!button) throw new Error('Done button not found');
            await context.clickElementNode(button);
            return 'Done clicked';
        });

        controller.action('Check success', async (successText: string, context: BrowserContext) => {
            const state = await context.getState();
            const allText = state.clickableElements
                .map(el => el.textContent)
                .join(' ');
            const success = allText.includes(successText);
            return success ? 'Captcha solved successfully' : 'Captcha not solved yet';
        });
    };

    CAPTCHA_TESTS.forEach(test => {
        it(`should solve ${test.name}`, async () => {
            registerCaptchaActions();

            // Execute captcha solving sequence
            const results = await controller.executeActions([
                { name: 'navigate_to_captcha', params: { url: test.url } },
                ...(test.name === 'Text Captcha' ? [
                    { name: 'input_captcha_text', params: { text: 'test' } }
                ] : []),
                ...(test.name === 'Rotate Captcha' ? [
                    { name: 'rotate_image', params: { degrees: 90 } },
                    { name: 'click_done', params: {} }
                ] : []),
                { name: 'click_verify', params: {} },
                { name: 'check_success', params: { successText: test.successText } }
            ], context);

            // Verify results
            expect(results[0].result).toBe('Navigation completed');
            expect(results[results.length - 1].result).toBe('Captcha solved successfully');
        });
    });

    it('should handle failed captcha attempts', async () => {
        registerCaptchaActions();

        // Execute with wrong captcha text
        const results = await controller.executeActions([
            { name: 'navigate_to_captcha', params: { url: CAPTCHA_TESTS[0].url } },
            { name: 'input_captcha_text', params: { text: 'wrong' } },
            { name: 'click_verify', params: {} },
            { name: 'check_success', params: { successText: CAPTCHA_TESTS[0].successText } }
        ], context);

        expect(results[results.length - 1].result).toBe('Captcha not solved yet');
    });

    it('should retry failed captcha attempts', async () => {
        registerCaptchaActions();

        // Add retry action
        controller.action('Retry captcha', async (context: BrowserContext) => {
            const state = await context.getState();
            const retryButton = state.clickableElements.find(el =>
                el.textContent.toLowerCase().includes('retry') ||
                el.textContent.toLowerCase().includes('try again')
            );
            if (!retryButton) throw new Error('Retry button not found');
            await context.clickElementNode(retryButton);
            return 'Retry initiated';
        });

        // Execute with retry
        const results = await controller.executeActions([
            { name: 'navigate_to_captcha', params: { url: CAPTCHA_TESTS[0].url } },
            { name: 'input_captcha_text', params: { text: 'wrong' } },
            { name: 'click_verify', params: {} },
            { name: 'check_success', params: { successText: CAPTCHA_TESTS[0].successText } },
            { name: 'retry_captcha', params: {} },
            { name: 'input_captcha_text', params: { text: 'correct' } },
            { name: 'click_verify', params: {} },
            { name: 'check_success', params: { successText: CAPTCHA_TESTS[0].successText } }
        ], context);

        expect(results[4].result).toBe('Retry initiated');
        expect(results[results.length - 1].result).toBe('Captcha solved successfully');
    });
});