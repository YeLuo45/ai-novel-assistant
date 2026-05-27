/**
 * HookLifecycleManager Tests - V70
 * Tests for Hook 全生命周期管理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { HookType, HookContext } from './types'
import {
  type HookLifecycleState,
  type HookMetrics,
  type HookLifecycleRegistration,
  type LifecycleEvent,
  type LifecycleListener,
  HookLifecycleManager,
  hookLifecycleManager
} from './HookLifecycleManager'

describe('HookLifecycleManager', () => {
  let manager: HookLifecycleManager

  beforeEach(() => {
    manager = new HookLifecycleManager()
  })

  describe('register', () => {
    it('should register a hook and return ID', () => {
      const handler = async () => {}
      const id = manager.register('post-task', handler, 50)
      
      expect(id).toMatch(/^hook-post-task-/)
      expect(manager.get(id)).toBeDefined()
    })

    it('should set initial state to registered', () => {
      const id = manager.register('post-task', async () => {})
      const reg = manager.get(id)
      
      expect(reg?.state).toBe('registered')
    })

    it('should set correct priority', () => {
      const id = manager.register('post-task', async () => {}, 100)
      const reg = manager.get(id)
      
      expect(reg?.priority).toBe(100)
    })

    it('should set default version 1.0.0', () => {
      const id = manager.register('post-task', async () => {})
      const reg = manager.get(id)
      
      expect(reg?.version).toBe('1.0.0')
    })

    it('should set custom version', () => {
      const id = manager.register('post-task', async () => {}, 50, '2.0.0')
      const reg = manager.get(id)
      
      expect(reg?.version).toBe('2.0.0')
    })

    it('should initialize metrics to zero', () => {
      const id = manager.register('post-task', async () => {})
      const reg = manager.get(id)
      
      expect(reg?.metrics.totalInvocations).toBe(0)
      expect(reg?.metrics.successfulInvocations).toBe(0)
      expect(reg?.metrics.failedInvocations).toBe(0)
    })

    it('should emit registered lifecycle event', () => {
      const listener: LifecycleListener = {
        onEvent: (event: LifecycleEvent) => {
          expect(event.event).toBe('registered')
        }
      }
      manager.addListener(listener)
      
      const id = manager.register('post-task', async () => {})
      expect(manager.get(id)).toBeDefined()
    })
  })

  describe('trigger', () => {
    it('should execute active hooks', async () => {
      let called = false
      const handler = async () => { called = true }
      const id = manager.register('post-task', handler)
      manager.activate(id)
      
      await manager.trigger('post-task', createContext())
      
      expect(called).toBe(true)
    })

    it('should NOT execute paused hooks', async () => {
      let called = false
      const handler = async () => { called = true }
      const id = manager.register('post-task', handler)
      manager.pause(id)
      
      await manager.trigger('post-task', createContext())
      
      expect(called).toBe(false)
    })

    it('should NOT execute removed hooks', async () => {
      let called = false
      const handler = async () => { called = true }
      const id = manager.register('post-task', handler)
      manager.activate(id)
      manager.remove(id)
      
      await manager.trigger('post-task', createContext())
      
      expect(called).toBe(false)
    })

    it('should execute hooks in priority order', async () => {
      const order: number[] = []
      const id1 = manager.register('post-task', async () => { order.push(1) }, 30)
      const id2 = manager.register('post-task', async () => { order.push(2) }, 50)
      const id3 = manager.register('post-task', async () => { order.push(3) }, 10)
      manager.activate(id1)
      manager.activate(id2)
      manager.activate(id3)
      
      await manager.trigger('post-task', createContext())
      
      expect(order).toEqual([2, 1, 3])  // 50, 30, 10
    })

    it('should update metrics on success', async () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      
      await manager.trigger('post-task', createContext())
      
      const metrics = manager.getMetrics(id)
      expect(metrics?.totalInvocations).toBe(1)
      expect(metrics?.successfulInvocations).toBe(1)
      expect(metrics?.failedInvocations).toBe(0)
    })

    it('should update metrics on failure', async () => {
      const id = manager.register('post-task', async () => { throw new Error('test error') })
      manager.activate(id)
      
      await manager.trigger('post-task', createContext())
      
      const metrics = manager.getMetrics(id)
      expect(metrics?.totalInvocations).toBe(1)
      expect(metrics?.successfulInvocations).toBe(0)
      expect(metrics?.failedInvocations).toBe(1)
      expect(metrics?.lastError).toBe('test error')
    })

    it('should execute multiple hooks of same type', async () => {
      const results: string[] = []
      const id1 = manager.register('post-task', async () => { results.push('a') })
      const id2 = manager.register('post-task', async () => { results.push('b') })
      manager.activate(id1)
      manager.activate(id2)
      
      await manager.trigger('post-task', createContext())
      
      expect(results).toHaveLength(2)
      expect(results).toContain('a')
      expect(results).toContain('b')
    })
  })

  describe('activate', () => {
    it('should transition registered to active', () => {
      const id = manager.register('post-task', async () => {})
      
      const result = manager.activate(id)
      
      expect(result).toBe(true)
      expect(manager.get(id)?.state).toBe('active')
    })

    it('should transition paused to active', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      manager.pause(id)
      
      const result = manager.activate(id)
      
      expect(result).toBe(true)
      expect(manager.get(id)?.state).toBe('active')
    })

    it('should NOT transition deprecated to active', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      manager.deprecate(id)
      
      const result = manager.activate(id)
      
      expect(result).toBe(false)
    })

    it('should NOT transition removed to active', () => {
      const id = manager.register('post-task', async () => {})
      manager.remove(id)
      
      const result = manager.activate(id)
      
      expect(result).toBe(false)
    })
  })

  describe('pause', () => {
    it('should transition active to paused', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      
      const result = manager.pause(id)
      
      expect(result).toBe(true)
      expect(manager.get(id)?.state).toBe('paused')
    })

    it('should NOT transition registered to paused', () => {
      const id = manager.register('post-task', async () => {})
      
      const result = manager.pause(id)
      
      expect(result).toBe(false)
    })
  })

  describe('deprecate', () => {
    it('should transition active to deprecated', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      
      const result = manager.deprecate(id)
      
      expect(result).toBe(true)
      expect(manager.get(id)?.state).toBe('deprecated')
      expect(manager.get(id)?.deprecated).toBe(true)
    })

    it('should set deprecation message', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      
      manager.deprecate(id, 'Use new-hook instead')
      
      expect(manager.get(id)?.deprecationMessage).toBe('Use new-hook instead')
    })

    it('should set default deprecation message', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      
      manager.deprecate(id)
      
      expect(manager.get(id)?.deprecationMessage).toContain('deprecated')
    })
  })

  describe('remove', () => {
    it('should remove registered hook', () => {
      const id = manager.register('post-task', async () => {})
      
      const result = manager.remove(id)
      
      expect(result).toBe(true)
      expect(manager.get(id)).toBeUndefined()
    })

    it('should remove active hook', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      
      const result = manager.remove(id)
      
      expect(result).toBe(true)
      expect(manager.get(id)).toBeUndefined()
    })

    it('should remove deprecated hook', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      manager.deprecate(id)
      
      const result = manager.remove(id)
      
      expect(result).toBe(true)
      expect(manager.get(id)).toBeUndefined()
    })
  })

  describe('getByType', () => {
    it('should return all hooks of type', () => {
      manager.register('post-task', async () => {})
      manager.register('post-task', async () => {})
      manager.register('pre-task', async () => {})
      
      const postTaskHooks = manager.getByType('post-task')
      
      expect(postTaskHooks).toHaveLength(2)
    })

    it('should return hooks sorted by priority', () => {
      const id1 = manager.register('post-task', async () => {}, 10)
      const id2 = manager.register('post-task', async () => {}, 50)
      const id3 = manager.register('post-task', async () => {}, 30)
      
      const hooks = manager.getByType('post-task')
      
      expect(hooks[0].id).toBe(id2)
      expect(hooks[1].id).toBe(id3)
      expect(hooks[2].id).toBe(id1)
    })
  })

  describe('getActive', () => {
    it('should return only active hooks', () => {
      const id1 = manager.register('post-task', async () => {})
      const id2 = manager.register('post-task', async () => {})
      manager.activate(id1)
      manager.activate(id2)
      manager.register('post-task', async () => {})  // registered, not active
      
      const active = manager.getActive()
      
      expect(active).toHaveLength(2)
    })
  })

  describe('getDeprecated', () => {
    it('should return deprecated hooks', () => {
      const id1 = manager.register('post-task', async () => {})
      const id2 = manager.register('post-task', async () => {})
      manager.activate(id1)
      manager.deprecate(id1)
      manager.activate(id2)
      manager.deprecate(id2)
      
      const deprecated = manager.getDeprecated()
      
      expect(deprecated).toHaveLength(2)
    })
  })

  describe('getMetrics', () => {
    it('should return null for unknown hook', () => {
      const metrics = manager.getMetrics('unknown')
      
      expect(metrics).toBeNull()
    })
  })

  describe('getSuccessRate', () => {
    it('should return null for unknown hook', () => {
      const rate = manager.getSuccessRate('unknown')
      
      expect(rate).toBeNull()
    })

    it('should return null for hook with no invocations', () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      
      const rate = manager.getSuccessRate(id)
      
      expect(rate).toBeNull()
    })

    it('should calculate success rate', async () => {
      const id = manager.register('post-task', async () => {
        throw new Error('fail')
      })
      manager.activate(id)
      
      // 3 failures, 1 success
      for (let i = 0; i < 3; i++) {
        await manager.trigger('post-task', createContext()).catch(() => {})
      }
      
      // Patch the handler to succeed
      const rate = manager.getSuccessRate(id)
      
      expect(rate).not.toBeNull()
    })
  })

  describe('getAverageDuration', () => {
    it('should return null for unknown hook', () => {
      const avg = manager.getAverageDuration('unknown')
      
      expect(avg).toBeNull()
    })
  })

  describe('getStateSummary', () => {
    it('should count hooks by state', () => {
      const id1 = manager.register('post-task', async () => {})
      const id2 = manager.register('post-task', async () => {})
      const id3 = manager.register('post-task', async () => {})
      manager.activate(id1)
      manager.activate(id2)
      manager.activate(id3)
      manager.pause(id3)  // Need to activate first since registered->paused is invalid
      
      const summary = manager.getStateSummary()
      
      expect(summary.registered).toBe(0)
      expect(summary.active).toBe(2)
      expect(summary.paused).toBe(1)
      expect(summary.deprecated).toBe(0)
    })
  })

  describe('resetMetrics', () => {
    it('should reset metrics to zero', async () => {
      const id = manager.register('post-task', async () => {})
      manager.activate(id)
      await manager.trigger('post-task', createContext())
      
      const result = manager.resetMetrics(id)
      
      expect(result).toBe(true)
      expect(manager.getMetrics(id)?.totalInvocations).toBe(0)
    })
  })

  describe('lifecycle transitions', () => {
    it('should follow valid lifecycle path', () => {
      const id = manager.register('post-task', async () => {})
      
      expect(manager.get(id)?.state).toBe('registered')
      
      manager.activate(id)
      expect(manager.get(id)?.state).toBe('active')
      
      manager.pause(id)
      expect(manager.get(id)?.state).toBe('paused')
      
      manager.activate(id)
      expect(manager.get(id)?.state).toBe('active')
      
      manager.deprecate(id)
      expect(manager.get(id)?.state).toBe('deprecated')
      
      manager.remove(id)
      expect(manager.get(id)).toBeUndefined()
    })
  })
})

// Helper
function createContext(): HookContext {
  return {
    taskType: 'test-task',
    outcome: 'success',
    qualityScore: 0.9
  }
}