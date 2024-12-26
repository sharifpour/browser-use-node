import { Browser } from 'browser-use-node';

async function main() {
    const browser = new Browser({
        headless: false
    });

    try {
        const context = await browser.newContext();

        // Create main page
        const mainPage = await context.newPage();
        await mainPage.goto('https://www.wikipedia.org');

        // Create new tab and navigate to it
        const secondPage = await context.newPage();
        await secondPage.goto('https://www.github.com');

        // Create third tab with target="_blank" link click
        await mainPage.click('a[href="/commons/index.html"]');

        // Wait for the new page to be created
        const pages = await context.pages();
        const newPage = pages[pages.length - 1];
        await newPage.waitForLoadState('networkidle');

        // Get all page titles
        const titles = await Promise.all(
            pages.map(page => page.evaluate(() => document.title))
        );

        console.log('\nOpen Pages:');
        console.log('===========');
        titles.forEach((title, index) => {
            console.log(`Tab ${index + 1}: ${title}`);
        });

        // Switch between tabs
        console.log('\nSwitching between tabs...');

        // Activate main page
        await mainPage.bringToFront();
        console.log('Activated Wikipedia main page');

        // Wait a moment to see the switch
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Activate GitHub page
        await secondPage.bringToFront();
        console.log('Activated GitHub page');

        // Wait a moment to see the switch
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Activate Commons page
        await newPage.bringToFront();
        console.log('Activated Commons page');

        // Create a popup window
        const popupPage = await context.newPage();
        await popupPage.setViewportSize({ width: 800, height: 600 });
        await popupPage.goto('https://www.example.com');
        console.log('\nCreated popup window with example.com');

        // Get final count of all pages
        const finalPages = await context.pages();
        console.log(`\nTotal number of open pages: ${finalPages.length}`);

    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}
