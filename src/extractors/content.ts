import { load } from 'cheerio';

export interface ContentExtractorOptions {
  removeAds?: boolean;
  maxLength?: number;
  includeImages?: boolean;
}

export class ContentExtractor {
  constructor(private options: ContentExtractorOptions = {}) {}

  extract(html: string): string {
    const $ = load(html);

    // Remove ads and unwanted elements if configured
    if (this.options.removeAds) {
      $('script, style, iframe, .ad, .advertisement, [class*="ad-"], [id*="ad-"]').remove();
    }

    // Get main content
    const mainContent = this.findMainContent($);

    // Process images if configured
    if (this.options.includeImages) {
      mainContent.find('img').each((_, img) => {
        const alt = $(img).attr('alt') || '';
        const src = $(img).attr('src') || '';
        $(img).replaceWith(`[Image: ${alt} (${src})]`);
      });
    } else {
      mainContent.find('img').remove();
    }

    // Clean and format text
    let text = mainContent.text()
      .replace(/\s+/g, ' ')
      .trim();

    // Limit length if configured
    if (this.options.maxLength && text.length > this.options.maxLength) {
      text = `${text.slice(0, this.options.maxLength)}...`;
    }

    return text;
  }

  private findMainContent($: ReturnType<typeof load>): ReturnType<typeof $> {
    // Try common content selectors
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '#content',
      '.content',
      '.main-content',
      '.post-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        return element;
      }
    }

    // Fallback to body if no main content found
    return $('body');
  }
}

export default ContentExtractor; 