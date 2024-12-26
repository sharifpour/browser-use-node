import { Browser, Page } from 'browser-use-node';

interface Product {
    title: string | undefined;
    price: string | undefined;
    rating: string | undefined;
}

// Function to extract product information
async function getProductInfo(page: Page): Promise<Product[]> {
    return page.evaluate(() => {
        const products: Product[] = [];
        const items = document.querySelectorAll('[data-component-type="s-search-result"]');

        items.forEach((item, index) => {
            if (index < 5) { // Get top 5 results
                const titleElement = item.querySelector('h2 a span');
                const priceElement = item.querySelector('.a-price-whole');
                const ratingElement = item.querySelector('.a-icon-star-small .a-icon-alt');

                products.push({
                    title: titleElement?.textContent?.trim(),
                    price: priceElement?.textContent?.trim(),
                    rating: ratingElement?.textContent?.trim()
                });
            }
        });

        return products;
    });
}

async function main() {
    const browser = new Browser({
        headless: false
    });

    try {
        const context = await browser.newContext();

        // Create multiple pages for different product searches
        const laptopPage = await context.newPage();
        const phonePage = await context.newPage();
        const tabletPage = await context.newPage();

        // Search for laptops
        await laptopPage.goto('https://www.amazon.com');
        await laptopPage.type('#twotabsearchtextbox', 'laptop');
        await laptopPage.keyboard.press('Enter');
        await laptopPage.waitForLoadState('networkidle');

        // Search for phones
        await phonePage.goto('https://www.amazon.com');
        await phonePage.type('#twotabsearchtextbox', 'smartphone');
        await phonePage.keyboard.press('Enter');
        await phonePage.waitForLoadState('networkidle');

        // Search for tablets
        await tabletPage.goto('https://www.amazon.com');
        await tabletPage.type('#twotabsearchtextbox', 'tablet');
        await tabletPage.keyboard.press('Enter');
        await tabletPage.waitForLoadState('networkidle');

        // Get product information from all pages
        const laptops = await getProductInfo(laptopPage);
        const phones = await getProductInfo(phonePage);
        const tablets = await getProductInfo(tabletPage);

        // Print results
        console.log('\nTop 5 Laptops:');
        console.log('==============');
        laptops.forEach((product, index) => {
            console.log(`${index + 1}. ${product.title}`);
            console.log(`   Price: $${product.price}`);
            console.log(`   Rating: ${product.rating}\n`);
        });

        console.log('\nTop 5 Smartphones:');
        console.log('==================');
        phones.forEach((product, index) => {
            console.log(`${index + 1}. ${product.title}`);
            console.log(`   Price: $${product.price}`);
            console.log(`   Rating: ${product.rating}\n`);
        });

        console.log('\nTop 5 Tablets:');
        console.log('==============');
        tablets.forEach((product, index) => {
            console.log(`${index + 1}. ${product.title}`);
            console.log(`   Price: $${product.price}`);
            console.log(`   Rating: ${product.rating}\n`);
        });

    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    main().catch(console.error);
}
