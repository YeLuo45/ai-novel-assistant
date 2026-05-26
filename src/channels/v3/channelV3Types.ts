/**
 * Channels V3 Types - V64
 * Types for PlatformAPIManager, ContentSchedulerV3, PerformanceTrackerV2, AutoReportGenerator
 */

// Platform API Manager
export type PlatformStatus = 'active' | 'expired' | 'rate_limited' | 'error'

export interface PlatformConnection {
  platform: string
  apiKey: string
  status: PlatformStatus
  quota: {
    used: number
    limit: number
    resetAt: number
  }
  lastSync: number
}

export interface RateLimitInfo {
  remaining: number
  limit: number
  resetAt: number
  retryAfter?: number
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  rateLimit?: RateLimitInfo
}

// Content Scheduler V3
export type PostStatus = 'pending' | 'scheduled' | 'published' | 'failed' | 'cancelled'

export interface ScheduledPost {
  id: string
  platform: string
  content: string
  title?: string
  scheduledTime: number
  status: PostStatus
  retryCount: number
  maxRetries: number
  analytics?: PostAnalytics
  metadata?: Record<string, unknown>
}

export interface PostAnalytics {
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
  reach?: number
  impressions?: number
}

export interface ScheduleConflict {
  type: 'time' | 'quota' | 'content'
  message: string
  affectedPosts: string[]
  resolution?: string
}

// Performance Tracker V2
export interface PlatformMetrics {
  platform: string
  period: { start: number; end: number }
  totalPosts: number
  totalViews: number
  totalEngagement: number
  avgEngagementRate: number
  topPost?: ScheduledPost
  trend: 'up' | 'down' | 'stable'
}

export interface EngagementStats {
  total: number
  average: number
  byPlatform: Record<string, number>
  trend: number[]  // daily engagement for period
}

export interface ContentPerformance {
  postId: string
  platform: string
  score: number  // 0-100
  metrics: PostAnalytics
  publishedAt: number
}

// Auto Report Generator
export type ReportFrequency = 'daily' | 'weekly' | 'monthly'

export interface ReportTemplate {
  id: string
  name: string
  sections: ReportSection[]
  frequency: ReportFrequency
}

export interface ReportSection {
  type: 'summary' | 'top_content' | 'engagement' | 'growth' | 'comparison'
  title: string
  metrics: string[]
  visualization: 'chart' | 'table' | 'metric' | 'none'
}

export interface GeneratedReport {
  id: string
  template: string
  period: { start: number; end: number }
  content: ReportSection[]
  generatedAt: number
  metrics: Record<string, number>
}

// PlatformAPIManager Functions

export function createPlatformConnection(
  platform: string,
  apiKey: string
): PlatformConnection {
  return {
    platform,
    apiKey,
    status: 'active',
    quota: {
      used: 0,
      limit: 100,
      resetAt: Date.now() + 86400000
    },
    lastSync: Date.now()
  }
}

export function updateConnectionStatus(
  conn: PlatformConnection,
  status: PlatformStatus
): PlatformConnection {
  return { ...conn, status }
}

export function checkRateLimit(conn: PlatformConnection): RateLimitInfo {
  const now = Date.now()
  if (now > conn.quota.resetAt) {
    // Reset quota
    return {
      remaining: conn.quota.limit,
      limit: conn.quota.limit,
      resetAt: now + 86400000
    }
  }
  return {
    remaining: Math.max(0, conn.quota.limit - conn.quota.used),
    limit: conn.quota.limit,
    resetAt: conn.quota.resetAt
  }
}

export function canMakeRequest(conn: PlatformConnection): boolean {
  const rateLimit = checkRateLimit(conn)
  return rateLimit.remaining > 0 && conn.status === 'active'
}

export function consumeQuota(conn: PlatformConnection, count = 1): PlatformConnection {
  return {
    ...conn,
    quota: {
      ...conn.quota,
      used: conn.quota.used + count
    }
  }
}

export function validateAPIKey(apiKey: string): boolean {
  return apiKey.length >= 20 && !apiKey.includes(' ')
}

export function formatPlatformName(platform: string): string {
  const names: Record<string, string> = {
    wechat: 'WeChat Official',
    xiaohongshu: 'XiaoHongShu',
    weibo: 'Weibo',
    zhihu: 'Zhihu',
    qidian: 'Qidian'
  }
  return names[platform.toLowerCase()] || platform
}

// ContentSchedulerV3 Functions

export function createScheduledPost(
  platform: string,
  content: string,
  scheduledTime: number
): ScheduledPost {
  return {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    platform,
    content,
    scheduledTime,
    status: 'pending',
    retryCount: 0,
    maxRetries: 3
  }
}

