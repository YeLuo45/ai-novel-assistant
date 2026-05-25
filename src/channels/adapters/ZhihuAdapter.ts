/**
 * Zhihu Adapter - V54
 */

import type { ChannelAdapter, ChapterContent, PublishOptions, PublishResult, ChannelStatus } from '../ChannelAdapter'
import { formatEngine } from '../FormatEngine'

export class ZhihuAdapter implements ChannelAdapter {
  id = 'zhihu'
  name = '知乎'
  icon = '💬'

  private config = {
    zhihuId: '',
    accessToken: ''
  }

  configure(zhihuId: string, accessToken: string) {
    this.config = { zhihuId, accessToken }
  }

  async publish(content: ChapterContent, options: PublishOptions): Promise<PublishResult> {
    if (!await this.validateConfig()) {
      return { success: false, error: 'Invalid configuration' }
    }

    const formatted = this.formatContent(content, options)

    try {
      const mockUrl = `https://zhuanlan.zhihu.com/p/${Date.now()}`

      return {
        success: true,
        url: mockUrl,
        publishedAt: Date.now(),
        platformPostId: `zh_${Date.now()}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async validateConfig(): Promise<boolean> {
    return !!(this.config.zhihuId && this.config.accessToken)
  }

  getStatus(): ChannelStatus {
    return {
      connected: !!(this.config.zhihuId && this.config.accessToken),
      totalPublished: 0
    }
  }

  formatContent(content: ChapterContent, options: PublishOptions) {
    return formatEngine.format(content, 'zhihu', options)
  }
}

export const zhihuAdapter = new ZhihuAdapter()