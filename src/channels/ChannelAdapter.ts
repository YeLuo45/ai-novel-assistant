/**
 * Channel Adapter Interface - V54
 * Unified interface for multi-platform content publishing
 */

export interface PublishOptions {
  title?: string
  tags?: string[]
  summary?: string
  coverImage?: string
  draft?: boolean
  schedule?: number  // Unix timestamp
}

export interface PublishResult {
  success: boolean
  url?: string
  error?: string
  publishedAt?: number
  platformPostId?: string
}

export interface ChannelStatus {
  connected: boolean
  lastPublishAt?: number
  totalPublished: number
  errorMessage?: string
}

export interface ChannelConfig {
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  accountId?: string
  enabled: boolean
}

export interface ChapterContent {
  title: string
  content: string
  author: string
  chapterNumber?: number
  wordCount?: number
  summary?: string
  tags?: string[]
  sourceUrl?: string
}

/**
 * Base interface for all channel adapters
 */
export interface ChannelAdapter {
  /** Unique identifier for this adapter */
  id: string

  /** Display name for the platform */
  name: string

  /** Platform icon/emoji */
  icon: string

  /** Publish content to this channel */
  publish(content: ChapterContent, options: PublishOptions): Promise<PublishResult>

  /** Validate that channel configuration is complete */
  validateConfig(): Promise<boolean>

  /** Get current channel status */
  getStatus(): ChannelStatus

  /** Get platform-specific content format */
  formatContent(content: ChapterContent, options: PublishOptions): FormattedContent
}

export interface FormattedContent {
  title: string
  body: string
  excerpt?: string
  tags: string[]
  customFields?: Record<string, unknown>
}