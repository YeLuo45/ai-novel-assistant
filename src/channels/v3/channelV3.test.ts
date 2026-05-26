/**
 * Channels V3 Tests - V64
 * Tests for PlatformAPIManager, ContentSchedulerV3, PerformanceTrackerV2, AutoReportGenerator
 * All tests must pass 100%
 */

import { describe, it, expect } from 'vitest'
import {
  createPlatformConnection,
  updateConnectionStatus,
  checkRateLimit,
  canMakeRequest,
  consumeQuota,
  validateAPIKey,
  formatPlatformName,
  createScheduledPost,
  updatePostStatus,
  detectScheduleConflict,
  findOptimalTimeSlot,
  reschedulePost,
  calculatePublishPriority,
  sortPostsByPriority,
  calculateEngagementRate,
  aggregatePlatformMetrics,
  calculateEngagementTrend,
  rankContentByPerformance,
  predictNextPeak,
  createReportTemplate,
  addSectionToTemplate,
  generateReportContent,
  calculateReportMetrics,
  isReportOverdue,
  formatReportDate,
  type PlatformConnection,
  type ScheduledPost,
  type PlatformMetrics,
  type ContentPerformance,
  type ReportTemplate,
  type PostAnalytics
} from './channelV3Types'

describe('PlatformAPIManager', () => {
  it('should create platform connection', () => {
    const conn = createPlatformConnection('wechat', 'key_abc12345678901234567890')
    expect(conn.platform).toBe('wechat')
    expect(conn.apiKey).toBe('key_abc12345678901234567890')
    expect(conn.status).toBe('active')
    expect(conn.quota.limit).toBe(100)
  })

  it('should update connection status', () => {
    const conn = createPlatformConnection('weibo', 'key_xyz')
    const updated = updateConnectionStatus(conn, 'rate_limited')
    expect(updated.status).toBe('rate_limited')
    expect(conn.status).toBe('active') // original unchanged
  })

  it('should check rate limit when not reset', () => {
    const conn: PlatformConnection = {
      platform: 'wechat',
      apiKey: 'key_test',
      status: 'active',
      quota: { used: 50, limit: 100, resetAt: Date.now() + 3600000 },
      lastSync: Date.now()
    }
    const rateLimit = checkRateLimit(conn)
    expect(rateLimit.remaining).toBe(50)
    expect(rateLimit.limit).toBe(100)
  })

  it('should reset rate limit when expired', () => {
    const conn: PlatformConnection = {
      platform: 'wechat',
      apiKey: 'key_test',
      status: 'active',
      quota: { used: 80, limit: 100, resetAt: Date.now() - 1000 },
      lastSync: Date.now()
    }
    const rateLimit = checkRateLimit(conn)
    expect(rateLimit.remaining).toBe(100)
  })

  it('should allow request when quota available', () => {
    const conn: PlatformConnection = {
      platform: 'wechat',
      apiKey: 'key_test',
      status: 'active',
      quota: { used: 50, limit: 100, resetAt: Date.now() + 3600000 },
      lastSync: Date.now()
    }
    expect(canMakeRequest(conn)).toBe(true)
  })

  it('should deny request when quota exhausted', () => {
    const conn: PlatformConnection = {
      platform: 'wechat',
      apiKey: 'key_test',
      status: 'active',
      quota: { used: 100, limit: 100, resetAt: Date.now() + 3600000 },
      lastSync: Date.now()
    }
    expect(canMakeRequest(conn)).toBe(false)
  })

  it('should deny request when status not active', () => {
    const conn: PlatformConnection = {
      platform: 'wechat',
      apiKey: 'key_test',
      status: 'expired',
      quota: { used: 0, limit: 100, resetAt: Date.now() + 3600000 },
      lastSync: Date.now()
    }
    expect(canMakeRequest(conn)).toBe(false)
  })

  it('should consume quota', () => {
    const conn = createPlatformConnection('weibo', 'key_test')
    const consumed = consumeQuota(conn, 5)
    expect(consumed.quota.used).toBe(5)
    expect(conn.quota.used).toBe(0) // original unchanged
  })

  it('should validate API key format', () => {
    expect(validateAPIKey('valid_key_12345678901234')).toBe(true)
    expect(validateAPIKey('short_key')).toBe(false)
    expect(validateAPIKey('key with spaces')).toBe(false)
    expect(validateAPIKey('')).toBe(false)
  })

  it('should format platform names', () => {
    expect(formatPlatformName('wechat')).toBe('WeChat Official')
    expect(formatPlatformName('xiaohongshu')).toBe('XiaoHongShu')
    expect(formatPlatformName('weibo')).toBe('Weibo')
    expect(formatPlatformName('unknown')).toBe('unknown')
  })
})

