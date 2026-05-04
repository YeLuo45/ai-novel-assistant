declare module 'pdfmake/build/pdfmake' {
  export interface TDocumentDefinitions {
    pageSize?: string;
    pageMargins?: [number, number, number, number];
    info?: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string;
    };
    content?: Content;
    styles?: Record<string, Style>;
    defaultStyle?: Style;
    footer?: ((currentPage: number, pageCount: number) => Content) | Content;
    header?: ((currentPage: number, pageCount: number, pageSize: [number, number]) => Content) | Content;
  }

  export interface Style {
    fontSize?: number;
    bold?: boolean;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    font?: string;
    margin?: [number, number, number, number];
    lineHeight?: number;
    preserveLeadingSpaces?: boolean;
    color?: string;
  }

  export type Content = ContentItem | ContentItem[];

  export interface ContentItem {
    text?: string | Content | Content[];
    style?: string;
    margin?: [number, number, number, number];
    pageBreak?: 'before' | 'after';
    alignment?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: number;
    bold?: boolean;
    color?: string;
  }

  export interface PdfDocument {
    download(filename?: string): void;
    open(): void;
    getBlob(callback: (blob: Blob) => void): void;
    getBuffer(callback: (buffer: Uint8Array) => void): void;
  }

  export function createPdf(docDefinition: TDocumentDefinitions): PdfDocument;
  export const vfs: Record<string, string>;
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>;
  export default { vfs };
}
