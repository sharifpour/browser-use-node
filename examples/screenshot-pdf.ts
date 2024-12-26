import { Browser } from '../src';
import * as path from 'path';

async function main() {
    const browser = new Browser();
    const context = await browser.newContext();

    try {
        const page = await context.newPage();

        // Navigate to a page
        await page.goto('https://example.com');

        // Take a full page screenshot
        await page.screenshot({
            path: path.join(__dirname, 'full-page.png'),
            fullPage: true
        });

        // Take a screenshot of a specific element
        const element = await page.$('h1');
        if (element) {
            await element.screenshot({
                path: path.join(__dirname, 'element.png')
            });
        }

        // Take a screenshot of a specific area
        await page.screenshot({
            path: path.join(__dirname, 'area.png'),
            clip: {
                x: 0,
                y: 0,
                width: 500,
                height: 500
            }
        });

        // Generate PDF of the page
        await page.pdf({
            path: path.join(__dirname, 'page.pdf'),
            format: 'A4',
            printBackground: true,
            margin: {
                top: '1cm',
                right: '1cm',
                bottom: '1cm',
                left: '1cm'
            }
        });

        // Generate PDF with custom size
        await page.pdf({
            path: path.join(__dirname, 'custom-size.pdf'),
            width: '800px',
            height: '600px',
            printBackground: true
        });

        console.log('Screenshots and PDFs have been saved in the examples directory');

    } finally {
        await context.close();
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}