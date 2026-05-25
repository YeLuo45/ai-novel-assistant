/**
 * Channel Module Tests - V54
 * Tests for ChannelAdapter interface, FormatEngine, and Adapters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FormatEngine, formatEngine, PLATFORM_TEMPLATES } from './FormatEngine'
import { weChatOfficialAdapter } from './adapters/WeChatOfficialAdapter'
import { xiaoHongShuAdapter } from './adapters/XiaoHongShuAdapter'
import { weiboAdapter } from './adapters/WeiboAdapter'
import { zhihuAdapter } from './adapters/ZhihuAdapter'
import type { ChapterContent, PublishOptions, ChannelAdapter } from './ChannelAdapter'

// Mock Dexie for channelDb
vi.mock('./channelDb', () => ({
  channelDb: {
    channel_configs: { put: vi.fn(), get: vi.fn(), delete: vi.fn() },
    publish_history: { add: vi.fn(), where: vi.fn(), toArray: vi.fn() }
  }
}))

describe('FormatEngine', () => {
  const sampleContent: ChapterContent = {
    title: '测试章节',
    content: '这是一个测试内容。',
    author: '测试作者',
    chapterNumber: 5,
    wordCount: 100,
    summary: '这是章节摘要',
    tags: ['玄幻', '修仙']
  }

  describe('format', () => {
    it('should apply wechat template correctly', () => {
      const result = formatEngine.format(sampleContent, 'wechat')

      expect(result.title).toBe('测试章节')
      expect(result.body).toBe('这是一个测试内容。')
      expect(result.excerpt).toBe('这是章节摘要')
    })

    it('should apply xiaohongshu template with chapter number', () => {
      const result = formatEngine.format(sampleContent, 'xiaohongshu')

      expect(result.title).toContain('测试章节')
      expect(result.title).toContain('第五章')
      expect(result.body).toContain('这是章节摘要')
    })

    it('should apply weibo template with hashtags', () => {
      const result = formatEngine.format(sampleContent, 'weibo')

      expect(result.title).toContain('测试章节')
      expect(result.body).toContain('#')
    })

    it('should apply zhihu template', () => {
      const result = formatEngine.format(sampleContent, 'zhihu')

      expect(result.title).toBe('测试章节')
      expect(result.tags).toContain('小说创作')
    })

    it('should apply qidian template with chapter number', () => {
      const result = formatEngine.format(sampleContent, 'qidian')

      expect(result.title).toContain('第')
      expect(result.title).toContain('测试章节')
      expect(result.customFields?.author).toBe('测试作者')
    })

    it('should use wechat template as default for unknown platform', () => {
      const result = formatEngine.format(sampleContent, 'unknown' as any)

      expect(result.title).toBe('测试章节')
      expect(result.body).toBe('这是一个测试内容。')
    })

    it('should override content with options', () => {
      const options: PublishOptions = {
        summary: '自定义摘要'
      }
      const result = formatEngine.format(sampleContent, 'wechat', options)

      expect(result.excerpt).toBe('自定义摘要')
    })

    it('should include customFields for wechat', () => {
      const result = formatEngine.format(sampleContent, 'wechat')

      expect(result.customFields).toBeDefined()
      expect(result.customFields?.author).toBe('测试作者')
    })

    it('should handle content without chapterNumber', () => {
      const contentWithoutChapter: ChapterContent = {
        title: '无章节内容',
        content: '内容',
        author: '作者'
      }
      const result = formatEngine.format(contentWithoutChapter, 'xiaohongshu')

      expect(result.title).toContain('无章节内容')
    })

    it('should count words correctly for mixed Chinese/English text', () => {
      const mixedContent: ChapterContent = {
        title: 'Mixed Content',
        content: 'Hello World 你好世界',
        author: 'Author'
      }
      const result = formatEngine.format(mixedContent, 'qidian')

      expect(result.customFields?.word_count).toBeDefined()
      expect(Number(result.customFields?.word_count)).toBeGreaterThan(0)
    })
  })

  describe('PLATFORM_TEMPLATES', () => {
    it('should have wechat template', () => {
      expect(PLATFORM_TEMPLATES.wechat).toBeDefined()
      expect(PLATFORM_TEMPLATES.wechat.title).toBe('{title}')
    })

    it('should have xiaohongshu template', () => {
      expect(PLATFORM_TEMPLATES.xiaohongshu).toBeDefined()
      expect(PLATFORM_TEMPLATES.xiaohongshu.body).toContain('{content}')
    })

    it('should have weibo template', () => {
      expect(PLATFORM_TEMPLATES.weibo).toBeDefined()
      expect(PLATFORM_TEMPLATES.weibo.body).toContain('#')
    })

    it('should have zhihu template', () => {
      expect(PLATFORM_TEMPLATES.zhihu).toBeDefined()
      expect(PLATFORM_TEMPLATES.zhihu.tags).toContain('小说创作')
    })

    it('should have qidian template', () => {
      expect(PLATFORM_TEMPLATES.qidian).toBeDefined()
      expect(PLATFORM_TEMPLATES.qidian.title).toContain('{chapterNumber}')
    })
  })
})

describe('WeChatOfficialAdapter', () => {
  const adapter: ChannelAdapter = weChatOfficialAdapter

  it('should have correct id and name', () => {
    expect(adapter.id).toBe('wechat')
    expect(adapter.name).toBe('微信公众号')
    expect(adapter.icon).toBe('📮')
  })

  it('should format content using wechat template', () => {
    const content: ChapterContent = {
      title: '测试',
      content: '内容',
      author: '作者'
    }
    const formatted = adapter.formatContent(content, {})

    expect(formatted.title).toBe('测试')
    expect(formatted.body).toBe('内容')
  })

  it('should return disconnected status without config', () => {
    const status = adapter.getStatus()

    expect(status.connected).toBe(false)
  })

  it('should validate config - false when missing', async () => {
    const valid = await adapter.validateConfig()
    expect(valid).toBe(false)
  })

  it('should return error result when config invalid', async () => {
    const result = await adapter.publish(
      { title: 'Test', content: 'Content', author: 'Author' },
      {}
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid configuration')
  })

  it('should return successful publish result with mock URL', async () => {
    // Configure first
    ;(weChatOfficialAdapter as any).config = {
      appId: 'test_app_id',
      appSecret: 'test_secret',
      accountId: 'test_account'
    }

    const result = await adapter.publish(
      { title: 'Test', content: 'Content', author: 'Author' },
      {}
    )

    expect(result.success).toBe(true)
    expect(result.url).toContain('mp.weixin.qq.com')
    expect(result.publishedAt).toBeDefined()
  })
})

describe('XiaoHongShuAdapter', () => {
  const adapter: ChannelAdapter = xiaoHongShuAdapter

  it('should have correct id and name', () => {
    expect(adapter.id).toBe('xiaohongshu')
    expect(adapter.name).toBe('小红书')
    expect(adapter.icon).toBe('📕')
  })

  it('should format content using xiaohongshu template', () => {
    const content: ChapterContent = {
      title: '测试',
      content: '内容',
      author: '作者',
      chapterNumber: 1
    }
    const formatted = adapter.formatContent(content, {})

    expect(formatted.title).toContain('第一章')
  })

  it('should return disconnected status without config', () => {
    const status = adapter.getStatus()
    expect(status.connected).toBe(false)
  })

  it('should return error when config invalid', async () => {
    const result = await adapter.publish(
      { title: 'Test', content: 'Content', author: 'Author' },
      {}
    )

    expect(result.success).toBe(false)
  })

  it('should return successful result when configured', async () => {
    ;(xiaoHongShuAdapter as any).config = {
      xhsId: 'test_id',
      accessToken: 'test_token'
    }

    const result = await adapter.publish(
      { title: 'Test', content: 'Content', author: 'Author' },
      {}
    )

    expect(result.success).toBe(true)
    expect(result.url).toContain('xiaohongshu.com')
  })
})

describe('WeiboAdapter', () => {
  const adapter: ChannelAdapter = weiboAdapter

  it('should have correct id and name', () => {
    expect(adapter.id).toBe('weibo')
    expect(adapter.name).toBe('微博')
    expect(adapter.icon).toBe('📰')
  })

  it('should format content with hashtags', () => {
    const content: ChapterContent = {
      title: '测试',
      content: '内容',
      author: '作者'
    }
    const formatted = adapter.formatContent(content, {})

    expect(formatted.body).toContain('#')
  })

  it('should return disconnected status initially', () => {
    const status = adapter.getStatus()
    expect(status.connected).toBe(false)
  })
})

describe('ZhihuAdapter', () => {
  const adapter: ChannelAdapter = zhihuAdapter

  it('should have correct id and name', () => {
    expect(adapter.id).toBe('zhihu')
    expect(adapter.name).toBe('知乎')
    expect(adapter.icon).toBe('💬')
  })

  it('should format content for zhihu', () => {
    const content: ChapterContent = {
      title: '测试',
      content: '内容',
      author: '作者'
    }
    const formatted = adapter.formatContent(content, {})

    expect(formatted.title).toBe('测试')
    expect(formatted.tags).toContain('小说创作')
  })

  it('should return disconnected status initially', () => {
    const status = adapter.getStatus()
    expect(status.connected).toBe(false)
  })
})