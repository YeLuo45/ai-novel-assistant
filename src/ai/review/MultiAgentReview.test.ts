/**
 * MultiAgentReview Test - V40
 */

import { describe, it, expect } from 'vitest'
import { 
  multiAgentReview, 
  aggregateReviews, 
  onReviewComplete,
  type Chapter,
  type ReviewResult,
  type AggregatedReview 
} from './MultiAgentReview'
import { SelfEvolutionEngine } from '../evolution/SelfEvolutionEngine'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('MultiAgentReview', () => {
  describe('multiAgentReview', () => {
    it('should run all four reviewers in parallel', async () => {
      const chapter: Chapter = {
        id: 1,
        title: '第一章：开始',
        content: `
          这是一个测试章节。主角张三走在街上，他遇到了一个冲突。
          "你必须做出选择！"李四大声说道。
          因为他没有准备好，所以结果并不理想。
        `,
        wordCount: 50
      }

      const result = await multiAgentReview(chapter)

      expect(result.chapterId).toBe(1)
      expect(result.reviewerCount).toBe(4)
      expect(result.results.length).toBe(4)
      expect(result.results.map(r => r.reviewer)).toEqual(['策划', '文笔', '逻辑', '节奏'])
    })

    it('should calculate overall score as average', async () => {
      const chapter: Chapter = {
        id: 2,
        title: '测试章节',
        content: '这是一个测试。'.repeat(20),
        wordCount: 200
      }

      const result = await multiAgentReview(chapter)

      const expectedAvg = Math.round(
        result.results.reduce((sum, r) => sum + r.score, 0) / 4
      )
      expect(result.overallScore).toBe(expectedAvg)
    })

    it('should collect issues from all reviewers', async () => {
      const chapter: Chapter = {
        id: 3,
        title: '问题章节',
        content: '因为所以但是然而' + '测试内容。'.repeat(100),
        wordCount: 500
      }

      const result = await multiAgentReview(chapter)

      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues.some(i => i.type === 'logic' || i.type === 'prose')).toBe(true)
    })
  })

  describe('aggregateReviews', () => {
    it('should aggregate multiple review results', () => {
      const results: ReviewResult[] = [
        {
          reviewer: '策划',
          specialty: '剧情架构',
          score: 80,
          issues: [{ type: 'plot', severity: 'minor', description: 'test' }],
          suggestions: ['suggestion 1'],
          overallComment: 'good',
          reviewedAt: Date.now()
        },
        {
          reviewer: '文笔',
          specialty: '语言表达',
          score: 90,
          issues: [],
          suggestions: [],
          overallComment: 'excellent',
          reviewedAt: Date.now()
        }
      ]

      const aggregated = aggregateReviews(1, results)

      expect(aggregated.chapterId).toBe(1)
      expect(aggregated.overallScore).toBe(85) // (80+90)/2
      expect(aggregated.reviewerCount).toBe(2)
      expect(aggregated.issues.length).toBe(1)
    })
  })

  describe('Reviewer Specialties', () => {
    it('策划 should detect missing conflict', async () => {
      const chapter: Chapter = {
        id: 10,
        title: '无冲突章节',
        content: '今天天气很好。主角在家吃饭。很平静的一天。',
        wordCount: 30
      }

      const result = await multiAgentReview(chapter)
      const plotResult = result.results.find(r => r.reviewer === '策划')
      
      expect(plotResult?.issues.some(i => i.description.includes('冲突'))).toBe(true)
    })

    it('文笔 should detect repeated words', async () => {
      const chapter: Chapter = {
        id: 11,
        title: '重复用词章节',
        content: '测试测试测试测试测试测试测试测试测试测试',
        wordCount: 20
      }

      const result = await multiAgentReview(chapter)
      const proseResult = result.results.find(r => r.reviewer === '文笔')
      
      expect(proseResult?.issues.length).toBeGreaterThan(0)
    })

    it('逻辑 should detect missing因果关系', async () => {
      const chapter: Chapter = {
        id: 12,
        title: '因果缺失章节',
        content: '因为今天下雨。因为地面湿了。',
        wordCount: 20
      }

      const result = await multiAgentReview(chapter)
      const logicResult = result.results.find(r => r.reviewer === '逻辑')
      
      expect(logicResult?.suggestions.some(s => s.includes('因果'))).toBe(true)
    })

    it('节奏 should detect inappropriate length', async () => {
      const chapter: Chapter = {
        id: 13,
        title: '短章节',
        content: '短',
        wordCount: 1
      }

      const result = await multiAgentReview(chapter)
      const pacingResult = result.results.find(r => r.reviewer === '节奏')
      
      expect(pacingResult?.issues.some(i => i.description.includes('字数较少'))).toBe(true)
    })
  })

  describe('onReviewComplete', () => {
    it('should crystallize high-scoring review as lesson', async () => {
      localStorageMock.clear()
      const engine = new SelfEvolutionEngine(1)

      const review: AggregatedReview = {
        chapterId: 1,
        overallScore: 90,
        reviewerCount: 4,
        results: [
          {
            reviewer: '策划',
            specialty: '剧情架构',
            score: 90,
            issues: [],
            suggestions: ['建议1', '建议2'],
            overallComment: 'good',
            reviewedAt: Date.now()
          },
          {
            reviewer: '文笔',
            specialty: '语言表达',
            score: 90,
            issues: [],
            suggestions: ['建议3'],
            overallComment: 'good',
            reviewedAt: Date.now()
          },
          {
            reviewer: '逻辑',
            specialty: '前后一致',
            score: 90,
            issues: [],
            suggestions: [],
            overallComment: 'good',
            reviewedAt: Date.now()
          },
          {
            reviewer: '节奏',
            specialty: '阅读体验',
            score: 90,
            issues: [],
            suggestions: [],
            overallComment: 'good',
            reviewedAt: Date.now()
          }
        ],
        issues: [],
        summary: '优秀',
        reviewedAt: Date.now()
      }

      const lesson = await onReviewComplete(1, review, engine)

      expect(lesson).not.toBeNull()
      expect(lesson?.task).toBe('review_1')
      expect(lesson?.outcome).toBe('success')
      expect(lesson?.context.score).toBe(0.9)
    })

    it('should not crystallize low-scoring review', async () => {
      localStorageMock.clear()
      const engine = new SelfEvolutionEngine(1)

      const review: AggregatedReview = {
        chapterId: 2,
        overallScore: 70, // Below 85 threshold
        reviewerCount: 4,
        results: [],
        issues: [],
        summary: '一般',
        reviewedAt: Date.now()
      }

      const lesson = await onReviewComplete(1, review, engine)

      expect(lesson).toBeNull()
    })
  })
})