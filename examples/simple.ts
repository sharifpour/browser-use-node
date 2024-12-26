import { Browser } from '../src';

async function main() {
  // Initialize browser with visible window
  const browser = new Browser({
    headless: false
  });

  try {
      // Create a new context
      const context = await browser.newContext();

      // Create a new page
      const page = await context.newPage();

      // Navigate to Google
      await page.goto('https://www.google.com');

      // Type into search box
      await page.type('input[name="q"]', 'What is browser automation?');

      // Press Enter
      await page.keyboard.press('Enter');

      // Wait for results to load
      await page.waitForLoadState('networkidle');

      // Get all search result titles
      const titles = await page.evaluate(() => {
        const elements = document.querySelectorAll('h3');
        return Array.from(elements).map(el => el.textContent);
      });

      console.log('Search Results:');
      titles.forEach((title: string | null, index: number) => {
        console.log(`${index + 1}. ${title}`);
      });

    } finally {
      // Close browser
      await browser.close();
    }
}

if (require.main === module) {
  main().catch(console.error);
}
