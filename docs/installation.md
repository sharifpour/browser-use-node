# Installation Guide

## Prerequisites

Before installing browser-use, ensure you have the following prerequisites:

- Node.js (version 16.x or higher)
- npm (version 7.x or higher)
- A supported operating system (Windows, macOS, or Linux)

## Installation Steps

1. Install the package using npm:
   ```bash
   npm install browser-use
   ```

2. Install peer dependencies:
   ```bash
   npm install playwright
   ```

3. Install browser binaries:
   ```bash
   npx playwright install chromium
   ```

## Verifying Installation

To verify that browser-use is installed correctly:

1. Create a test file `test.js`:
   ```javascript
   const { Browser } = require('browser-use');

   async function test() {
       const browser = new Browser();
       const context = await browser.newContext();
       await context.navigateTo('https://example.com');
       await context.close();
       await browser.close();
   }

   test().catch(console.error);
   ```

2. Run the test:
   ```bash
   node test.js
   ```

## Configuration

1. Create a configuration file `.env` in your project root:
   ```env
   POSTHOG_API_KEY=your_posthog_api_key
   POSTHOG_HOST=https://app.posthog.com
   ```

2. Configure security settings in your code:
   ```javascript
   const { SecurityService } = require('browser-use');

   const securityService = SecurityService.getInstance({
       disableSecurity: false,
       bypassCSP: false,
       ignoreHTTPSErrors: false
   });
   ```

## Troubleshooting

Common installation issues and solutions:

1. **Browser binaries not found**
   - Solution: Run `npx playwright install chromium` again

2. **Permission errors**
   - Solution: Run the installation commands with sudo/admin privileges

3. **Dependency conflicts**
   - Solution: Clear npm cache and reinstall dependencies

## Next Steps

- Read the [Configuration Guide](./configuration.md) for detailed configuration options
- Check out the [Examples](./examples.md) for usage examples
- Review [Security Best Practices](./security.md) for secure usage