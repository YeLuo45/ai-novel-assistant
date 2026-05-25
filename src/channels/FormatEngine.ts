/**
 * Format Conversion Engine - V54
 * Converts chapter content to platform-specific formats using templates
 */

import type { ChapterContent, PublishOptions, FormattedContent } from './ChannelAdapter'

export interface FormatTemplate {
  title: string
  body: string
  excerpt?: string
  tags?: string[]
  customFields?: Record<string, string>
}

export const PLATFORM_TEMPLATES: Record<string, FormatTemplate> = {
  wechat: {
    title: '{title}',
    body: '{content}',
    excerpt: '{summary}',
    tags: ['{tags}'],
    customFields: {
      author: '{author}',
      source_url: '{source_url}',
      digest: '{summary}'
    }
  },
  xiaohongshu: {
    title: '【{chapter}】{title}',
    body: '{content}\n\n💡 {summary}',
    excerpt: '{summary}',
    tags: ['{tags}', '小说', '创作']
  },
  weibo: {
    title: '📖 {title}',
    body: '{content}\n\n#{tags}#',
    excerpt: '{summary}',
    tags: ['{tags}']
  },
  zhihu: {
    title: '{title}',
    body: '{content}',
    excerpt: '{summary}',
    tags: ['{tags}', '小说创作', '写作技巧']
  },
  qidian: {
    title: '第{chapterNumber}章 {title}',
    body: '{content}',
    excerpt: '{summary}',
    tags: ['{tags}'],
    customFields: {
      author: '{author}',
      word_count: '{word_count}'
    }
  }
}

export class FormatEngine {
  private applyTemplate(template: string, vars: Record<string, string | number | undefined>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = vars[key]
      return value !== undefined ? String(value) : match
    })
  }

  format(content: ChapterContent, platform: string, options: PublishOptions = {}): FormattedContent {
    const template = PLATFORM_TEMPLATES[platform] || PLATFORM_TEMPLATES.wechat

    const chapterStr = content.chapterNumber ? `第${this.toChineseNumber(content.chapterNumber)}章` : ''
    const wordCount = content.wordCount || this.countWords(content.content)

    const vars: Record<string, string | number | undefined> = {
      title: content.title,
      content: content.content,
      author: content.author,
      chapter: chapterStr,
      chapterNumber: content.chapterNumber,
      summary: options.summary || content.summary || '',
      tags: (options.tags || content.tags || []).join(', '),
      word_count: wordCount,
      source_url: content.sourceUrl || ''
    }

    const title = this.applyTemplate(template.title, vars)
    const body = this.applyTemplate(template.body, vars)
    const excerpt = template.excerpt ? this.applyTemplate(template.excerpt, vars) : undefined

    const tagStr = template.tags ? this.applyTemplate(template.tags.join(', '), vars) : ''
    const tags = this.parseTags(tagStr, options.tags || content.tags || [])

    let customFields: Record<string, unknown> | undefined
    if (template.customFields) {
      customFields = {}
      for (const [k, v] of Object.entries(template.customFields)) {
        customFields[k] = this.applyTemplate(v, vars)
      }
    }

    return { title, body, excerpt, tags, customFields }
  }

  private toChineseNumber(num: number): string {
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    if (num <= 10) return digits[num]
    if (num < 20) return `十${digits[num - 10]}`
    if (num < 100) {
      const tens = Math.floor(num / 10)
      const ones = num % 10
      return `${digits[tens]}十${ones > 0 ? digits[ones] : ''}`
    }
    return String(num)
  }

  private countWords(text: string): number {
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const english = (text.match(/[a-zA-Z]/g) || []).length
    return chinese + english
  }

  private parseTags(tagStr: string, fallback: string[]): string[] {
    const tags = tagStr.split(/[,#]/).map(t => t.trim()).filter(t => t)
    return tags.length > 0 ? tags : fallback
  }
}

export const formatEngine = new FormatEngine()