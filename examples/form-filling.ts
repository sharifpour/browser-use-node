import { Browser } from '../src';

async function main() {
    const browser = new Browser();
    const context = await browser.newContext();

    try {
        const page = await context.newPage();

        // Navigate to a sample form page
        await page.goto('https://httpbin.org/forms/post');

        // Fill out text fields
        await page.type('#custname', 'John Doe');
        await page.type('#custemail', 'john.doe@example.com');

        // Select radio button
        await page.click('#size-2'); // Medium size

        // Select checkbox
        await page.click('#topping-2'); // Onion topping

        // Select from dropdown
        await page.select('#delivery-time', 'lunch');

        // Fill textarea
        await page.type('#comments', 'Please deliver to the front door.');

        // Submit form
        await page.click('button[type="submit"]');

        // Wait for response
        await page.waitForNavigation();

        // Get and log the response
        const responseText = await page.evaluate(() => document.body.textContent);
        console.log('Form submission response:', responseText);

    } finally {
        await context.close();
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
} 