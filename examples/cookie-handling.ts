import { Browser } from '../src';

async function main() {
    const browser = new Browser();
    const context = await browser.newContext();

    try {
        const page = await context.newPage();

        // Set cookies before navigation
        await context.addCookies([
            {
                name: 'session_id',
                value: '12345',
                domain: 'httpbin.org',
                path: '/'
            },
            {
                name: 'user_preference',
                value: 'dark_mode',
                domain: 'httpbin.org',
                path: '/'
            }
        ]);

        // Navigate to check cookies
        await page.goto('https://httpbin.org/cookies');

        // Get all cookies
        const cookies = await context.cookies();
        console.log('Current cookies:', cookies);

        // Delete specific cookie
        await context.clearCookies([{
            name: 'user_preference',
            domain: 'httpbin.org',
            path: '/'
        }]);

        // Verify cookie deletion
        const remainingCookies = await context.cookies();
        console.log('Remaining cookies:', remainingCookies);

        // Clear all cookies
        await context.clearCookies();

        // Verify all cookies cleared
        const finalCookies = await context.cookies();
        console.log('Cookies after clearing:', finalCookies);

    } finally {
        await context.close();
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}