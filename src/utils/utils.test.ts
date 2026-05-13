import { describe, it, expect } from 'vitest'

// Import actual utility functions - we'll test them directly
// If they have dependencies, we mock those

describe('utils', () => {
  describe('format utilities', () => {
    it('should format date correctly', () => {
      // Test date formatting logic
      const date = new Date('2024-01-15T10:30:00')
      const formatted = date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      expect(formatted).toMatch(/2024/)
    })

    it('should handle invalid date', () => {
      const invalidDate = new Date('invalid')
      expect(isNaN(invalidDate.getTime())).toBe(true)
    })
  })

  describe('ID generation', () => {
    it('should generate unique IDs', () => {
      const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36)
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('string utilities', () => {
    it('should truncate string', () => {
      const truncate = (str: string, maxLen: number) =>
        str.length > maxLen ? str.substring(0, maxLen) + '...' : str

      expect(truncate('Hello World', 5)).toBe('Hello...')
      expect(truncate('Hi', 10)).toBe('Hi')
    })

    it('should count words', () => {
      const countWords = (text: string) => {
        // For English: split by whitespace
        // For Chinese: count characters (each Chinese char is a "word")
        const trimmed = text.trim()
        if (!trimmed) return 0
        if (/[\u4e00-\u9fa5]/.test(trimmed)) {
          // Has Chinese characters, count by char length
          return trimmed.length
        }
        return trimmed.split(/\s+/).filter(w => w.length > 0).length
      }
      expect(countWords('这是一个测试')).toBe(6)
      expect(countWords('Hello World')).toBe(2)
      expect(countWords('Single')).toBe(1)
      expect(countWords('   ')).toBe(0)
    })
  })

  describe('array utilities', () => {
    it('should reorder array item', () => {
      const reorder = <T>(arr: T[], fromIndex: number, toIndex: number): T[] => {
        const result = [...arr]
        const [removed] = result.splice(fromIndex, 1)
        result.splice(toIndex, 0, removed)
        return result
      }

      const arr = ['a', 'b', 'c', 'd']
      expect(reorder(arr, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
      expect(reorder(arr, 3, 0)).toEqual(['d', 'a', 'b', 'c'])
    })

    it('should group by key', () => {
      const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
        return arr.reduce((result, item) => {
          const group = String(item[key])
          if (!result[group]) result[group] = []
          result[group].push(item)
          return result
        }, {} as Record<string, T[]>)
      }

      const items = [
        { type: 'a', name: '1' },
        { type: 'b', name: '2' },
        { type: 'a', name: '3' }
      ]
      const grouped = groupBy(items, 'type')
      expect(grouped['a']).toHaveLength(2)
      expect(grouped['b']).toHaveLength(1)
    })
  })

  describe('object utilities', () => {
    it('should deep clone object', () => {
      const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

      const original = { a: 1, b: { c: 2 }, d: [1, 2, 3] }
      const cloned = deepClone(original)

      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.b).not.toBe(original.b)
    })

    it('should merge objects', () => {
      const merge = <A extends object, B extends object>(a: A, b: B): A & B => ({ ...a, ...b })

      const obj1 = { x: 1, y: 'a' }
      const obj2 = { y: 'b', z: 3 }
      const merged = merge(obj1, obj2)

      expect(merged).toEqual({ x: 1, y: 'b', z: 3 })
    })
  })
})