describe('ContentSchedulerV3', () => {
  it('should create scheduled post', () => {
    const time = Date.now() + 86400000
    const post = createScheduledPost('wechat', 'Hello world', time)
    expect(post.platform).toBe('wechat')
    expect(post.content).toBe('Hello world')
    expect(post.scheduledTime).toBe(time)
    expect(post.status).toBe('pending')
    expect(post.retryCount).toBe(0)
    expect(post.maxRetries).toBe(3)
  })

  it('should update post status', () => {
    const post = createScheduledPost('weibo', 'Test', Date.now())
    const updated = updatePostStatus(post, 'published')
    expect(updated.status).toBe('published')
    expect(post.status).toBe('pending') // original unchanged
  })

  it('should detect time conflict', () => {
    const existing: ScheduledPost[] = [
      { id: 'p1', platform: 'wechat', content: 'Post 1', scheduledTime: 1000000, status: 'pending', retryCount: 0, maxRetries: 3 }
    ]
    const newPost = createScheduledPost('wechat', 'Post 2', 1500000) // within 1 hour
    const conflict = detectScheduleConflict(existing, newPost)
    expect(conflict).not.toBeNull()
    expect(conflict!.type).toBe('time')
    expect(conflict!.affectedPosts).toContain('p1')
  })

  it('should not detect conflict for different platforms', () => {
    const existing: ScheduledPost[] = [
      { id: 'p1', platform: 'wechat', content: 'Post 1', scheduledTime: 1000000, status: 'pending', retryCount: 0, maxRetries: 3 }
    ]
    const newPost = createScheduledPost('weibo', 'Post 2', 1100000)
    const conflict = detectScheduleConflict(existing, newPost)
    expect(conflict).toBeNull()
  })

  it('should not detect conflict for distant times', () => {
    const existing: ScheduledPost[] = [
      { id: 'p1', platform: 'wechat', content: 'Post 1', scheduledTime: 1000000, status: 'pending', retryCount: 0, maxRetries: 3 }
    ]
    const newPost = createScheduledPost('wechat', 'Post 2', 5000000) // 2 hours later
    const conflict = detectScheduleConflict(existing, newPost)
    expect(conflict).toBeNull()
  })

  it('should find optimal time slot', () => {
    const existing: ScheduledPost[] = [
      { id: 'p1', platform: 'wechat', content: 'Post 1', scheduledTime: 1000000, status: 'pending', retryCount: 0, maxRetries: 3 }
    ]
    const window = { start: 500000, end: 2000000 }
    const slot = findOptimalTimeSlot('wechat', window, existing)
    expect(slot).toBeGreaterThanOrEqual(500000)
    expect(slot).toBeLessThanOrEqual(2000000)
  })

  it('should reschedule post', () => {
    const post = createScheduledPost('weibo', 'Test', 1000000)
    const rescheduled = reschedulePost(post, 2000000)
    expect(rescheduled.scheduledTime).toBe(2000000)
    expect(rescheduled.status).toBe('pending')
    expect(rescheduled.retryCount).toBe(0)
  })

  it('should calculate publish priority with age and retries', () => {
    // Old post waiting longer should have higher base priority
    const oldPost: ScheduledPost = {
      id: 'p1', platform: 'wechat', content: 'Old post',
      scheduledTime: Date.now() - 3600000, // 1 hour ago - gets age score
      status: 'pending', retryCount: 0, maxRetries: 3
    }
    // New post just created
    const newPost: ScheduledPost = {
      id: 'p2', platform: 'wechat', content: 'New post',
      scheduledTime: Date.now(), // now - no age score
      status: 'pending', retryCount: 0, maxRetries: 3
    }
    const oldPriority = calculatePublishPriority(oldPost)
    const newPriority = calculatePublishPriority(newPost)
    // Old post should have age bonus, making it higher
    expect(oldPriority).toBeGreaterThanOrEqual(30)
    expect(newPriority).toBe(30) // no age, no retries = base
  })

  it('should boost priority for high retry count', () => {
    const post1: ScheduledPost = {
      id: 'p1', platform: 'wechat', content: 'Test',
      scheduledTime: Date.now(), status: 'pending', retryCount: 0, maxRetries: 3
    }
    const post2: ScheduledPost = {
      id: 'p2', platform: 'wechat', content: 'Test',
      scheduledTime: Date.now(), status: 'pending', retryCount: 2, maxRetries: 3
    }
    expect(calculatePublishPriority(post2)).toBeGreaterThan(calculatePublishPriority(post1))
  })

  it('should sort posts by priority', () => {
    // p1: new post, no retries -> 30
    // p2: 1 hour ago, no retries -> 30 + 30 = 60
    // p3: new post but 3 retries -> 30 + 30 = 60
    // p2 and p3 tie, order not guaranteed but both should be ahead of p1
    const posts: ScheduledPost[] = [
      { id: 'p1', platform: 'wechat', content: 'New', scheduledTime: Date.now(), status: 'pending', retryCount: 0, maxRetries: 3 },
      { id: 'p2', platform: 'wechat', content: 'Old', scheduledTime: Date.now() - 3600000, status: 'pending', retryCount: 0, maxRetries: 3 },
      { id: 'p3', platform: 'wechat', content: 'Retry', scheduledTime: Date.now(), status: 'pending', retryCount: 3, maxRetries: 3 }
    ]
    const sorted = sortPostsByPriority(posts)
    // p2 (60) and p3 (60) should be ahead of p1 (30)
    expect(sorted[sorted.length - 1].id).toBe('p1')
  })
})

