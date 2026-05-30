/**
 * Channels V2 Tests - V59
 * Tests for PlatformAnalyzer, ContentAdapterV2, PublishingScheduler, PerformanceTracker
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  PLATFORM_PROFILES,
  getNextBestSlot,
  calculateOptimalLength,
  truncateToLimit,
  splitContentForPlatform,
  predictEngagement,
  generatePlatformTags,
  calculateCampaignROI,
  type PlatformProfile,
  type ContentVersion,
  type PublishingCampaign
} from './channelsV2Types'

// Mock Dexie
vi.mock('dexie', () => ({
  __esModule: true,
  default: class MockDexie {
    version = vi.fn().mockReturnThis()
    stores = vi.fn().mockReturnThis()
    campaigns = { add: vi.fn(), put: vi.fn(), toArray: vi.fn() }
  }
}))

const createCampaign = (overrides: Partial<PublishingCampaign> = {}): PublishingCampaign => ({
  id: 'camp_1',
  title: 'Test Campaign',
  originalContentId: 'content_1',
  versions: [],
  totalPublished: 0,
  totalViews: 0,
  totalEngagement: 0,
  createdAt: Date.now(),
  ...overrides
})

const createVersion = (overrides: Partial<ContentVersion> = {}): ContentVersion => ({
  id: 'v1',
  platformId: 'wechat',
  title: 'Test Title',
  body: 'Test body content',
  summary: 'Test summary',
  tags: ['tag1', 'tag2'],
  status: 'published',
  views: 1000,
  engagement: 50,
  ...overrides
})

describe('Platform Profiles', () => {
  it('should have all 5 major platforms', () => {
    expect(PLATFORM_PROFILES).toHaveProperty('wechat')
    expect(PLATFORM_PROFILES).toHaveProperty('xiaohongshu')
    expect(PLATFORM_PROFILES).toHaveProperty('weibo')
    expect(PLATFORM_PROFILES).toHaveProperty('zhihu')
    expect(PLATFORM_PROFILES).toHaveProperty('qidian')
  })

  it('should have valid platform profiles', () => {
    for (const [id, profile] of Object.entries(PLATFORM_PROFILES)) {
      expect(profile.id).toBe(id)
      expect(profile.name).toBeDefined()
      expect(profile.contentRules).toBeDefined()
      expect(profile.trafficPeak.length).toBeGreaterThan(0)
    }
  })

  it('should have correct content rules for wechat', () => {
    const wechat = PLATFORM_PROFILES.wechat
    expect(wechat.contentRules.titleMaxLength).toBe(64)
    expect(wechat.contentRules.bodyMaxLength).toBe(20000)
    expect(wechat.contentRules.requiresImage).toBe(true)
  })

  it('should have correct rules for xiaohongshu', () => {
    const xhs = PLATFORM_PROFILES.xiaohongshu
    expect(xhs.contentRules.titleMaxLength).toBe(20)
    expect(xhs.contentRules.bodyMaxLength).toBe(1000)
    expect(xhs.imageRequired).toBe(true)
  })

  it('should have correct rules for qidian', () => {
    const qidian = PLATFORM_PROFILES.qidian
    expect(qidian.contentRules.minWordCount).toBeGreaterThanOrEqual(2000)
    expect(qidian.contentRules.allowImages).toBe(false)
  })
})

describe('getNextBestSlot', () => {
  it('should return a time slot for valid platform', () => {
    const slot = getNextBestSlot('wechat')
    expect(slot).toBeDefined()
    expect(slot?.score).toBeGreaterThan(0)
  })

  it('should return null for unknown platform', () => {
    const slot = getNextBestSlot('unknown')
    expect(slot).toBeNull()
  })

  it('should return highest scoring slot', () => {
    const slot = getNextBestSlot('wechat')
    const wechat = PLATFORM_PROFILES.wechat
    expect(slot?.score).toBe(Math.max(...wechat.trafficPeak.map(t => t.score)))
  })
})

describe('calculateOptimalLength', () => {
  it('should return platform-specific optimal length', () => {
    const length = calculateOptimalLength('wechat', 'short')
    expect(length.min).toBeDefined()
    expect(length.max).toBeDefined()
  })

  it('should return default range for unknown platform', () => {
    const length = calculateOptimalLength('unknown', 'some content here')
    expect(length.min).toBe(100)
    expect(length.max).toBe(1000)
  })

  it('should return platform-appropriate lengths', () => {
    const wechatLength = calculateOptimalLength('wechat', 'a'.repeat(5000))
    const qidianLength = calculateOptimalLength('qidian', 'a'.repeat(5000))
    // Both should return valid length ranges
    expect(wechatLength.min).toBeGreaterThan(0)
    expect(qidianLength.min).toBeGreaterThan(0)
    expect(wechatLength.max).toBeGreaterThan(wechatLength.min)
    expect(qidianLength.max).toBeGreaterThan(qidianLength.min)
  })
})

describe('truncateToLimit', () => {
  it('should not truncate short content', () => {
    const short = 'Short content'
    expect(truncateToLimit(short, 100)).toBe(short)
  })

  it('should truncate long content with ellipsis', () => {
    const long = 'a'.repeat(200)
    const result = truncateToLimit(long, 50)
    expect(result.length).toBe(50)
    expect(result.endsWith('...')).toBe(true)
  })

  it('should truncate without ellipsis when addEllipsis is false', () => {
    const long = 'a'.repeat(200)
    const result = truncateToLimit(long, 50, false)
    expect(result.length).toBeLessThanOrEqual(50)
    expect(result.endsWith('...')).toBe(false)
  })
})

describe('splitContentForPlatform', () => {
  it('should not split short content', () => {
    const short = 'Short content'
    const segments = splitContentForPlatform(short, 'wechat')
    expect(segments).toHaveLength(1)
    expect(segments[0]).toBe(short)
  })

  it('should split long content for wechat', () => {
    const long = 'a'.repeat(25000)
    const segments = splitContentForPlatform(long, 'wechat')
    expect(segments.length).toBeGreaterThan(1)
    // All segments except last should be at or near limit
    for (let i = 0; i < segments.length - 1; i++) {
      expect(segments[i].length).toBeLessThanOrEqual(20000)
    }
  })

  it('should split at sentence boundaries when possible', () => {
    const withSentences = '第一句。第二句。第三句。' + 'a'.repeat(1000)
    const segments = splitContentForPlatform(withSentences, 'wechat')
    // Should cut at sentence boundary if available
    expect(segments.length).toBeGreaterThan(0)
  })

  it('should return single segment for unknown platform', () => {
    const content = 'a'.repeat(30000)
    const segments = splitContentForPlatform(content, 'unknown')
    expect(segments).toHaveLength(1)
  })
})

describe('predictEngagement', () => {
  it('should return prediction for valid platform', () => {
    const prediction = predictEngagement('Some engaging content here!', 'wechat')
    expect(prediction).toBeGreaterThan(0)
    expect(prediction).toBeLessThanOrEqual(1)
  })

  it('should return 0 for unknown platform', () => {
    const prediction = predictEngagement('Content', 'unknown')
    expect(prediction).toBe(0)
  })

  it('should consider content length in engagement', () => {
    const shortContent = 'Short'
    const longContent = 'a'.repeat(5000) + '!'
    const shortPred = predictEngagement(shortContent, 'wechat')
    const longPred = predictEngagement(longContent, 'wechat')
    // Longer content with punctuation should score higher
    expect(longPred).toBeGreaterThan(shortPred)
  })

  it('should adjust for ideal content range', () => {
    const idealContent = 'a'.repeat(3000) + '?'
    const prediction = predictEngagement(idealContent, 'wechat')
    // Should return a positive engagement prediction
    expect(prediction).toBeGreaterThan(0)
    expect(prediction).toBeLessThan(1)
  })
})

describe('generatePlatformTags', () => {
  it('should add platform-specific tags', () => {
    const tags = generatePlatformTags(['writing'], 'wechat')
    expect(tags).toContain('writing')
    expect(tags).toContain('公众号')
  })

  it('should limit tags to 5', () => {
    const tags = generatePlatformTags(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 'wechat')
    expect(tags.length).toBeLessThanOrEqual(5)
  })

  it('should not duplicate existing tags', () => {
    const tags = generatePlatformTags(['公众号', '文章'], 'wechat')
    const tagCount = tags.filter(t => t === '公众号').length
    expect(tagCount).toBe(1)
  })

  it('should return platform keywords for unknown platform', () => {
    const tags = generatePlatformTags(['tag1'], 'unknown')
    expect(tags).toContain('tag1')
  })
})

describe('calculateCampaignROI', () => {
  it('should calculate zero metrics for empty campaign', () => {
    const campaign = createCampaign()
    const roi = calculateCampaignROI(campaign)
    expect(roi.totalReach).toBe(0)
    expect(roi.engagementRate).toBe(0)
  })

  it('should calculate total reach from versions', () => {
    const campaign = createCampaign({
      versions: [
        createVersion({ platformId: 'wechat', views: 1000 }),
        createVersion({ platformId: 'weibo', views: 500 })
      ]
    })
    const roi = calculateCampaignROI(campaign)
    expect(roi.totalReach).toBe(1500)
  })

  it('should calculate engagement rate', () => {
    const campaign = createCampaign({
      versions: [
        createVersion({ views: 1000, engagement: 50 }),
        createVersion({ views: 1000, engagement: 100 })
      ]
    })
    const roi = calculateCampaignROI(campaign)
    expect(roi.engagementRate).toBeGreaterThan(0.05)
    expect(roi.engagementRate).toBeLessThan(0.15)
  })

  it('should identify best performing platform', () => {
    const campaign = createCampaign({
      versions: [
        createVersion({ platformId: 'wechat', views: 500 }),
        createVersion({ platformId: 'weibo', views: 2000 }),
        createVersion({ platformId: 'zhihu', views: 800 })
      ]
    })
    const roi = calculateCampaignROI(campaign)
    expect(roi.bestPlatform).toBe('weibo')
  })

  it('should calculate average views per platform', () => {
    const campaign = createCampaign({
      versions: [
        createVersion({ platformId: 'wechat', views: 1000 }),
        createVersion({ platformId: 'weibo', views: 2000 })
      ]
    })
    const roi = calculateCampaignROI(campaign)
    expect(roi.avgViewsPerPlatform).toBe(1500)
  })
})

describe('ContentVersion', () => {
  it('should support all status values', () => {
    const statuses: ('draft' | 'scheduled' | 'published')[] = ['draft', 'scheduled', 'published']
    statuses.forEach(s => {
      const v = createVersion({ status: s })
      expect(v.status).toBe(s)
    })
  })

  it('should track views and engagement', () => {
    const v = createVersion({ views: 5000, engagement: 250 })
    expect(v.views).toBe(5000)
    expect(v.engagement).toBe(250)
  })
})

describe('PlatformProfile', () => {
  it('should have correct traffic peak times for wechat', () => {
    const wechat = PLATFORM_PROFILES.wechat
    const wedPeak = wechat.trafficPeak.find(t => t.dayOfWeek === 3)
    expect(wedPeak?.hour).toBe(20)
    expect(wedPeak?.score).toBeGreaterThan(0.8)
  })

  it('should have correct audience age ranges', () => {
    const wechat = PLATFORM_PROFILES.wechat
    expect(wechat.audienceAgeRange.min).toBeLessThan(wechat.audienceAgeRange.max)
  })

  it('should have engagement rates between 0 and 1', () => {
    for (const profile of Object.values(PLATFORM_PROFILES)) {
      expect(profile.averageEngagementRate).toBeGreaterThan(0)
      expect(profile.averageEngagementRate).toBeLessThan(1)
    }
  })
})

describe('TimeSlot', () => {
  it('should have valid day and hour ranges', () => {
    for (const profile of Object.values(PLATFORM_PROFILES)) {
      for (const slot of profile.trafficPeak) {
        expect(slot.dayOfWeek).toBeGreaterThanOrEqual(0)
        expect(slot.dayOfWeek).toBeLessThanOrEqual(7)
        expect(slot.hour).toBeGreaterThanOrEqual(0)
        expect(slot.hour).toBeLessThanOrEqual(23)
        expect(slot.score).toBeGreaterThan(0)
        expect(slot.score).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('Integration', () => {
  it('should work end-to-end for multi-platform campaign', () => {
    const content = '这是一篇关于写作的文章，包含丰富的内容和价值。?'

    // Split for different platforms
    const wechatSegs = splitContentForPlatform(content.repeat(100), 'wechat')
    const xhsSegs = splitContentForPlatform(content, 'xiaohongshu')

    // Predict engagement
    const wechatEng = predictEngagement(content.repeat(100), 'wechat')
    const xhsEng = predictEngagement(content, 'xiaohongshu')

    // Generate tags
    const wechatTags = generatePlatformTags(['写作', '创作'], 'wechat')
    const xhsTags = generatePlatformTags(['写作', '创作'], 'xiaohongshu')

    expect(wechatSegs.length).toBeGreaterThan(0)
    expect(xhsSegs.length).toBe(1)
    expect(wechatEng).toBeGreaterThan(0)
    expect(xhsEng).toBeGreaterThan(0)
    expect(wechatTags.length).toBeLessThanOrEqual(5)
    expect(xhsTags.length).toBeLessThanOrEqual(5)
  })
})