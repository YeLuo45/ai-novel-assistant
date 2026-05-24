/**
 * MessageBus.test.ts - 消息总线测试
 * V41 多Agent协作系统测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MessageBus, Message, MessageType } from '../MessageBus'

describe('MessageBus', () => {
  let messageBus: MessageBus

  beforeEach(() => {
    messageBus = new MessageBus()
  })

  describe('publish/subscribe', () => {
    it('should publish message to channel', () => {
      const handler = vi.fn()
      const channel = 'test:channel'
      
      messageBus.subscribe(channel, handler)
      
      const message: Message = {
        id: 'msg_1',
        from: 'agent_1',
        to: 'agent_2',
        channel,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now()
      }
      
      messageBus.publish(channel, message)
      
      expect(handler).toHaveBeenCalledWith(message)
    })

    it('should handle multiple handlers', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const channel = 'test:channel'
      
      messageBus.subscribe(channel, handler1)
      messageBus.subscribe(channel, handler2)
      
      const message: Message = {
        id: 'msg_1',
        from: 'agent_1',
        to: 'agent_2',
        channel,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now()
      }
      
      messageBus.publish(channel, message)
      
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should call unsubscribe to remove handler', () => {
      const handler = vi.fn()
      const channel = 'test:channel'
      
      const unsubscribe = messageBus.subscribe(channel, handler)
      unsubscribe()
      
      const message: Message = {
        id: 'msg_1',
        from: 'agent_1',
        to: 'agent_2',
        channel,
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now()
      }
      
      messageBus.publish(channel, message)
      
      expect(handler).not.toHaveBeenCalled()
    })

    it('should handle async handlers', async () => {
      const handler = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })
      const channel = 'test:async'
      
      messageBus.subscribe(channel, handler)
      
      const message: Message = {
        id: 'msg_1',
        from: 'agent_1',
        to: 'agent_2',
        channel,
        type: 'request',
        payload: {},
        timestamp: Date.now()
      }
      
      await messageBus.publish(channel, message)
      
      // Should not throw
    })
  })

  describe('send', () => {
    it('should send message with generated id', () => {
      const message = messageBus.send('agent_1', 'agent_2', 'test:channel', 'request', { data: 'test' })
      
      expect(message.id).toBeDefined()
      expect(message.from).toBe('agent_1')
      expect(message.to).toBe('agent_2')
      expect(message.channel).toBe('test:channel')
      expect(message.type).toBe('request')
      expect(message.payload).toEqual({ data: 'test' })
    })
  })

  describe('request/response/event/signal', () => {
    it('should create request message', () => {
      const message = messageBus.request('a', 'b', 'ch', { key: 'value' })
      
      expect(message.type).toBe('request')
      expect(message.payload).toEqual({ key: 'value' })
    })

    it('should create response message', () => {
      const message = messageBus.response('a', 'b', 'ch', { result: 'ok' })
      
      expect(message.type).toBe('response')
    })

    it('should create event message', () => {
      const message = messageBus.event('a', 'ch', { info: 'data' })
      
      expect(message.type).toBe('event')
      expect(message.to).toBe('*')
    })

    it('should create signal message', () => {
      const message = messageBus.signal('a', 'b', 'ch')
      
      expect(message.type).toBe('signal')
      expect(message.payload).toBeNull()
    })
  })

  describe('broadcast', () => {
    it('should broadcast message without specific target', () => {
      const handler = vi.fn()
      const channel = 'broadcast:channel'
      
      messageBus.subscribe(channel, handler)
      
      messageBus.broadcast(channel, {
        from: 'broadcaster',
        channel,
        type: 'event',
        payload: { data: 'broadcast test' },
        timestamp: Date.now()
      })
      
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('getChannelSubscriberCount', () => {
    it('should return 0 for non-existent channel', () => {
      expect(messageBus.getChannelSubscriberCount('nonexistent')).toBe(0)
    })

    it('should return subscriber count', () => {
      const channel = 'count:channel'
      
      messageBus.subscribe(channel, vi.fn())
      messageBus.subscribe(channel, vi.fn())
      
      expect(messageBus.getChannelSubscriberCount(channel)).toBe(2)
    })
  })

  describe('message log', () => {
    it('should store published messages', () => {
      const channel = 'log:channel'
      
      messageBus.send('a', 'b', channel, 'request', {})
      messageBus.send('c', 'd', channel, 'response', {})
      
      const log = messageBus.getMessageLog()
      expect(log.length).toBeGreaterThanOrEqual(2)
    })

    it('should return limited log', () => {
      const channel = 'limit:channel'
      
      for (let i = 0; i < 5; i++) {
        messageBus.send(`a${i}`, 'b', channel, 'request', {})
      }
      
      const log = messageBus.getMessageLog(3)
      expect(log.length).toBe(3)
    })

    it('should clear log', () => {
      messageBus.send('a', 'b', 'ch', 'request', {})
      messageBus.clearLog()
      
      expect(messageBus.getMessageLog().length).toBe(0)
    })
  })

  describe('clear operations', () => {
    it('should clear specific channel', () => {
      const channel = 'clear:channel'
      messageBus.subscribe(channel, vi.fn())
      messageBus.clearChannel(channel)
      
      expect(messageBus.getChannelSubscriberCount(channel)).toBe(0)
    })

    it('should clear all channels', () => {
      messageBus.subscribe('ch1', vi.fn())
      messageBus.subscribe('ch2', vi.fn())
      messageBus.clearAll()
      
      expect(messageBus.getChannelSubscriberCount('ch1')).toBe(0)
      expect(messageBus.getChannelSubscriberCount('ch2')).toBe(0)
    })
  })
})
