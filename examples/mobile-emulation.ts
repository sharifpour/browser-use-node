import { Browser } from '../src';

async function main() {
    const browser = new Browser();

    try {
        // iPhone 12 Pro
        const iPhoneContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true,
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
        });

        const iPhonePage = await iPhoneContext.newPage();
        await iPhonePage.goto('https://www.google.com');
        await iPhonePage.screenshot({ path: 'iphone-view.png' });

        // iPad Pro
        const iPadContext = await browser.newContext({
            viewport: { width: 1024, height: 1366 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'
        });

        const iPadPage = await iPadContext.newPage();
        await iPadPage.goto('https://www.google.com');
        await iPadPage.screenshot({ path: 'ipad-view.png' });

        // Android Pixel 5
        const androidContext = await browser.newContext({
            viewport: { width: 393, height: 851 },
            deviceScaleFactor: 2.75,
            isMobile: true,
            hasTouch: true,
            userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
        });

        const androidPage = await androidContext.newPage();
        await androidPage.goto('https://www.google.com');
        await androidPage.screenshot({ path: 'android-view.png' });

        // Test touch events
        await androidPage.evaluate(() => {
            const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [
                    new Touch({
                        identifier: 0,
                        target: document.body,
                        clientX: 100,
                        clientY: 100,
                        radiusX: 2.5,
                        radiusY: 2.5,
                        rotationAngle: 0,
                        force: 1
                    })
                ]
            });
            document.body.dispatchEvent(touchEvent);
            return true;
        });

        // Test orientation change
        await androidPage.setViewportSize({ width: 851, height: 393 }); // Landscape mode
        await androidPage.screenshot({ path: 'android-landscape.png' });

        console.log('Screenshots have been saved in the current directory');

    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}