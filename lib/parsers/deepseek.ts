import type { Conversation } from '@/types/conversation';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

type Message = {
  role: "Question" | "Answer";
  content: string;
  code?: string;
};

/**
 * Extracts a DeepSeek share page into a structured Conversation.
 * @param html - Raw HTML content from the DeepSeek share page
 * @returns Promise resolving to a structured Conversation object
 */
export async function parseDeepSeek(html: string): Promise<Conversation> {
  const $ = cheerio.load(html);

  const questions = $("div.fbb737a4");
  const answers = $("div.ds-markdown.ds-markdown--block");

  const messages: Message[] = [];
  const totalPairs = Math.min(questions.length, answers.length);

  for (let i = 0; i < totalPairs; i++) {
    const questionText = $(questions[i]).text().replace(/\s+/g, " ").trim();
    if (questionText) {
      messages.push({ role: "Question", content: questionText });
    }

    const textParts: string[] = [];
    const codeParts: string[] = [];

    const answerBlock = $(answers[i]);
    answerBlock.find("p.ds-markdown-paragraph").each((_: number, p: Element) => {
      const para = $(p).text().replace(/\s+/g, " ").trim();
      if (para) textParts.push(para);
    });

    answerBlock.find("div.md-code-block pre").each((_: number, pre: Element) => {
      const code = $(pre).text().trimEnd();
      if (code) codeParts.push(code);
    });

    messages.push({
      role: "Answer",
      content: textParts.join("\n"),
      code: codeParts.length ? codeParts.join("\n---\n") : undefined,
    });
  }

  // Format messages as HTML for display
  const htmlContent = formatAsDisplayableHtml(messages);

  return {
    model: 'deepSeek',
    content: htmlContent,
    scrapedAt: new Date().toISOString(),
    sourceHtmlBytes: html.length,
  };
}

function formatAsDisplayableHtml(messages: Message[]): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Conversation from DeepSeek</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2em; line-height: 1.6; background: #f9f9f9; }
    .message { margin-bottom: 2em; }
    .Question { color: #0b5394; font-weight: bold; }
    .Answer { color: #38761d; font-weight: bold; }
    pre { background: #eee; padding: 1em; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Parsed Conversation from DeepSeek</h1>
  ${messages.map(msg => `
    <div class="message">
      <div class="${msg.role}">${msg.role.toUpperCase()}:</div>
      <div>${msg.content.replace(/\n/g, "<br>")}</div>
      ${msg.code ? `<pre>${msg.code}</pre>` : ""}
    </div>
  `).join("\n")}
</body>
</html>
`;
}
