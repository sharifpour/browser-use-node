import path from 'node:path';
import { Browser } from '../src';
import type { BrowserContext } from '../src/browser/context';
import { Controller } from '../src/controller';
import type { ActionResult } from '../src/types';

// Initialize browser
const browser = new Browser({
  headless: false
});

// Initialize controller
const controller = new Controller();

// Register file upload action
controller.action(
  'Upload file to element',
  async (params: { index: number }, browserContext: BrowserContext): Promise<ActionResult> => {
    const testCvPath = path.join(__dirname, 'test_cv.txt');
    const domEl = await browserContext.getDomElementByIndex(params.index);

    if (!domEl) {
      return { error: `No element found at index ${params.index}` };
    }

    const isUploader = await browserContext.isFileUploader(domEl);
    if (!isUploader) {
      return { error: `No file upload element found at index ${params.index}` };
    }

    const element = await browserContext.getLocateElement(domEl);
    if (!element) {
      return { error: `Could not locate element at index ${params.index}` };
    }

    try {
      await element.setInputFiles(testCvPath);
      const msg = `Successfully uploaded file to index ${params.index}`;
      console.log(msg);
      return { extracted_content: msg };
    } catch (e) {
      console.error(`Error in setInputFiles: ${e}`);
      return { error: `Failed to upload file to index ${params.index}` };
    }
  }
);

async function main() {
  const context = await browser.newContext();
  try {
    // Your file upload test code here
    await context.navigateTo('https://example.com/upload');
    const state = await context.getState();
    // Find upload element and use the upload action
    // ...
  } finally {
    await context.close();
    await browser.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}