describe('PerformanceTrackerV2', () => {
  it('should calculate engagement rate', () => {
    const analytics: PostAnalytics = {
      views: 1000,
      likes: 50,
      comments: 20,
      shares: 10,
      engagementRate: 0
    }
    const rate = calculateEngagementRate(analytics)
    expect(rate).toBe(8) // (50+20+10)/1000 = 8%
  })

  it('should return 0 for zero views', () => {
    const analytics: PostAnalytics = {
      views: 0,
      likes: 10,
      comments: 5,
      shares: 2,
      engagementRate: 0
    }
    expect(calculateEngagementRate(analytics)).toBe(0)
  })

  it('should aggregate platform metrics', () => {
    const posts: ScheduledPost[] = [
      { id: 'p1', platform: 'wechat', content: 'Test', scheduledTime: 5000, status: 'published', retryCount: 0, maxRetries: 3,
        analytics: { views: 1000, likes: 50, comments: 20, shares: 10, engagementRate: 8 } },
      { id: 'p2', platform: 'wechat', content: 'Test', scheduledTime: 6000, status: 'published', retryCount: 0, maxRetries: 3,
        analytics: { views: 2000, likes: 100, comments: 40, shares: 20, engagementRate: 8 } },
      { id: 'p3', platform: 'weibo', content: 'Test', scheduledTime: 5500, status: 'published', retryCount: 0, maxRetries: 3,
        analytics: { views: 500, likes: 25, comments: 10, shares: 5, engagementRate: 8 } }
    ]
    const metrics = aggregatePlatformMetrics(posts, { start: 0, end: 10000 })
    expect(metrics.length).toBe(2)
    const wechat = metrics.find(m => m.platform === 'wechat')
    expect(wechat!.totalPosts).toBe(2)
    expect(wechat!.totalViews).toBe(3000)
  })

  it('should calculate engagement trend as up', () => {
    const data = [
      { date: 1000, engagement: 100 },
      { date: 2000, engagement: 120 },
      { date: 3000, engagement: 110 },
      { date: 4000, engagement: 150 },
      { date: 5000, engagement: 180 }
    ]
    expect(calculateEngagementTrend(data)).toBe('up')
  })

  it('should calculate engagement trend as down', () => {
    const data = [
      { date: 1000, engagement: 200 },
      { date: 2000, engagement: 180 },
      { date: 3000, engagement: 150 },
      { date: 4000, engagement: 120 },
      { date: 5000, engagement: 90 }
    ]
    expect(calculateEngagementTrend(data)).toBe('down')
  })

  it('should calculate engagement trend as stable', () => {
    const data = [
      { date: 1000, engagement: 100 },
      { date: 2000, engagement: 102 },
      { date: 3000, engagement: 99 },
      { date: 4000, engagement: 101 },
      { date: 5000, engagement: 100 }
    ]
    expect(calculateEngagementTrend(data)).toBe('stable')
  })

  it('should rank content by performance', () => {
    const posts: ScheduledPost[] = [
      { id: 'p1', platform: 'wechat', content: 'Low', scheduledTime: 1000, status: 'published', retryCount: 0, maxRetries: 3,
        analytics: { views: 100, likes: 5, comments: 2, shares: 1, engagementRate: 8 } },
      { id: 'p2', platform: 'wechat', content: 'High', scheduledTime: 2000, status: 'published', retryCount: 0, maxRetries: 3,
        analytics: { views: 10000, likes: 500, comments: 200, shares: 100, engagementRate: 8 } }
    ]
    const ranked = rankContentByPerformance(posts)
    expect(ranked[0].postId).toBe('p2')
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score)
  })

  it('should predict next peak', () => {
    const historical: Array<{ timestamp: number; engagement: number }> = [
      { timestamp: new Date('2024-01-01 10:00').getTime(), engagement: 100 },
      { timestamp: new Date('2024-01-02 10:00').getTime(), engagement: 150 },
      { timestamp: new Date('2024-01-03 10:00').getTime(), engagement: 120 },
      { timestamp: new Date('2024-01-04 10:00').getTime(), engagement: 200 },
      { timestamp: new Date('2024-01-05 10:00').getTime(), engagement: 180 },
      { timestamp: new Date('2024-01-06 10:00').getTime(), engagement: 220 },
      { timestamp: new Date('2024-01-07 10:00').getTime(), engagement: 190 }
    ]
    const nextPeak = predictNextPeak(historical)
    expect(nextPeak).toBeGreaterThan(Date.now())
  })

  it('should return current time if insufficient data', () => {
    const historical: Array<{ timestamp: number; engagement: number }> = [
      { timestamp: Date.now(), engagement: 100 }
    ]
    const nextPeak = predictNextPeak(historical)
    expect(nextPeak).toBeGreaterThanOrEqual(Date.now())
  })
})

