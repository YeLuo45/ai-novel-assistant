/**
 * HealthCheck Tests - V41
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HealthCheck } from './HealthCheck'

describe('HealthCheck', () => {
  let healthCheck: HealthCheck

  beforeEach(() => {
    healthCheck = new HealthCheck()
  })

  describe('Basic Health Check', () => {
    it('should return health status', async () => {
      const result = await healthCheck.check()

      expect(result).toHaveProperty('api')
      expect(result).toHaveProperty('database')
      expect(result).toHaveProperty('memory')
      expect(result).toHaveProperty('overall')
      expect(result).toHaveProperty('timestamp')
    })

    it('should have valid component statuses', async () => {
      const result = await healthCheck.check()

      const validStatuses = ['healthy', 'degraded', 'down']
      expect(validStatuses).toContain(result.api)
      expect(validStatuses).toContain(result.database)
      expect(validStatuses).toContain(result.memory)
      expect(validStatuses).toContain(result.overall)
    })
  })

  describe('Circuit Breaker', () => {
    it('should track circuit states', () => {
      const summary = healthCheck.getStatusSummary()

      expect(summary).toHaveProperty('emergencyMode')
      expect(summary).toHaveProperty('circuits')
      expect(summary.circuits).toHaveProperty('api')
      expect(summary.circuits).toHaveProperty('database')
    })

    it('should start in closed state', () => {
      const summary = healthCheck.getStatusSummary()

      expect(summary.circuits.api.state).toBe('closed')
      expect(summary.circuits.database.state).toBe('closed')
    })
  })

  describe('Emergency Mode', () => {
    it('should trigger emergency mode', () => {
      healthCheck.emergencyMode()
      const summary = healthCheck.getStatusSummary()

      expect(summary.emergencyMode).toBe(true)
    })

    it('should exit emergency mode', () => {
      healthCheck.emergencyMode()
      healthCheck.exitEmergencyMode()
      const summary = healthCheck.getStatusSummary()

      expect(summary.emergencyMode).toBe(false)
    })
  })

  describe('Degradation', () => {
    it('should indicate degradation when emergency mode active', () => {
      healthCheck.emergencyMode()
      expect(healthCheck.shouldDegrade()).toBe(true)
    })
  })
})