import type { Conversation } from '@/types/conversation';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

/**
 * Extracts a DeepSeek share page into a structured Conversation.
 * @param html - Raw HTML content from the DeepSeek share page
 * @returns Promise resolving to a structured Conversation object
 */
export async function parseDeepSeek(html: string): Promise<Conversation> {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // 1. Inject <style> from deepseek.css
  const cssPath = path.resolve(process.cwd(), 'lib/parsers/assets/deepseek.css');
  const css = fs.readFileSync(cssPath, 'utf-8');

  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // 2. Grab main conversation container
  const chatContainer = document.querySelector('div.dad65929');
  if (!chatContainer) {
    throw new Error('Conversation container not found');
  }

  // 3. Prepare the final HTML output
  const htmlContent = `
    <html>
      <head>${document.head.innerHTML}</head>
      <body class="light-theme theme-host">
        ${chatContainer.outerHTML}
      </body>
    </html>
  `;

  return {
    model: 'deepSeek',
    content: htmlContent,
    scrapedAt: new Date().toISOString(),
    sourceHtmlBytes: html.length,
  };
}