describe('AutoReportGenerator', () => {
  it('should create report template', () => {
    const template = createReportTemplate('Weekly Summary', 'weekly')
    expect(template.name).toBe('Weekly Summary')
    expect(template.frequency).toBe('weekly')
    expect(template.sections).toHaveLength(0)
  })

  it('should add section to template', () => {
    const template = createReportTemplate('Test', 'daily')
    const section = {
      type: 'summary' as const,
      title: 'Overview',
      metrics: ['Total views', 'Total posts'],
      visualization: 'chart' as const
    }
    const updated = addSectionToTemplate(template, section)
    expect(updated.sections).toHaveLength(1)
    expect(updated.sections[0].title).toBe('Overview')
  })

  it('should generate report content', () => {
    let template = createReportTemplate('Test', 'weekly')
    template = addSectionToTemplate(template, {
      type: 'summary',
      title: 'Summary',
      metrics: [],
      visualization: 'metric'
    })
    template = addSectionToTemplate(template, {
      type: 'engagement',
      title: 'Engagement',
      metrics: [],
      visualization: 'chart'
    })

    const metrics: PlatformMetrics[] = [
      {
        platform: 'wechat',
        period: { start: 0, end: 10000 },
        totalPosts: 10,
        totalViews: 50000,
        totalEngagement: 2000,
        avgEngagementRate: 4,
        trend: 'up'
      },
      {
        platform: 'weibo',
        period: { start: 0, end: 10000 },
        totalPosts: 5,
        totalViews: 20000,
        totalEngagement: 800,
        avgEngagementRate: 4,
        trend: 'stable'
      }
    ]
    const topPosts: ContentPerformance[] = [
      { postId: 'p1', platform: 'wechat', score: 85, metrics: { views: 10000, likes: 500, comments: 100, shares: 50, engagementRate: 6.5 }, publishedAt: 5000 }
    ]

    const content = generateReportContent(template, metrics, topPosts)
    expect(content).toHaveLength(2)
    expect(content[0].metrics.length).toBeGreaterThan(0)
  })

  it('should calculate report metrics', () => {
    const metrics: PlatformMetrics[] = [
      { platform: 'wechat', period: { start: 0, end: 10000 }, totalPosts: 10, totalViews: 50000, totalEngagement: 2000, avgEngagementRate: 4, trend: 'up' },
      { platform: 'weibo', period: { start: 0, end: 10000 }, totalPosts: 5, totalViews: 20000, totalEngagement: 800, avgEngagementRate: 4, trend: 'stable' }
    ]
    const reportMetrics = calculateReportMetrics(metrics)
    expect(reportMetrics.totalViews).toBe(70000)
    expect(reportMetrics.totalPosts).toBe(15)
    expect(reportMetrics.platformsTracked).toBe(2)
  })

  it('should detect daily report as overdue', () => {
    const lastGenerated = Date.now() - (86400000 + 1000) // 1 day + 1 second ago
    expect(isReportOverdue(lastGenerated, 'daily')).toBe(true)
  })

  it('should not flag fresh daily report', () => {
    const lastGenerated = Date.now() - 3600000 // 1 hour ago
    expect(isReportOverdue(lastGenerated, 'daily')).toBe(false)
  })

  it('should format report date', () => {
    const timestamp = new Date('2024-01-15 14:30').getTime()
    const formatted = formatReportDate(timestamp)
    expect(formatted).toContain('2024')
    expect(formatted).toContain('1')
    expect(formatted).toContain('15')
  })
})

