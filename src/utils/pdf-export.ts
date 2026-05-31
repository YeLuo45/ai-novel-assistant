/**
 * PDF Export Utility
 * Uses html2pdf.js to convert HTML content to PDF
 */

import html2pdf from 'html2pdf.js';
import { marked } from 'marked';

export interface ExportChapter {
  id: number;
  title: string;
  content: string;
  type: 'volume' | 'chapter' | 'section' | 'scene';
}

export interface ExportOptions {
  title: string;
  author?: string;
  includeMaterials?: boolean;
  materialCards?: Array<{
    type: 'character' | 'location' | 'item';
    name: string;
    fields: Record<string, string>;
  }>;
}

function buildPDFHTML(
  chapters: ExportChapter[],
  options: ExportOptions
): string {
  // Build table of contents
  const toc = chapters
    .map((ch) => `<li class="toc-${ch.type}">${ch.title}</li>`)
    .join('');

  // Build chapter content
  const chapterHTML = chapters
    .map((ch) => {
      const htmlContent = marked.parse(ch.content || '') as string;
      return `
        <div class="chapter chapter-${ch.type}">
          <h2 class="chapter-title">${ch.title}</h2>
          <div class="chapter-content">${htmlContent}</div>
        </div>
      `;
    })
    .join('<hr class="chapter-divider"/>');

  // Build materials appendix
  let materialsHTML = '';
  if (options.includeMaterials && options.materialCards && options.materialCards.length > 0) {
    const characters = options.materialCards.filter((c) => c.type === 'character');
    const locations = options.materialCards.filter((c) => c.type === 'location');
    const items = options.materialCards.filter((c) => c.type === 'item');

    const renderCards = (cards: typeof characters, emoji: string) => {
      if (!cards.length) return '';
      return `
        <div class="material-section">
          <h3>${emoji} ${cards[0].type === 'character' ? '人物' : cards[0].type === 'location' ? '地点' : '物品'}</h3>
          ${cards
            .map(
              (card) => `
            <div class="material-card">
              <h4>${card.name}</h4>
              <dl class="material-fields">
                ${Object.entries(card.fields)
                  .filter(([_, v]) => v)
                  .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
                  .join('')}
              </dl>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    };

    materialsHTML = `
      <div class="appendix">
        <h2 class="appendix-title">附录：素材卡</h2>
        ${renderCards(characters, '👤')}
        ${renderCards(locations, '📍')}
        ${renderCards(items, '🎁')}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>${options.title}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: "Source Han Serif SC", "Noto Serif SC", "SimSun", serif;
          font-size: 12pt;
          line-height: 1.8;
          color: #333;
          padding: 40px 60px;
        }
        .cover {
          text-align: center;
          padding: 100px 0;
          page-break-after: always;
        }
        .cover h1 {
          font-size: 28pt;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .cover .author {
          font-size: 14pt;
          color: #666;
          margin-top: 10px;
        }
        .toc {
          page-break-after: always;
          padding: 20px 0;
        }
        .toc h1 {
          font-size: 18pt;
          margin-bottom: 20px;
          text-align: center;
        }
        .toc ul {
          list-style: none;
          padding-left: 20px;
        }
        .toc-volume {
          font-weight: bold;
          margin-top: 12px;
        }
        .toc-chapter {
          padding-left: 20px;
        }
        .toc-section, .toc-scene {
          padding-left: 40px;
          font-size: 10pt;
          color: #666;
        }
        .chapter {
          margin: 30px 0;
          text-align: justify;
        }
        .chapter-volume h1 {
          font-size: 20pt;
          text-align: center;
          margin-bottom: 30px;
        }
        .chapter-chapter h2 {
          font-size: 16pt;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 8px;
        }
        .chapter-section h3 {
          font-size: 14pt;
          margin: 20px 0 15px;
        }
        .chapter-content p {
          margin-bottom: 1em;
          text-indent: 2em;
        }
        .chapter-divider {
          border: none;
          border-top: 1px dashed #ccc;
          margin: 40px 0;
        }
        .appendix {
          page-break-before: always;
          padding-top: 20px;
        }
        .appendix-title {
          font-size: 18pt;
          text-align: center;
          margin-bottom: 30px;
        }
        .material-section {
          margin-bottom: 30px;
        }
        .material-section h3 {
          font-size: 14pt;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
        .material-card {
          padding: 10px 15px;
          margin-bottom: 10px;
          background: #f9f9f9;
          border-radius: 4px;
        }
        .material-card h4 {
          font-size: 12pt;
          margin-bottom: 8px;
        }
        .material-fields {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 4px 15px;
          font-size: 10pt;
        }
        .material-fields dt {
          color: #888;
        }
        .material-fields dd {
          color: #333;
        }
        .chapter-title {
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>${options.title}</h1>
        ${options.author ? `<div class="author">作者：${options.author}</div>` : ''}
      </div>

      <div class="toc">
        <h1>目录</h1>
        <ul>${toc}</ul>
      </div>

      ${chapterHTML}

      ${materialsHTML}
    </body>
    </html>
  `;
}

export async function exportToPDF(
  chapters: ExportChapter[],
  options: ExportOptions
): Promise<void> {
  const html = buildPDFHTML(chapters, options);

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const filename = `${options.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.pdf`;

  try {
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

export function generatePDFHTML(
  chapters: ExportChapter[],
  options: ExportOptions
): string {
  return buildPDFHTML(chapters, options);
}
