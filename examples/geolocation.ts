import { Browser } from '../src';

async function main() {
    const browser = new Browser();

    // Create context with permissions
    const context = await browser.newContext({
        permissions: ['geolocation']
    });

    try {
        const page = await context.newPage();

        // Set geolocation to San Francisco
        await context.setGeolocation({
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 100
        });

        // Navigate to a page that uses geolocation
        await page.goto('https://browserleaks.com/geo');

        // Wait for location data to load
        await page.waitForLoadState('networkidle');

        // Get location data from page
        const location = await page.evaluate(() => {
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    (error) => {
                        resolve({ error: error.message });
                    }
                );
            });
        });

        console.log('Current geolocation:', location);

        // Change location to Tokyo
        await context.setGeolocation({
            latitude: 35.6762,
            longitude: 139.6503,
            accuracy: 100
        });

        // Refresh page to see new location
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Get updated location
        const newLocation = await page.evaluate(() => {
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    (error) => {
                        resolve({ error: error.message });
                    }
                );
            });
        });

        console.log('Updated geolocation:', newLocation);

    } finally {
        await context.close();
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}