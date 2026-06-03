/**
 * CollaborationServer - V41
 * WebSocket 房间管理 + OT 冲突解决
 * 多人实时协作编辑章节
 */

import type { AgentId } from './types'

// 操作类型
export type OperationType = 'insert' | 'delete' | 'retain'

export interface Operation {
  id: string
  type: OperationType
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: number
  version: number
}

export interface Room {
  id: string
  projectId: number
  chapterId: number
  users: Map<string, { ws: WebSocket; cursor: number; name: string }>
  operations: Operation[]
  documentState: string
  version: number
  createdAt: number
}

export interface BroadcastMessage {
  type: 'operation' | 'join' | 'leave' | 'cursor' | 'sync' | 'conflict'
  roomId: string
  userId: string
  payload: unknown
  timestamp: number
}

interface ServerConfig {
  heartbeatInterval: number
  maxOperationsHistory: number
  conflictResolveTimeout: number
}

const DEFAULT_CONFIG: ServerConfig = {
  heartbeatInterval: 30000,
  maxOperationsHistory: 1000,
  conflictResolveTimeout: 5000
}

export class CollaborationServer {
  private rooms: Map<string, Room> = new Map()
  private clients: Map<string, { roomId: string; ws: WebSocket }> = new Map()
  private config: ServerConfig
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // 加入房间
  joinRoom(roomId: string, userId: string, userName: string, ws: WebSocket): Room {
    let room = this.rooms.get(roomId)
    
    if (!room) {
      room = {
        id: roomId,
        projectId: 0,
        chapterId: 0,
        users: new Map(),
        operations: [],
        documentState: '',
        version: 0,
        createdAt: Date.now()
      }
      this.rooms.set(roomId, room)
      console.log(`[CollaborationServer] Room created: ${roomId}`)
    }

    room.users.set(userId, { ws, cursor: 0, name: userName })
    this.clients.set(userId, { roomId, ws })
    
    // 启动心跳
    this.startHeartbeat(roomId, userId)

    // 广播用户加入
    this.broadcastToRoom(roomId, {
      type: 'join',
      roomId,
      userId,
      payload: { userName, userCount: room.users.size },
      timestamp: Date.now()
    }, userId)

    console.log(`[CollaborationServer] User ${userId} joined room ${roomId}`)
    return room
  }

  // 离开房间
  leaveRoom(userId: string): void {
    const clientInfo = this.clients.get(userId)
    if (!clientInfo) return

    const { roomId, ws } = clientInfo
    const room = this.rooms.get(roomId)
    
    if (room) {
      room.users.delete(userId)
      
      // 广播用户离开
      this.broadcastToRoom(roomId, {
        type: 'leave',
        roomId,
        userId,
        payload: { userCount: room.users.size },
        timestamp: Date.now()
      })

      // 清理心跳
      this.clearHeartbeat(userId)

      // 删除空房间
      if (room.users.size === 0) {
        this.rooms.delete(roomId)
        console.log(`[CollaborationServer] Room ${roomId} deleted (empty)`)
      }
    }

    this.clients.delete(userId)
    this.closeWebSocket(ws)
  }

  // 广播操作
  broadcast(roomId: string, operation: Operation): Operation {
    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error(`Room ${roomId} not found`)
    }

    // 转换操作（OT算法）
    const transformedOp = this.resolveConflict(operation, room)

    // 添加到历史
    room.operations.push(transformedOp)
    room.version++

    // 限制历史长度
    if (room.operations.length > this.config.maxOperationsHistory) {
      room.operations = room.operations.slice(-this.config.maxOperationsHistory)
    }

    // 广播给房间内其他用户
    this.broadcastToRoom(roomId, {
      type: 'operation',
      roomId,
      userId: operation.userId,
      payload: transformedOp,
      timestamp: Date.now()
    }, operation.userId)

    return transformedOp
  }

  // OT 冲突解决
  resolveConflict(operation: Operation, room: Room): Operation {
    let transformed = { ...operation }

    // 对每个已确认的操作进行转换
    for (const existingOp of room.operations) {
      if (existingOp.timestamp >= operation.timestamp) break

      transformed = this.transformOperation(transformed, existingOp)
    }

    // 更新文档状态
    if (transformed.type === 'insert' && transformed.content) {
      const before = room.documentState.slice(0, transformed.position)
      const after = room.documentState.slice(transformed.position)
      room.documentState = before + transformed.content + after
    } else if (transformed.type === 'delete' && transformed.length) {
      const before = room.documentState.slice(0, transformed.position)
      const after = room.documentState.slice(transformed.position + transformed.length)
      room.documentState = before + after
    }

    return transformed
  }

  // 操作转换（OT核心算法）
  private transformOperation(op: Operation, against: Operation): Operation {
    const result = { ...op }

    if (op.position > against.position) {
      if (against.type === 'insert' && against.content) {
        result.position += against.content.length
      } else if (against.type === 'delete' && against.length) {
        result.position -= against.length
      }
    }

    return result
  }

  // 更新光标位置
  updateCursor(roomId: string, userId: string, cursor: number): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    const user = room.users.get(userId)
    if (user) {
      user.cursor = cursor
    }

    this.broadcastToRoom(roomId, {
      type: 'cursor',
      roomId,
      userId,
      payload: { cursor },
      timestamp: Date.now()
    }, userId)
  }

  // 获取房间状态
  getRoomState(roomId: string): { users: string[]; documentState: string; version: number } | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    return {
      users: Array.from(room.users.keys()),
      documentState: room.documentState,
      version: room.version
    }
  }

  // 广播消息到房间
  private broadcastToRoom(roomId: string, message: BroadcastMessage, excludeUserId?: string): void {
    const room = this.rooms.get(roomId)
    if (!room) return

    const msgStr = JSON.stringify(message)

    room.users.forEach((user, uid) => {
      if (excludeUserId && uid === excludeUserId) return
      this.sendToClient(user.ws, msgStr)
    })
  }

  // 发送消息到客户端
  private sendToClient(ws: WebSocket, data: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data)
    }
  }

  // 关闭 WebSocket
  private closeWebSocket(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close()
    }
  }

  // 心跳
  private startHeartbeat(roomId: string, userId: string): void {
    const key = `${roomId}:${userId}`
    this.clearHeartbeat(key)

    const timer = setInterval(() => {
      const room = this.rooms.get(roomId)
      const user = room?.users.get(userId)
      
      if (!user || user.ws.readyState !== WebSocket.OPEN) {
        this.leaveRoom(userId)
        return
      }

      this.sendToClient(user.ws, JSON.stringify({ type: 'ping', timestamp: Date.now() }))
    }, this.config.heartbeatInterval)

    this.heartbeatTimers.set(key, timer)
  }

  private clearHeartbeat(key: string): void {
    const timer = this.heartbeatTimers.get(key)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(key)
    }
  }

  // 获取活跃房间数
  getActiveRoomsCount(): number {
    return this.rooms.size
  }

  // 获取活跃用户数
  getActiveUsersCount(): number {
    return this.clients.size
  }

  // 关闭服务器
  shutdown(): void {
    // 关闭所有连接
    this.clients.forEach((_, userId) => this.leaveRoom(userId))
    
    // 清理所有心跳
    this.heartbeatTimers.forEach(timer => clearInterval(timer))
    this.heartbeatTimers.clear()
    
    this.rooms.clear()
    console.log('[CollaborationServer] Shutdown complete')
  }
}

// 导出单例
export const collaborationServer = new CollaborationServer()