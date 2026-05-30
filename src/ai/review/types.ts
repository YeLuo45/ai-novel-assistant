/**
 * Multi-Agent Review 类型定义
 */

export interface Chapter {
  id: string
  title: string
  content: string
  metadata?: Record<string, unknown>
}

export interface ReviewResult {
  reviewer: string
  score: number
  issues: string[]
  suggestions: string[]
  overallComment: string
}

export interface Reviewer {
  name: string
  specialty: string
  weight: number
}

export interface AggregatedReview {
  chapterId: string
  overallScore: number
  reviewerCount: number
  reviewerResults: ReviewResult[]
  allIssues: string[]
  prioritizedSuggestions: string[]
  overallComment: string
  createdAt: number
}