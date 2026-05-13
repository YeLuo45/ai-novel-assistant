import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db, Project, OutlineNode, MaterialCard, ProjectVersion, Character, ChapterPlan } from '../db'

// Mock Dexie
vi.mock('dexie', () => {
  const mockDB = {
    projects: {
      add: vi.fn().mockResolvedValue(1),
      toArray: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          modify: vi.fn().mockResolvedValue(undefined)
        })
      })
    },
    outlineNodes: {
      add: vi.fn().mockResolvedValue(1),
      toArray: vi.fn().mockResolvedValue([]),
      sortBy: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          modify: vi.fn().mockResolvedValue(undefined),
          sortBy: vi.fn().mockResolvedValue([])
        })
      })
    },
    materialCards: {
      add: vi.fn().mockResolvedValue(1),
      toArray: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          modify: vi.fn().mockResolvedValue(undefined)
        })
      })
    },
    projectVersions: {
      add: vi.fn().mockResolvedValue(1),
      toArray: vi.fn().mockResolvedValue([]),
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
          modify: vi.fn().mockResolvedValue(undefined)
        })
      })
    }
  }
  return { default: vi.fn(() => mockDB), Table: vi.fn() }
})

describe('db.ts', () => {
  describe('Project interface', () => {
    it('should have required fields', () => {
      const project: Project = {
        title: 'Test Novel',
        genre: 'Fantasy',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      expect(project.title).toBe('Test Novel')
      expect(project.genre).toBe('Fantasy')
    })

    it('should support V23 extended fields', () => {
      const project: Project = {
        title: 'Test Novel',
        genre: 'Fantasy',
        createdAt: new Date(),
        updatedAt: new Date(),
        protagonistName: '张三',
        background: '古代王朝',
        coreSellingPoint: '热血',
        otherRequirements: '无',
        worldbuilding: '修仙世界观'
      }
      expect(project.protagonistName).toBe('张三')
      expect(project.worldbuilding).toBe('修仙世界观')
    })
  })

  describe('OutlineNode interface', () => {
    it('should support all node types', () => {
      const node: OutlineNode = {
        id: 1,
        projectId: 1,
        parentId: null,
        type: 'volume',
        title: '第一卷',
        summary: '概要',
        content: '内容',
        status: 'planning',
        order: 0
      }
      expect(node.type).toBe('volume')

      const chapterNode: OutlineNode = { ...node, id: 2, type: 'chapter', parentId: 1 }
      expect(chapterNode.type).toBe('chapter')
    })

    it('should support all status values', () => {
      const statuses: Array<OutlineNode['status']> = ['planning', 'writing', 'completed']
      statuses.forEach(status => {
        const node: OutlineNode = {
          id: 1,
          projectId: 1,
          parentId: null,
          type: 'chapter',
          title: 'Test',
          summary: '',
          content: '',
          status,
          order: 0
        }
        expect(node.status).toBe(status)
      })
    })
  })

  describe('MaterialCard interface', () => {
    it('should support all card types', () => {
      const cardTypes: Array<MaterialCard['type']> = ['character', 'location', 'item']
      cardTypes.forEach(type => {
        const card: MaterialCard = {
          id: 1,
          projectId: 1,
          type,
          name: 'Test',
          fields: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
        expect(card.type).toBe(type)
      })
    })
  })

  describe('Character interface (V23)', () => {
    it('should have correct structure', () => {
      const char: Character = {
        id: 'char-1',
        name: '张三',
        role: 'protagonist',
        personalityTraits: ['勇敢', '正直'],
        goal: '成为大侠',
        relationships: ['李四是好友', '王五是敌人']
      }
      expect(char.name).toBe('张三')
      expect(char.role).toBe('protagonist')
      expect(char.personalityTraits).toHaveLength(2)
    })

    it('should support all role types', () => {
      const roles: Array<Character['role']> = ['protagonist', 'supporting', 'minor']
      roles.forEach(role => {
        const char: Character = {
          id: '1',
          name: 'Test',
          role,
          personalityTraits: [],
          goal: '',
          relationships: []
        }
        expect(char.role).toBe(role)
      })
    })
  })

  describe('ChapterPlan interface (V23)', () => {
    it('should have correct structure', () => {
      const plan: ChapterPlan = {
        index: 1,
        title: '第一章',
        summary: '故事开始'
      }
      expect(plan.index).toBe(1)
      expect(plan.title).toBe('第一章')
    })
  })

  describe('ProjectVersion interface (V23)', () => {
    it('should have correct structure', () => {
      const version: ProjectVersion = {
        id: 1,
        projectId: 1,
        versionIndex: 1,
        outline: '这是一个大纲',
        characters: [],
        chapters: [],
        generatedAt: Date.now(),
        isSelected: false
      }
      expect(version.versionIndex).toBe(1)
      expect(version.isSelected).toBe(false)
    })

    it('should support versionIndex 1, 2, 3', () => {
      const indices: Array<ProjectVersion['versionIndex']> = [1, 2, 3]
      indices.forEach(idx => {
        const version: ProjectVersion = {
          projectId: 1,
          versionIndex: idx,
          outline: '',
          characters: [],
          chapters: [],
          generatedAt: Date.now(),
          isSelected: false
        }
        expect(version.versionIndex).toBe(idx)
      })
    })
  })
})
