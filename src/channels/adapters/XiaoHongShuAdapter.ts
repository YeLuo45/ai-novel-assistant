/**
 * XiaoHongShu (Little Red Book) Adapter - V54
 */

import type { ChannelAdapter, ChapterContent, PublishOptions, PublishResult, ChannelStatus } from '../ChannelAdapter'
import { formatEngine } from '../FormatEngine'

export class XiaoHongShuAdapter implements ChannelAdapter {
  id = 'xiaohongshu'
  name = '小红书'
  icon = '📕'

  private config = {
    xhsId: '',
    accessToken: ''
  }

  configure(xhsId: string, accessToken: string) {
    this.config = { xhsId, accessToken }
  }

  async publish(content: ChapterContent, options: PublishOptions): Promise<PublishResult> {
    if (!await this.validateConfig()) {
      return { success: false, error: 'Invalid configuration: missing xhsId or accessToken' }
    }

    const formatted = this.formatContent(content, options)

    try {
      const mockUrl = `https://www.xiaohongshu.com/discovery/item/${Date.now()}`

      return {
        success: true,
        url: mockUrl,
        publishedAt: Date.now(),
        platformPostId: `xhs_${Date.now()}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async validateConfig(): Promise<boolean> {
    return !!(this.config.xhsId && this.config.accessToken)
  }

  getStatus(): ChannelStatus {
    return {
      connected: !!(this.config.xhsId && this.config.accessToken),
      totalPublished: 0
    }
  }

  formatContent(content: ChapterContent, options: PublishOptions) {
    return formatEngine.format(content, 'xiaohongshu', options)
  }
}

export const xiaoHongShuAdapter = new XiaoHongShuAdapter()