export function updatePostStatus(
  post: ScheduledPost,
  status: PostStatus
): ScheduledPost {
  return { ...post, status }
}

export function detectScheduleConflict(
  posts: ScheduledPost[],
  newPost: ScheduledPost
): ScheduleConflict | null {
  // Check time conflicts (within 1 hour on same platform)
  const oneHour = 3600000
  const conflicts = posts.filter(p =>
    p.platform === newPost.platform &&
    Math.abs(p.scheduledTime - newPost.scheduledTime) < oneHour &&
    p.status !== 'cancelled' &&
    p.id !== newPost.id
  )

  if (conflicts.length > 0) {
    return {
      type: 'time',
      message: `Schedule conflict: ${conflicts.length} post(s) within 1 hour on ${newPost.platform}`,
      affectedPosts: conflicts.map(c => c.id),
      resolution: 'Consider rescheduling to a different time slot'
    }
  }

  return null
}

export function findOptimalTimeSlot(
  platform: string,
  preferredWindow: { start: number; end: number },
  existingPosts: ScheduledPost[]
): number {
  // Find a time slot not already taken
  const slotDuration = 1800000 // 30 minutes
  let candidate = preferredWindow.start

  for (const post of existingPosts) {
    if (post.platform !== platform) continue
    if (post.scheduledTime < preferredWindow.start || post.scheduledTime > preferredWindow.end) continue

    // Found conflict, move candidate after this post
    if (Math.abs(post.scheduledTime - candidate) < slotDuration) {
      candidate = post.scheduledTime + slotDuration
    }
  }

  // Don't exceed end window
  return Math.min(candidate, preferredWindow.end)
}

export function reschedulePost(
  post: ScheduledPost,
  newTime: number
): ScheduledPost {
  return {
    ...post,
    scheduledTime: newTime,
    status: 'pending',
    retryCount: 0
  }
}

export function calculatePublishPriority(post: ScheduledPost): number {
  // Higher priority for older posts (positive age = waiting in queue)
  // Higher priority for posts with more retries (important/failing)
  const ageMs = Date.now() - post.scheduledTime
  const ageMinutes = Math.max(0, ageMs / 60000)
  const ageScore = Math.min(50, ageMinutes * 0.5) // max 50 points from age
  const retryBoost = post.retryCount * 10 // 10 points per retry

  return Math.min(100, ageScore + retryBoost + 30) // base 30
}

export function sortPostsByPriority(posts: ScheduledPost[]): ScheduledPost[] {
  return [...posts].sort((a, b) => calculatePublishPriority(b) - calculatePublishPriority(a))
}

// PerformanceTrackerV2 Functions

export function calculateEngagementRate(analytics: PostAnalytics): number {
  const total = analytics.likes + analytics.comments + analytics.shares
  if (analytics.views === 0) return 0
  return Math.min(100, (total / analytics.views) * 100)
}

export function aggregatePlatformMetrics(
  posts: ScheduledPost[],
  period: { start: number; end: number }
): PlatformMetrics[] {
  const byPlatform: Record<string, ScheduledPost[]> = {}

  for (const post of posts) {
    if (post.scheduledTime >= period.start && post.scheduledTime <= period.end) {
      if (!byPlatform[post.platform]) byPlatform[post.platform] = []
      byPlatform[post.platform].push(post)
    }
  }

  const results: PlatformMetrics[] = []
  for (const [platform, platformPosts] of Object.entries(byPlatform)) {
    const published = platformPosts.filter(p => p.status === 'published')
    const totalViews = published.reduce((s, p) => s + (p.analytics?.views || 0), 0)
    const totalEngagement = published.reduce((s, p) => {
      if (!p.analytics) return s
      return s + p.analytics.likes + p.analytics.comments + p.analytics.shares
    }, 0)

    const avgEngagement = published.length > 0
      ? totalEngagement / published.length
      : 0

    results.push({
      platform,
      period,
      totalPosts: published.length,
      totalViews,
      totalEngagement,
      avgEngagementRate: avgEngagement,
      trend: totalViews > 0 ? 'up' : 'stable'
    })
  }

  return results
}

export function calculateEngagementTrend(
  dailyData: Array<{ date: number; engagement: number }>
): 'up' | 'down' | 'stable' {
  if (dailyData.length < 2) return 'stable'

  const firstHalf = dailyData.slice(0, Math.floor(dailyData.length / 2))
  const secondHalf = dailyData.slice(Math.floor(dailyData.length / 2))

  const firstAvg = firstHalf.reduce((s, d) => s + d.engagement, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, d) => s + d.engagement, 0) / secondHalf.length

  if (secondAvg > firstAvg * 1.1) return 'up'
  if (secondAvg < firstAvg * 0.9) return 'down'
  return 'stable'
}

