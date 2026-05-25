/**
 * Weibo Adapter - V54
 */

import type { ChannelAdapter, ChapterContent, PublishOptions, PublishResult, ChannelStatus } from '../ChannelAdapter'
import { formatEngine } from '../FormatEngine'

export class WeiboAdapter implements ChannelAdapter {
  id = 'weibo'
  name = '微博'
  icon = '📰'

  private config = {
    wbUid: '',
    accessToken: ''
  }

  configure(wbUid: string, accessToken: string) {
    this.config = { wbUid, accessToken }
  }

  async publish(content: ChapterContent, options: PublishOptions): Promise<PublishResult> {
    if (!await this.validateConfig()) {
      return { success: false, error: 'Invalid configuration' }
    }

    const formatted = this.formatContent(content, options)

    try {
      const mockUrl = `https://weibo.com/u/${Date.now()}`

      return {
        success: true,
        url: mockUrl,
        publishedAt: Date.now(),
        platformPostId: `wb_${Date.now()}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async validateConfig(): Promise<boolean> {
    return !!(this.config.wbUid && this.config.accessToken)
  }

  getStatus(): ChannelStatus {
    return {
      connected: !!(this.config.wbUid && this.config.accessToken),
      totalPublished: 0
    }
  }

  formatContent(content: ChapterContent, options: PublishOptions) {
    return formatEngine.format(content, 'weibo', options)
  }
}

export const weiboAdapter = new WeiboAdapter()