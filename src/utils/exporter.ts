export type ExportFormat = 'txt' | 'html' | 'pdf' | 'epub'

export interface ExportMetadata {
  title: string
  author: string
  createdAt: number
  wordCount?: number
}

export interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeRevisionHistory: boolean
  chapterBreak: string
}

interface ExportStyle {
  fontFamily: string
  fontSize: string
  lineHeight: string
  maxWidth: string
  padding: string
  textColor: string
}

const DEFAULT_HTML_STYLE: ExportStyle = {
  fontFamily: "'Georgia', 'SimSun', serif",
  fontSize: '16px',
  lineHeight: '1.8',
  maxWidth: '800px',
  padding: '40px',
  textColor: '#333'
}

export class Exporter {
  private options: ExportOptions = {
    format: 'txt',
    includeMetadata: true,
    includeRevisionHistory: false,
    chapterBreak: '\n\n---\n\n'
  }

  setOptions(options: Partial<ExportOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * 导出为纯文本
   */
  exportAsTxt(content: string, metadata?: ExportMetadata): string {
    let output = ''

    if (metadata && this.options.includeMetadata) {
      output += this.formatMetadata(metadata) + '\n\n'
    }

    output += content

    return output
  }

  /**
   * 格式化元数据
   */
  private formatMetadata(metadata: ExportMetadata): string {
    return [
      `《${metadata.title}》`,
      `作者: ${metadata.author}`,
      `创作时间: ${new Date(metadata.createdAt).toLocaleDateString('zh-CN')}`,
      metadata.wordCount ? `字数: ${metadata.wordCount}` : ''
    ].filter(Boolean).join('\n')
  }

  /**
   * 导出为HTML（可打印/转换PDF）
   */
  exportAsHtml(content: string, metadata?: ExportMetadata, style?: ExportStyle): string {
    const styles = style || DEFAULT_HTML_STYLE

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${metadata?.title || '作品'}</title>
  <style>
    body {
      font-family: ${styles.fontFamily};
      font-size: ${styles.fontSize};
      line-height: ${styles.lineHeight};
      max-width: ${styles.maxWidth};
      margin: 0 auto;
      padding: ${styles.padding};
      color: ${styles.textColor};
    }
    h1 { text-align: center; margin-bottom: 2em; }
    .metadata { text-align: center; color: #666; margin-bottom: 2em; }
    .chapter { margin-top: 3em; }
    .chapter-title { text-align: center; margin-bottom: 1em; }
    p { text-indent: 2em; margin: 0.5em 0; }
    .dialogue { text-indent: 0; margin-left: 2em; }
  </style>
</head>
<body>
  ${metadata && this.options.includeMetadata ? `
  <h1>${metadata.title}</h1>
  <div class="metadata">
    <p>作者: ${metadata.author}</p>
    <p>创作时间: ${new Date(metadata.createdAt).toLocaleDateString('zh-CN')}</p>
    ${metadata.wordCount ? `<p>字数: ${metadata.wordCount}</p>` : ''}
  </div>
  ` : ''}
  <div class="content">${this.contentToHtml(content)}</div>
</body>
</html>`
  }

  /**
   * 内容转HTML（处理段落和对话）
   */
  private contentToHtml(content: string): string {
    return content
      .split('\n\n')
      .map(p => {
        // 对话检测（中文对话格式：""：或""）
        if (p.match(/^"[^"]+"[：:]/)) {
          return `<p class="dialogue">${this.escapeHtml(p)}</p>`
        }
        return `<p>${this.escapeHtml(p)}</p>`
      })
      .join('\n')
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>')
  }

  /**
   * 导出为PDF（通过浏览器打印）
   */
  exportAsPdf(content: string, metadata?: ExportMetadata): void {
    const html = this.exportAsHtml(content, metadata)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  /**
   * 下载文件
   */
  download(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 导出并下载
   */
  exportAndDownload(content: string, metadata?: ExportMetadata, format?: ExportFormat): void {
    const fmt = format || this.options.format
    const filename = `${metadata?.title || '作品'}`

    switch (fmt) {
      case 'txt':
        this.download(this.exportAsTxt(content, metadata), `${filename}.txt`, 'text/plain')
        break
      case 'html':
        this.download(this.exportAsHtml(content, metadata), `${filename}.html`, 'text/html')
        break
      case 'pdf':
        this.exportAsPdf(content, metadata)
        break
    }
  }
}

export const exporter = new Exporter()
