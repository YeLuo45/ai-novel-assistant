/**
 * PDF Export Service using pdfmake
 * Better Chinese font support with proper layout optimization
 */

import pdfMake from 'pdfmake/build/pdfmake';
import vfsFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';

// Register bundled fonts (ESM-safe; do not assign to import bindings)
pdfMake.addVirtualFileSystem(vfsFonts);

export interface PdfChapter {
  title: string;
  content: string;
  type: 'volume' | 'chapter' | 'section';
  children?: PdfChapter[];
}

export interface PdfMetadata {
  title: string;
  author?: string;
  language?: string;
  description?: string;
  category?: string;
}

export interface PdfExportOptions {
  includeMaterials?: boolean;
  materialCards?: Array<{
    type: 'character' | 'location' | 'item';
    name: string;
    fields: Record<string, string>;
  }>;
}

/**
 * Convert outline nodes to flat chapter list for PDF export
 */
export function buildPdfChapterList(
  outlineNodes: Array<{
    id: number | null;
    parentId: number | null;
    title: string;
    content: string;
    type: 'volume' | 'chapter' | 'section' | 'scene';
    order: number;
  }>
): PdfChapter[] {
  const buildList = (parentId: number | null): PdfChapter[] => {
    return outlineNodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .flatMap(n => [
        {
          title: n.title,
          content: n.content || '',
          type: n.type as 'volume' | 'chapter' | 'section',
        },
        ...buildList(n.id ?? null),
      ]);
  };
  return buildList(null);
}

/**
 * Parse content text into paragraphs
 */
function parseContent(content: string): string[] {
  if (!content) return [];
  // Split by double newlines or single newlines to get paragraphs
  return content
    .split(/\n\n+|\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Generate PDF document content using pdfmake
 */
function generatePdfContent(
  chapters: PdfChapter[],
  metadata: PdfMetadata,
  options: PdfExportOptions
): { docDefinition: TDocumentDefinitions; chapterCount: number } {
  const docContent: Content[] = [];

  // Margins: top/bottom 2.5cm, left/right 2cm
  // In pdfmake units: 1 cm ≈ 28.35 points, so 2.5cm ≈ 70.875, 2cm ≈ 56.7
  const topBottomMargin = 70.875;
  const leftRightMargin = 56.7;

  // Process chapters and build PDF content
  let chapterCount = 0;
  for (const chapter of chapters) {
    chapterCount++;

    // Title based on type
    let titleStyle: 'volumeTitle' | 'chapterTitle' | 'sectionTitle';
    if (chapter.type === 'volume') {
      titleStyle = 'volumeTitle';
    } else if (chapter.type === 'chapter') {
      titleStyle = 'chapterTitle';
    } else {
      titleStyle = 'sectionTitle';
    }

    docContent.push({
      text: chapter.title,
      style: titleStyle,
      margin: [0, chapter.type === 'volume' ? 40 : 20, 0, 10] as [number, number, number, number],
    });

    // Parse and add paragraphs with first-line indent
    const paragraphs = parseContent(chapter.content);
    for (const para of paragraphs) {
      docContent.push({
        text: para,
        style: 'bodyText',
        margin: [0, 0, 0, 0] as [number, number, number, number],
      });
    }
  }

  // Add materials appendix if requested
  if (options.includeMaterials && options.materialCards && options.materialCards.length > 0) {
    docContent.push({ text: '', pageBreak: 'before' });
    docContent.push({
      text: '附录：素材卡',
      style: 'volumeTitle',
      margin: [0, 20, 0, 20] as [number, number, number, number],
    });

    const characters = options.materialCards.filter(c => c.type === 'character');
    const locations = options.materialCards.filter(c => c.type === 'location');
    const items = options.materialCards.filter(c => c.type === 'item');

    const renderCards = (
      cards: typeof characters,
      title: string,
      emoji: string
    ): Content[] => {
      if (!cards.length) return [];
      const content: Content[] = [
        {
          text: `${emoji} ${title}`,
          style: 'sectionTitle',
          margin: [0, 15, 0, 10] as [number, number, number, number],
        },
      ];
      for (const card of cards) {
        const fieldsText = Object.entries(card.fields)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}：${v}`)
          .join('；');
        content.push({
          text: card.name,
          style: 'chapterTitle',
          margin: [0, 10, 0, 5] as [number, number, number, number],
        });
        if (fieldsText) {
          content.push({
            text: fieldsText,
            style: 'bodyText',
          });
        }
      }
      return content;
    };

    docContent.push(...renderCards(characters, '人物', '👤'));
    docContent.push(...renderCards(locations, '地点', '📍'));
    docContent.push(...renderCards(items, '物品', '🎁'));
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [leftRightMargin, topBottomMargin, leftRightMargin, topBottomMargin],
    info: {
      title: metadata.title,
      author: metadata.author || 'Unknown',
      subject: metadata.category || '',
      keywords: metadata.description || '',
    },
    content: docContent as any,
    styles: {
      volumeTitle: {
        fontSize: 20,
        bold: true,
        alignment: 'center',
        margin: [0, 30, 0, 20] as [number, number, number, number],
      },
      chapterTitle: {
        fontSize: 16,
        bold: true,
        alignment: 'left',
        margin: [0, 20, 0, 10] as [number, number, number, number],
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
        alignment: 'left',
        margin: [0, 15, 0, 10] as [number, number, number, number],
      },
      bodyText: {
        fontSize: 14,
        font: 'Courier', // Monospace font for body
        alignment: 'justify',
        lineHeight: 1.6,
        // First-line indent: 2 characters (approximately 2em at 14pt)
        preserveLeadingSpaces: true,
      },
    },
    defaultStyle: {
      font: 'Courier',
      fontSize: 14,
    },
    footer: function(currentPage: number, pageCount: number) {
      return {
        text: `第 ${currentPage} 页 / 共 ${pageCount} 页`,
        alignment: 'center',
        margin: [0, 10, 0, 0] as [number, number, number, number],
        fontSize: 10,
      };
    },
    header: function(currentPage: number, pageCount: number, pageSize: [number, number]) {
      // Skip header on first page (cover)
      if (currentPage === 1) return { text: '' };
      return {
        text: metadata.title,
        alignment: 'right',
        margin: [0, 15, 20, 0] as [number, number, number, number],
        fontSize: 9,
        color: '#888888',
      };
    },
  };

  return { docDefinition, chapterCount };
}

/**
 * Generate PDF and download
 */
export async function generatePdf(
  metadata: PdfMetadata,
  chapters: PdfChapter[],
  options: PdfExportOptions = {}
): Promise<void> {
  const { docDefinition } = generatePdfContent(chapters, metadata, options);

  const filename = `${metadata.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.pdf`;

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.download(filename);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate PDF blob for preview or further processing
 */
export async function generatePdfBlob(
  metadata: PdfMetadata,
  chapters: PdfChapter[],
  options: PdfExportOptions = {}
): Promise<Blob> {
  const { docDefinition } = generatePdfContent(chapters, metadata, options);

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBlob((blob: Blob) => {
        resolve(blob);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Open PDF in new tab
 */
export async function openPdf(
  metadata: PdfMetadata,
  chapters: PdfChapter[],
  options: PdfExportOptions = {}
): Promise<void> {
  const { docDefinition } = generatePdfContent(chapters, metadata, options);

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.open();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
