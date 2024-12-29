import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

export class MainContentExtractor {
  private static readonly BLOCK_ELEMENTS = new Set([
    'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div',
    'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main',
    'nav', 'noscript', 'ol', 'p', 'pre', 'section', 'table', 'tfoot',
    'ul', 'video'
  ]);

  private static readonly IGNORE_ELEMENTS = new Set([
    'script', 'style', 'link', 'meta', 'noscript', 'iframe'
  ]);

  private static readonly CONTENT_SCORE_MULTIPLIERS = {
    div: 5,
    pre: 3,
    td: 3,
    blockquote: 2,
    article: 2,
    section: 2,
    p: 1,
    li: 1
  };

  public static extract(html: string, output_format: 'text' | 'markdown' = 'text'): string {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Remove unwanted elements
    MainContentExtractor.IGNORE_ELEMENTS.forEach(tag => {
      const elements = document.getElementsByTagName(tag);
      for (let i = elements.length - 1; i >= 0; i--) {
        elements[i].remove();
      }
    });

    // Score elements
    const scores = new Map<Element, number>();
    const paragraphs = document.getElementsByTagName('p');
    for (const p of Array.from(paragraphs)) {
      const parent = p.parentElement;
      const grandParent = parent?.parentElement;

      if (!parent || !grandParent) continue;

      // Initialize scores
      if (!scores.has(parent)) scores.set(parent, 0);
      if (!scores.has(grandParent)) scores.set(grandParent, 0);

      const textLength = p.textContent?.length || 0;
      const score = Math.min(Math.floor(textLength / 100) + 1, 3);

      scores.set(parent, scores.get(parent)! + score);
      scores.set(grandParent, scores.get(grandParent)! + score / 2);
    }

    // Find the element with the highest score
    let topElement: Element | null = null;
    let maxScore = 0;

    scores.forEach((score, element) => {
      const tagName = element.tagName.toLowerCase();
      const multiplier = MainContentExtractor.CONTENT_SCORE_MULTIPLIERS[tagName as keyof typeof MainContentExtractor.CONTENT_SCORE_MULTIPLIERS] || 1;
      const finalScore = score * multiplier;

      if (finalScore > maxScore) {
        maxScore = finalScore;
        topElement = element;
      }
    });

    if (!topElement) {
      topElement = document.body;
    }

    // Extract text
    const text = MainContentExtractor.extractText(topElement);

    // Convert to markdown if requested
    if (output_format === 'markdown') {
      const turndownService = new TurndownService();
      return turndownService.turndown(text);
    }

    return text;
  }

  private static extractText(element: Element | null): string {
    if (!element) return '';

    const texts: string[] = [];
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === 3) { // Text node
        const text = node.textContent?.trim();
        if (text) texts.push(text);
      } else if (node.nodeType === 1) { // Element node
        const el = node as Element;
        if (!MainContentExtractor.IGNORE_ELEMENTS.has(el.tagName.toLowerCase())) {
          const text = MainContentExtractor.extractText(el);
          if (text) {
            if (MainContentExtractor.BLOCK_ELEMENTS.has(el.tagName.toLowerCase())) {
              texts.push('\n' + text + '\n');
            } else {
              texts.push(text);
            }
          }
        }
      }
    }

    return texts.join(' ').replace(/\s+/g, ' ').trim();
  }
}