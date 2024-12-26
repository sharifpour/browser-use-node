import { Browser } from '../src';

async function main() {
    const browser = new Browser();
    const context = await browser.newContext();

    try {
        const page = await context.newPage();

        // Set up request interception
        await page.setRequestInterception(true);

        // Listen for requests
        page.on('request', async (request) => {
            // Log all requests
            console.log(`Request: ${request.method} ${request.url}`);

            // Block image requests
            if (request.resourceType === 'image') {
                await request.abort();
                return;
            }

            // Modify headers for API requests
            if (request.url.includes('/api')) {
                const headers = {
                    ...request.headers,
                    'Custom-Header': 'Modified-Value'
                };
                await request.continue({ headers });
                return;
            }

            // Continue other requests normally
            await request.continue();
        });

        // Listen for responses
        page.on('response', async (response) => {
            const request = response.request();
            console.log(`Response: ${response.status} ${request.url}`);

            // Log response body for API calls
            if (request.url.includes('/api')) {
                try {
                    const body = await response.text();
                    console.log('API Response body:', body);
                } catch (error) {
                    console.error('Failed to get response body:', error);
                }
            }
        });

        // Navigate to test page
        await page.goto('https://httpbin.org/anything');

        // Make an API request
        const response = await page.evaluate(() =>
            fetch('/api/test', {
                method: 'POST',
                body: JSON.stringify({ test: 'data' })
            })
        );

        // Wait for all network activity to complete
        await page.waitForLoadState('networkidle');

    } finally {
        await context.close();
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
} 