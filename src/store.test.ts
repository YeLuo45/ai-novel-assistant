import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Use vi.hoisted to ensure mocks are ready before any module loads
const { mockAdd, mockToArray, mockWhere, mockUpdate, mockDelete, DexieMock } = vi.hoisted(() => {
  const mockAdd = vi.fn().mockResolvedValue(1)
  const mockToArray = vi.fn().mockResolvedValue([])
  const mockUpdate = vi.fn().mockResolvedValue(undefined)
  const mockDelete = vi.fn().mockResolvedValue(undefined)
  const mockSortBy = vi.fn().mockResolvedValue([])

  const mockWhere = vi.fn().mockReturnValue({
    equals: vi.fn().mockReturnValue({
      toArray: mockToArray,
      modify: vi.fn().mockResolvedValue(undefined),
      sortBy: mockSortBy,
      delete: mockDelete
    })
  })

  // Create a proper Dexie mock that supports chaining
  class DexieMock {
    static called = false
    constructor() {
      if (!DexieMock.called) {
        DexieMock.called = true
      }
    }
    version = vi.fn().mockReturnThis()
    stores = vi.fn().mockReturnThis()
    projects = { add: mockAdd, toArray: mockToArray, update: mockUpdate, delete: mockDelete, where: mockWhere }
    outlineNodes = { add: mockAdd, toArray: mockToArray, sortBy: mockSortBy, update: mockUpdate, delete: mockDelete, where: mockWhere }
    materialCards = { add: mockAdd, toArray: mockToArray, update: mockUpdate, delete: mockDelete, where: mockWhere }
    projectVersions = { add: mockAdd, toArray: mockToArray, update: mockUpdate, where: mockWhere }
    agentConfigs = { toArray: mockToArray, where: mockWhere }
    writingStats = { toArray: mockToArray, where: mockWhere }
    storylines = { toArray: mockToArray, where: mockWhere }
    chapterStorylineLinks = { toArray: mockToArray, where: mockWhere, delete: mockDelete }
    characterRelationships = { toArray: mockToArray, where: mockWhere }
    milestones = { toArray: mockToArray, where: mockWhere }
    reminderSettings = { toArray: mockToArray, where: mockWhere }
  }

  return { mockAdd, mockToArray, mockWhere, mockUpdate, mockDelete, DexieMock }
})

// Mock Dexie
vi.mock('dexie', () => {
  return {
    __esModule: true,
    default: DexieMock
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
vi.stubGlobal('localStorage', localStorageMock)

// Import store AFTER mocks are set up
import { useStore } from './store'

describe('store.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DexieMock.called = false
  })

  describe('theme management', () => {
    it('should have default theme as system', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.theme).toBe('system')
    })

    it('should set theme', () => {
      const { result } = renderHook(() => useStore())
      act(() => {
        result.current.setTheme('dark')
      })
      expect(result.current.theme).toBe('dark')
    })

    it('should set theme to light', () => {
      const { result } = renderHook(() => useStore())
      act(() => {
        result.current.setTheme('light')
      })
      expect(result.current.theme).toBe('light')
    })
  })

  describe('editor state', () => {
    it('should manage currentNodeId', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.currentNodeId).toBeNull()

      act(() => {
        result.current.setCurrentNodeId(42)
      })
      expect(result.current.currentNodeId).toBe(42)

      act(() => {
        result.current.setCurrentNodeId(null)
      })
      expect(result.current.currentNodeId).toBeNull()
    })

    it('should manage isFullscreen', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.isFullscreen).toBe(false)

      act(() => {
        result.current.setIsFullscreen(true)
      })
      expect(result.current.isFullscreen).toBe(true)
    })
  })

  describe('daily goal management', () => {
    it('should have default daily goal', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.dailyGoal).toBe(3000)
    })

    it('should set daily goal', () => {
      const { result } = renderHook(() => useStore())
      act(() => {
        result.current.setDailyGoal(5000)
      })
      expect(result.current.dailyGoal).toBe(5000)
    })

    it('should have default total word goal', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.totalWordGoal).toBe(100000)
    })

    it('should set total word goal', () => {
      const { result } = renderHook(() => useStore())
      act(() => {
        result.current.setTotalWordGoal(200000)
      })
      expect(result.current.totalWordGoal).toBe(200000)
    })
  })

  describe('todayWordCount and streak', () => {
    it('should initialize with zero todayWordCount', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.todayWordCount).toBe(0)
    })

    it('should initialize with zero streak', () => {
      const { result } = renderHook(() => useStore())
      expect(result.current.streak).toBe(0)
    })
  })

  describe('updateLastBackupTime', () => {
    it('should update lastBackupTime in state and localStorage', () => {
      const { result } = renderHook(() => useStore())
      act(() => {
        result.current.updateLastBackupTime()
      })
      expect(localStorageMock.setItem).toHaveBeenCalled()
      expect(result.current.lastBackupTime).not.toBeNull()
    })
  })
})
