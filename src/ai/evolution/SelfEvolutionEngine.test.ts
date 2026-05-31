/**
 * SelfEvolutionEngine Test - V40
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SelfEvolutionEngine, type Lesson, type PromptVersion } from './SelfEvolutionEngine'

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

describe('SelfEvolutionEngine', () => {
  let engine: SelfEvolutionEngine

  beforeEach(() => {
    localStorageMock.clear()
    engine = new SelfEvolutionEngine(1)
  })

  describe('recordLesson', () => {
    it('should record a lesson with generated id and timestamp', async () => {
      const lessonData = {
        task: 'review_chapter_1',
        approach: '增强对话描写',
        outcome: 'success' as const,
        context: { score: 0.9, chapterId: 1 }
      }

      const lesson = await engine.recordLesson(lessonData)

      expect(lesson.id).toMatch(/^lesson_/)
      expect(lesson.task).toBe('review_chapter_1')
      expect(lesson.approach).toBe('增强对话描写')
      expect(lesson.outcome).toBe('success')
      expect(lesson.context.score).toBe(0.9)
      expect(lesson.createdAt).toBeGreaterThan(0)
    })
  })

  describe('analyzeSuccessPatterns', () => {
    it('should return empty array when no successful lessons exist', async () => {
      const insights = await engine.analyzeSuccessPatterns()
      expect(insights).toEqual([])
    })

    it('should generate insights from successful lessons', async () => {
      // Add some successful lessons
      await engine.recordLesson({
        task: 'review_chapter_1',
        approach: '增强对话描写',
        outcome: 'success',
        context: { score: 0.9 }
      })
      await engine.recordLesson({
        task: 'review_chapter_2',
        approach: '增加场景细节',
        outcome: 'success',
        context: { score: 0.85 }
      })

      const insights = await engine.analyzeSuccessPatterns()
      expect(insights.length).toBeGreaterThan(0)
      expect(insights[0].type).toBe('improvement')
      expect(insights[0].confidence).toBeGreaterThan(0)
    })

    it('should not generate insights from low-scoring lessons', async () => {
      await engine.recordLesson({
        task: 'review_chapter_1',
        approach: 'some approach',
        outcome: 'failure',
        context: { score: 0.3 }
      })

      const insights = await engine.analyzeSuccessPatterns()
      expect(insights).toEqual([])
    })
  })

  describe('generateImprovedPrompt', () => {
    it('should generate a new prompt version', async () => {
      const lesson = await engine.recordLesson({
        task: 'review_chapter_1',
        approach: '增强对话描写',
        outcome: 'success',
        context: { score: 0.9 }
      })

      const version = await engine.generateImprovedPrompt(lesson)

      expect(version.id).toMatch(/^prompt_/)
      expect(version.version).toBe(1)
      expect(version.performanceScore).toBe(0.9)
      expect(version.useCount).toBe(0)
      expect(version.createdFromLesson).toBe(lesson.id)
    })

    it('should increment version number on each generation', async () => {
      const lesson1 = await engine.recordLesson({
        task: 'review_chapter_1',
        approach: 'approach 1',
        outcome: 'success',
        context: { score: 0.8 }
      })
      const lesson2 = await engine.recordLesson({
        task: 'review_chapter_2',
        approach: 'approach 2',
        outcome: 'success',
        context: { score: 0.85 }
      })

      const v1 = await engine.generateImprovedPrompt(lesson1)
      const v2 = await engine.generateImprovedPrompt(lesson2)

      expect(v1.version).toBe(1)
      expect(v2.version).toBe(2)
    })
  })

  describe('applyEvolution', () => {
    it('should apply an insight to create new version', async () => {
      const insight = {
        id: 'insight_1',
        type: 'improvement' as const,
        description: '在对话场景中增加更多情感描写',
        sourceLessons: [],
        confidence: 85,
        createdAt: Date.now()
      }

      const version = await engine.applyEvolution(insight)

      expect(version.id).toMatch(/^prompt_/)
      expect(version.version).toBe(1)
      expect(version.insight).toContain('改进建议')
    })
  })

  describe('rollbackToVersion', () => {
    it('should rollback to a previous version', async () => {
      const lesson = await engine.recordLesson({
        task: 'review_chapter_1',
        approach: 'enhancement',
        outcome: 'success',
        context: { score: 0.9 }
      })

      const v1 = await engine.generateImprovedPrompt(lesson)
      const rollback = await engine.rollbackToVersion(v1.id)

      expect(rollback).not.toBeNull()
      expect(rollback!.version).toBe(2) // New version created
      expect(rollback!.insight).toContain('回滚')
    })

    it('should return null for non-existent version', async () => {
      const rollback = await engine.rollbackToVersion('nonexistent')
      expect(rollback).toBeNull()
    })
  })

  describe('getVersions / getInsights / getLessons', () => {
    it('should return all recorded items', async () => {
      await engine.recordLesson({
        task: 'test_task',
        approach: 'test approach',
        outcome: 'success',
        context: { score: 0.8 }
      })

      const lessons = engine.getLessons()
      expect(lessons.length).toBe(1)

      const insights = await engine.analyzeSuccessPatterns()
      expect(insights.length).toBeGreaterThan(0)

      const versions = engine.getVersions()
      expect(versions.length).toBe(0) // No versions yet
    })
  })

  describe('getCurrentPrompt', () => {
    it('should return default prompt when no versions exist', () => {
      const prompt = engine.getCurrentPrompt()
      expect(prompt).toContain('小说写作助手')
    })

    it('should return latest improved prompt', async () => {
      const lesson = await engine.recordLesson({
        task: 'test',
        approach: 'enhancement',
        outcome: 'success',
        context: { score: 0.9 }
      })

      await engine.generateImprovedPrompt(lesson)
      const prompt = engine.getCurrentPrompt()
      expect(prompt).toBeDefined()
      expect(prompt.length).toBeGreaterThan(0)
    })
  })

  describe('incrementUseCount', () => {
    it('should increment use count', async () => {
      const lesson = await engine.recordLesson({
        task: 'test',
        approach: 'test',
        outcome: 'success',
        context: { score: 0.9 }
      })

      const version = await engine.generateImprovedPrompt(lesson)
      expect(version.useCount).toBe(0)

      engine.incrementUseCount(version.id)
      const updated = engine.getVersions().find(v => v.id === version.id)
      expect(updated?.useCount).toBe(1)
    })
  })

  describe('onLessonCrystallized', () => {
    it('should trigger evolution for high-scoring success lessons', async () => {
      const lesson: Omit<Lesson, 'id' | 'createdAt'> = {
        task: 'review_1',
        approach: 'successful approach',
        outcome: 'success',
        context: { score: 0.85 }
      }

      const result = await SelfEvolutionEngine.onLessonCrystallized(1, {
        ...lesson,
        id: 'test_id',
        createdAt: Date.now()
      })

      expect(result).not.toBeNull()
      expect(result?.version).toBe(1)
    })

    it('should not trigger evolution for low-scoring lessons', async () => {
      const lesson: Omit<Lesson, 'id' | 'createdAt'> = {
        task: 'review_1',
        approach: 'failing approach',
        outcome: 'failure',
        context: { score: 0.5 }
      }

      const result = await SelfEvolutionEngine.onLessonCrystallized(1, {
        ...lesson,
        id: 'test_id',
        createdAt: Date.now()
      })

      expect(result).toBeNull()
    })
  })
})