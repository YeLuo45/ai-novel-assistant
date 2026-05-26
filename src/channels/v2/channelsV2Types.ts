/**
 * Channels V2 Types - V59
 * Types for PlatformAnalyzer, ContentAdapterV2, PublishingScheduler, PerformanceTracker
 */

export interface ContentRules {
  titleMaxLength: number
  bodyMaxLength: number
  minWordCount: number
  maxWordCount: number
  allowImages: boolean
  allowLinks: boolean
  requiresImage: boolean
}

export interface TimeSlot {
  dayOfWeek: number  // 0-6, 0 = Sunday
  hour: number       // 0-23
  minute: number     // 0-59
  duration: number   // minutes
  score: number      // 0-1, traffic quality score
}

export interface PlatformProfile {
  id: string
  name: string
  icon: string
  contentRules: ContentRules
  trafficPeak: TimeSlot[]
  bestPostLength: { min: number; max: number }
  imageRequired: boolean
  characterLimit: number
  averageEngagementRate: number
  audienceAgeRange: { min: number; max: number }
}

export interface ContentVersion {
  id: string
  platformId: string
  title: string
  body: string
  summary: string
  tags: string[]
  scheduledAt?: number
  publishedAt?: number
  status: 'draft' | 'scheduled' | 'published'
  views?: number
  engagement?: number
}

export interface PublishingCampaign {
  id: string
  title: string
  originalContentId: string
  versions: ContentVersion[]
  totalPublished: number
  totalViews: number
  totalEngagement: number
  createdAt: number
}

export interface PublishingResult {
  campaignId: string
  results: { platformId: string; success: boolean; url?: string; error?: string }[]
}

export interface PerformanceMetrics {
  platformId: string
  period: { start: number; end: number }
  totalPosts: number
  totalViews: number
  averageViews: number
  totalEngagement: number
  engagementRate: number
  topPerformingPost?: { title: string; views: number }
}

export interface AdapterOptions {
  platformId: string
  optimizeForEngagement?: boolean
  respectLengthLimits?: boolean
}

/**
 * Platform profiles with real-world data
 */