export function rankContentByPerformance(posts: ScheduledPost[]): ContentPerformance[] {
  const withAnalytics = posts.filter(p => p.analytics && p.status === 'published')

  const ranked = withAnalytics.map(p => ({
    postId: p.id,
    platform: p.platform,
    score: calculateContentScore(p.analytics!),
    metrics: p.analytics!,
    publishedAt: p.scheduledTime
  }))

  return ranked.sort((a, b) => b.score - a.score)
}

function calculateContentScore(analytics: PostAnalytics): number {
  // Weighted score: engagement rate 40%, views 30%, comments 20%, shares 10%
  const engagementScore = calculateEngagementRate(analytics) * 0.4
  const viewsScore = Math.min(30, (analytics.views / 10000) * 30)
  const commentScore = Math.min(20, analytics.comments * 0.5)
  const shareScore = Math.min(10, analytics.shares * 0.5)

  return engagementScore + viewsScore + commentScore + shareScore
}

export function predictNextPeak(
  historicalData: Array<{ timestamp: number; engagement: number }>
): number {
  if (historicalData.length < 7) return Date.now()

  // Simple prediction: average of top 3 performing time slots
  const sorted = [...historicalData].sort((a, b) => b.engagement - a.engagement)
  const top3 = sorted.slice(0, 3)
  const avgHour = top3.reduce((s, d) => {
    const date = new Date(d.timestamp)
    return s + date.getHours()
  }, 0) / 3

  const nextPeak = new Date()
  nextPeak.setHours(Math.round(avgHour), 0, 0, 0)

  // If that's in the past, move to tomorrow
  if (nextPeak.getTime() < Date.now()) {
    nextPeak.setDate(nextPeak.getDate() + 1)
  }

  return nextPeak.getTime()
}

// AutoReportGenerator Functions

export function createReportTemplate(
  name: string,
  frequency: ReportFrequency
): ReportTemplate {
  return {
    id: `template_${Date.now()}`,
    name,
    frequency,
    sections: []
  }
}

export function addSectionToTemplate(
  template: ReportTemplate,
  section: ReportSection
): ReportTemplate {
  return {
    ...template,
    sections: [...template.sections, section]
  }
}

export function generateReportContent(
  template: ReportTemplate,
  metrics: PlatformMetrics[],
  topPosts: ContentPerformance[]
): ReportSection[] {
  return template.sections.map(section => {
    switch (section.type) {
      case 'summary':
        return {
          ...section,
          title: `Summary Report (${metrics.length} platforms)`,
          metrics: [
            `Total Posts: ${metrics.reduce((s, m) => s + m.totalPosts, 0)}`,
            `Total Views: ${metrics.reduce((s, m) => s + m.totalViews, 0)}`,
            `Avg Engagement: ${(metrics.reduce((s, m) => s + m.avgEngagementRate, 0) / metrics.length).toFixed(1)}%`
          ]
        }
      case 'top_content':
        return {
          ...section,
          title: 'Top Performing Content',
          metrics: topPosts.slice(0, 5).map(p =>
            `Post ${p.postId} on ${p.platform}: Score ${p.score.toFixed(0)}`
          )
        }
      case 'engagement':
        return {
          ...section,
          title: 'Engagement by Platform',
          metrics: metrics.map(m =>
            `${m.platform}: ${m.avgEngagementRate.toFixed(1)}% (${m.totalPosts} posts)`
          )
        }
      default:
        return section
    }
  })
}

export function calculateReportMetrics(
  metrics: PlatformMetrics[]
): Record<string, number> {
  const totalViews = metrics.reduce((s, m) => s + m.totalViews, 0)
  const totalEngagement = metrics.reduce((s, m) => s + m.totalEngagement, 0)
  const totalPosts = metrics.reduce((s, m) => s + m.totalPosts, 0)
  const avgEngagement = metrics.length > 0
    ? metrics.reduce((s, m) => s + m.avgEngagementRate, 0) / metrics.length
    : 0

  return {
    totalViews,
    totalEngagement,
    totalPosts,
    avgEngagementRate: avgEngagement,
    platformsTracked: metrics.length
  }
}

export function isReportOverdue(
  lastGenerated: number,
  frequency: ReportFrequency
): boolean {
  const now = Date.now()
  const intervals: Record<ReportFrequency, number> = {
    daily: 86400000,
    weekly: 604800000,
    monthly: 2592000000
  }

  return now - lastGenerated > intervals[frequency]
}

export function formatReportDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}