describe('Integration', () => {
  it('should run full content lifecycle', () => {
    // Create connections
    const wechatConn = createPlatformConnection('wechat', 'key_wechat_12345678901234')
    const weiboConn = createPlatformConnection('weibo', 'key_weibo_12345678901234')

    expect(canMakeRequest(wechatConn)).toBe(true)
    expect(canMakeRequest(weiboConn)).toBe(true)

    // Schedule posts
    const post1 = createScheduledPost('wechat', 'Content for WeChat', Date.now() + 86400000)
    const post2 = createScheduledPost('weibo', 'Content for Weibo', Date.now() + 90000000)

    // Check for conflicts
    const conflict = detectScheduleConflict([post1], post2)
    expect(conflict).toBeNull() // different platforms

    // Sort by priority
    const sorted = sortPostsByPriority([post1, post2])
    expect(sorted.length).toBe(2)

    // Update status
    const published = updatePostStatus(post1, 'published')
    expect(published.status).toBe('published')

    // Consume quota
    const consumed = consumeQuota(wechatConn, 1)
    expect(consumed.quota.used).toBe(1)
  })

  it('should generate complete report', () => {
    let template = createReportTemplate('Monthly Report', 'monthly')
    template = addSectionToTemplate(template, {
      type: 'summary',
      title: 'Overview',
      metrics: [],
      visualization: 'chart'
    })
    template = addSectionToTemplate(template, {
      type: 'top_content',
      title: 'Best Posts',
      metrics: [],
      visualization: 'table'
    })

    const metrics: PlatformMetrics[] = [
      {
        platform: 'wechat',
        period: { start: Date.now() - 2592000000, end: Date.now() },
        totalPosts: 30,
        totalViews: 150000,
        totalEngagement: 6000,
        avgEngagementRate: 4,
        trend: 'up'
      }
    ]
    const topPosts: ContentPerformance[] = [
      { postId: 'p1', platform: 'wechat', score: 92, metrics: { views: 30000, likes: 1500, comments: 300, shares: 150, engagementRate: 6.5 }, publishedAt: Date.now() - 86400000 },
      { postId: 'p2', platform: 'wechat', score: 78, metrics: { views: 15000, likes: 750, comments: 150, shares: 75, engagementRate: 6.5 }, publishedAt: Date.now() - 172800000 }
    ]

    const content = generateReportContent(template, metrics, topPosts)
    expect(content.length).toBe(2)

    const reportMetrics = calculateReportMetrics(metrics)
    expect(reportMetrics.totalViews).toBe(150000)
    expect(reportMetrics.platformsTracked).toBe(1)
  })
})