export const PLATFORM_PROFILES: Record<string, PlatformProfile> = {
  wechat: {
    id: 'wechat',
    name: '微信公众号',
    icon: '📱',
    contentRules: {
      titleMaxLength: 64,
      bodyMaxLength: 20000,
      minWordCount: 300,
      maxWordCount: 20000,
      allowImages: true,
      allowLinks: true,
      requiresImage: true
    },
    trafficPeak: [
      { dayOfWeek: 1, hour: 12, minute: 0, duration: 60, score: 0.8 },
      { dayOfWeek: 3, hour: 20, minute: 0, duration: 60, score: 0.9 },
      { dayOfWeek: 5, hour: 12, minute: 0, duration: 60, score: 0.7 },
      { dayOfWeek: 6, hour: 21, minute: 0, duration: 60, score: 0.85 }
    ],
    bestPostLength: { min: 1000, max: 5000 },
    imageRequired: true,
    characterLimit: 20000,
    averageEngagementRate: 0.05,
    audienceAgeRange: { min: 25, max: 45 }
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书',
    icon: '📕',
    contentRules: {
      titleMaxLength: 20,
      bodyMaxLength: 1000,
      minWordCount: 50,
      maxWordCount: 1000,
      allowImages: true,
      allowLinks: false,
      requiresImage: true
    },
    trafficPeak: [
      { dayOfWeek: 6, hour: 10, minute: 0, duration: 120, score: 0.95 },
      { dayOfWeek: 7, hour: 10, minute: 0, duration: 120, score: 0.9 },
      { dayOfWeek: 1, hour: 20, minute: 0, duration: 60, score: 0.7 }
    ],
    bestPostLength: { min: 200, max: 600 },
    imageRequired: true,
    characterLimit: 1000,
    averageEngagementRate: 0.08,
    audienceAgeRange: { min: 18, max: 35 }
  },
  weibo: {
    id: 'weibo',
    name: '微博',
    icon: '🌐',
    contentRules: {
      titleMaxLength: 0,
      bodyMaxLength: 2000,
      minWordCount: 50,
      maxWordCount: 2000,
      allowImages: true,
      allowLinks: true,
      requiresImage: false
    },
    trafficPeak: [
      { dayOfWeek: 1, hour: 9, minute: 0, duration: 30, score: 0.8 },
      { dayOfWeek: 3, hour: 12, minute: 0, duration: 30, score: 0.75 },
      { dayOfWeek: 5, hour: 18, minute: 0, duration: 60, score: 0.9 }
    ],
    bestPostLength: { min: 100, max: 500 },
    imageRequired: false,
    characterLimit: 2000,
    averageEngagementRate: 0.03,
    audienceAgeRange: { min: 18, max: 40 }
  },
  zhihu: {
    id: 'zhihu',
    name: '知乎',
    icon: '💡',
    contentRules: {
      titleMaxLength: 100,
      bodyMaxLength: 10000,
      minWordCount: 500,
      maxWordCount: 10000,
      allowImages: true,
      allowLinks: true,
      requiresImage: false
    },
    trafficPeak: [
      { dayOfWeek: 2, hour: 14, minute: 0, duration: 60, score: 0.85 },
      { dayOfWeek: 4, hour: 20, minute: 0, duration: 60, score: 0.9 },
      { dayOfWeek: 6, hour: 15, minute: 0, duration: 60, score: 0.75 }
    ],
    bestPostLength: { min: 1000, max: 4000 },
    imageRequired: false,
    characterLimit: 10000,
    averageEngagementRate: 0.04,
    audienceAgeRange: { min: 22, max: 40 }
  },
  qidian: {
    id: 'qidian',
    name: '起点中文网',
    icon: '📖',
    contentRules: {
      titleMaxLength: 30,
      bodyMaxLength: 10000,
      minWordCount: 2000,
      maxWordCount: 10000,
      allowImages: false,
      allowLinks: false,
      requiresImage: false
    },
    trafficPeak: [
      { dayOfWeek: 1, hour: 18, minute: 0, duration: 120, score: 0.9 },
      { dayOfWeek: 3, hour: 12, minute: 0, duration: 60, score: 0.7 },
      { dayOfWeek: 5, hour: 20, minute: 0, duration: 120, score: 0.95 }
    ],
    bestPostLength: { min: 3000, max: 8000 },
    imageRequired: false,
    characterLimit: 10000,
    averageEngagementRate: 0.02,
    audienceAgeRange: { min: 16, max: 35 }
  }
}

/**
 * Get the next best time slot for publishing on a platform
 */
export function getNextBestSlot(platformId: string, fromTime: number = Date.now()): TimeSlot | null {
  const profile = PLATFORM_PROFILES[platformId]
  if (!profile) return null

  const slots = [...profile.trafficPeak].sort((a, b) => a.score - b.score)
  const target = slots[slots.length - 1]

  const now = new Date(fromTime)
  const targetDate = new Date(fromTime)

  // Find next occurrence of target time slot
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
    if (checkDate.getDay() === target.dayOfWeek) {
      targetDate.setHours(target.hour, target.minute, 0, 0)
      if (targetDate.getTime() > now.getTime()) {
        return { ...target, dayOfWeek: checkDate.getDay() }
      }
    }
  }

  return target
}

/**
 * Calculate optimal post length for a platform
 */
export function calculateOptimalLength(platformId: string, content: string): { min: number; max: number } {
  const profile = PLATFORM_PROFILES[platformId]
  if (!profile) return { min: 100, max: 1000 }

  const wordCount = content.split(/\s+/).length

  // If content is shorter than ideal, use actual length range
  if (wordCount < profile.bestPostLength.min) {
    return { min: wordCount, max: wordCount + 200 }
  }

  // If content is longer, suggest optimal segment length
  return profile.bestPostLength
}

/**
 * Truncate content to platform limits
 */
export function truncateToLimit(content: string, maxLength: number, addEllipsis = true): string {
  if (content.length <= maxLength) return content
  const truncated = content.slice(0, maxLength - 3)
  return addEllipsis ? truncated + '...' : truncated
}

