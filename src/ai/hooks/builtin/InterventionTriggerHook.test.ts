/**
 * InterventionTriggerHook Tests - V53
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerInterventionTriggerHook, resetInterventionState, getInterventionState } from './InterventionTriggerHook'

// Mock the hook manager
const mockRegister = vi.fn()
const mockTrigger = vi.fn()

vi.mock('../hooks/HookManager', () => ({
  hookManager: {
    register: mockRegister,
    trigger: mockTrigger,
  }
}))

describe('InterventionTriggerHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetInterventionState()
  })

  afterEach(() => {
    resetInterventionState()
  })

  describe('registerInterventionTriggerHook', () => {
    it('should register with priority 90', () => {
      registerInterventionTriggerHook()
      expect(mockRegister).toHaveBeenCalledWith(
        'quality:update',
        expect.any(Function),
        90
      )
    })

    it('should register handle function', () => {
      registerInterventionTriggerHook()
      const [, handler] = mockRegister.mock.calls[0]
      expect(typeof handler).toBe('function')
    })
  })

  describe('getInterventionState', () => {
    it('should return initial state with zero consecutive count', () => {
      const state = getInterventionState()
      expect(state.consecutiveLowQualityCount).toBe(0)
      expect(state.threshold).toBe(0.4)
      expect(state.isPaused).toBe(false)
    })
  })

  describe('resetInterventionState', () => {
    it('should reset consecutiveLowQualityCount to 0', () => {
      resetInterventionState()
      const state = getInterventionState()
      expect(state.consecutiveLowQualityCount).toBe(0)
    })
  })
})