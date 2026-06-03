/**
 * CollaborationServer Tests - V41
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CollaborationServer } from '../CollaborationServer'

describe('CollaborationServer', () => {
  let server: CollaborationServer

  beforeEach(() => {
    server = new CollaborationServer({
      heartbeatInterval: 60000,
      maxOperationsHistory: 100,
      conflictResolveTimeout: 5000
    })
  })

  afterEach(() => {
    server.shutdown()
  })

  describe('Room Management', () => {
    it('should create a new room when joining', () => {
      const mockWs = createMockWebSocket()
      const room = server.joinRoom('room1', 'user1', 'User One', mockWs)

      expect(room).toBeDefined()
      expect(room.id).toBe('room1')
      expect(room.users.size).toBe(1)
    })

    it('should allow multiple users in same room', () => {
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()

      server.joinRoom('room1', 'user1', 'User One', ws1)
      server.joinRoom('room1', 'user2', 'User Two', ws2)

      const state = server.getRoomState('room1')
      expect(state?.users).toContain('user1')
      expect(state?.users).toContain('user2')
    })

    it('should remove user from room on leave', () => {
      const mockWs = createMockWebSocket()
      server.joinRoom('room1', 'user1', 'User One', mockWs)
      server.leaveRoom('user1')

      const state = server.getRoomState('room1')
      expect(state?.users).not.toContain('user1')
    })
  })

  describe('Operations & OT', () => {
    it('should broadcast operation to room', () => {
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()

      server.joinRoom('room1', 'user1', 'User One', ws1)
      server.joinRoom('room1', 'user2', 'User Two', ws2)

      const operation = {
        id: 'op1',
        type: 'insert' as const,
        position: 0,
        content: 'Hello',
        userId: 'user1',
        timestamp: Date.now(),
        version: 1
      }

      const result = server.broadcast('room1', operation)
      expect(result).toBeDefined()
      expect(result.position).toBe(0)
    })

    it('should handle concurrent inserts', () => {
      const mockWs = createMockWebSocket()
      server.joinRoom('room1', 'user1', 'User One', mockWs)

      const op1 = {
        id: 'op1',
        type: 'insert' as const,
        position: 0,
        content: 'ABC',
        userId: 'user1',
        timestamp: 1000,
        version: 1
      }

      const op2 = {
        id: 'op2',
        type: 'insert' as const,
        position: 0,
        content: 'XYZ',
        userId: 'user1',
        timestamp: 1001,
        version: 2
      }

      server.broadcast('room1', op1)
      const result = server.broadcast('room1', op2)

      // op2 should be transformed to account for op1
      expect(result.position).toBe(3) // shifted by op1's length
    })
  })

  describe('Active Counts', () => {
    it('should track active rooms', () => {
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()

      server.joinRoom('room1', 'user1', 'User One', ws1)
      server.joinRoom('room2', 'user2', 'User Two', ws2)

      expect(server.getActiveRoomsCount()).toBe(2)
    })

    it('should track active users', () => {
      const ws1 = createMockWebSocket()
      const ws2 = createMockWebSocket()

      server.joinRoom('room1', 'user1', 'User One', ws1)
      server.joinRoom('room2', 'user2', 'User Two', ws2)

      expect(server.getActiveUsersCount()).toBe(2)
    })
  })
})

// Mock WebSocket
function createMockWebSocket() {
  return {
    readyState: 1, // OPEN
    send: () => {},
    close: () => {}
  } as unknown as WebSocket
}