/**
 * Split long content into platform-appropriate segments
 */
export function splitContentForPlatform(content: string, platformId: string): string[] {
  const profile = PLATFORM_PROFILES[platformId]
  if (!profile) return [content]

  const maxLength = profile.contentRules.bodyMaxLength
  if (content.length <= maxLength) return [content]

  const segments: string[] = []
  let remaining = content

  while (remaining.length > 0) {
    let cutPoint = Math.min(maxLength, remaining.length)

    // Try to cut at sentence boundary
    if (remaining.length > maxLength) {
      const sentenceEnd = remaining.slice(0, cutPoint).lastIndexOf('。')
      const paraEnd = remaining.slice(0, cutPoint).lastIndexOf('\n')
      const commaEnd = remaining.slice(0, cutPoint).lastIndexOf('，')

      const bestEnd = Math.max(sentenceEnd, paraEnd, commaEnd)
      if (bestEnd > cutPoint * 0.7) {
        cutPoint = bestEnd + 1
      }
    }

    segments.push(remaining.slice(0, cutPoint))
    remaining = remaining.slice(cutPoint)
  }

  return segments
}

/**
 * Calculate engagement prediction based on content and platform
 */
export function predictEngagement(content: string, platformId: string): number {
  const profile = PLATFORM_PROFILES[platformId]
  if (!profile) return 0

  const wordCount = content.split(/\s+/).length
  const inIdealRange = wordCount >= profile.bestPostLength.min && wordCount <= profile.bestPostLength.max
  const lengthScore = inIdealRange ? 1 : wordCount < profile.bestPostLength.min ? 0.7 : 0.85

  // Base engagement rate adjusted by content quality factors
  let contentScore = 0.5
  if (content.length > 100) contentScore += 0.2
  if (content.includes('？') || content.includes('!')) contentScore += 0.1
  if (content.includes('\n')) contentScore += 0.1

  return Math.min(1, profile.averageEngagementRate * lengthScore * contentScore)
}

/**
 * Generate platform-specific tags
 */
export function generatePlatformTags(originalTags: string[], platformId: string): string[] {
  const platformKeywordMap: Record<string, string[]> = {
    wechat: ['公众号', '文章', '阅读'],
    xiaohongshu: ['小红书', '种草', '分享'],
    weibo: ['微博', '热门', '转发'],
    zhihu: ['知乎', '问答', '知识'],
    qidian: ['小说', '起点', '原创']
  }

  const platformKeywords = platformKeywordMap[platformId] || []
  const combinedArr = [...originalTags, ...platformKeywords]
  const seen = new Set<string>()
  const unique: string[] = []
  for (const tag of combinedArr) {
    if (!seen.has(tag)) {
      seen.add(tag)
      unique.push(tag)
    }
  }
  return unique.slice(0, 5)
}

/**
 * Calculate overall campaign performance
 */
export function calculateCampaignROI(campaign: PublishingCampaign): {
  totalReach: number
  engagementRate: number
  avgViewsPerPlatform: number
  bestPlatform: string
} {
  const platforms = campaign.versions.filter(v => v.status === 'published')

  if (platforms.length === 0) {
    return { totalReach: 0, engagementRate: 0, avgViewsPerPlatform: 0, bestPlatform: '' }
  }

  const totalReach = platforms.reduce((sum, v) => sum + (v.views || 0), 0)
  const totalEngagement = platforms.reduce((sum, v) => sum + (v.engagement || 0), 0)
  const engagementRate = totalReach > 0 ? totalEngagement / totalReach : 0
  const avgViewsPerPlatform = totalReach / platforms.length

  let bestPlatform = ''
  let maxViews = 0
  for (const v of platforms) {
    if ((v.views || 0) > maxViews) {
      maxViews = v.views || 0
      bestPlatform = v.platformId
    }
  }

  return {
    totalReach,
    engagementRate: Math.round(engagementRate * 100) / 100,
    avgViewsPerPlatform: Math.round(avgViewsPerPlatform),
    bestPlatform
  }
}