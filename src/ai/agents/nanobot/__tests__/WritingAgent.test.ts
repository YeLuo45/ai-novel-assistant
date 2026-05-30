/**
 * WritingAgent.test.ts - Agent基类测试
 * V41 多Agent协作系统测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WritingAgent, AgentConfig, AgentRole, Message, AgentState } from '../WritingAgent'
import { MessageBus } from '../MessageBus'

// Test implementation of WritingAgent
class TestAgent extends WritingAgent {
  readonly role: 'plot' = 'plot'
  
  async process(message: Message): Promise<{ success: boolean; output?: unknown; error?: string }> {
    this.setState('working')
    return { success: true, output: { processed: true } }
  }
}

describe('WritingAgent', () => {
  let messageBus: MessageBus
  let agent: TestAgent

  beforeEach(() => {
    messageBus = new MessageBus()
    agent = new TestAgent(
      { id: 'test_agent', name: 'TestAgent', role: 'plot' },
      messageBus
    )
  })

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(agent.id).toBe('test_agent')
      expect(agent.name).toBe('TestAgent')
      expect(agent.role).toBe('plot')
      expect(agent.state).toBe('idle')
    })
  })

  describe('send', () => {
    it('should send message via messageBus', () => {
      const handler = vi.fn()
      messageBus.subscribe('test:channel', handler)
      
      agent.send('target', {
        channel: 'test:channel',
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now()
      })
      
      expect(handler).toHaveBeenCalled()
    })

    it('should add message to outbox', () => {
      agent.send('target', {
        channel: 'test:channel',
        type: 'request',
        payload: { data: 'test' },
        timestamp: Date.now()
      })
      
      const outbox = agent.getOutbox()
      expect(outbox.length).toBe(1)
      expect(outbox[0].from).toBe('test_agent')
    })
  })

  describe('broadcast', () => {
    it('should broadcast to channel', () => {
      const handler = vi.fn()
      messageBus.subscribe('broadcast:channel', handler)
      
      agent.broadcast('broadcast:channel', {
        channel: 'broadcast:channel',
        type: 'event',
        payload: { data: 'broadcast' },
        timestamp: Date.now()
      })
      
      expect(handler).toHaveBeenCalled()
    })
  })

  describe('receive', () => {
    it('should add message to inbox', () => {
      const message: Message = {
        id: 'msg_1',
        from: 'other',
        to: 'test_agent',
        channel: 'test:channel',
        type: 'request',
        payload: {},
        timestamp: Date.now()
      }
      
      agent.receive(message)
      
      const inbox = agent.getInbox()
      expect(inbox.length).toBe(1)
    })
  })

  describe('subscribe/unsubscribe', () => {
    it('should subscribe to channel', () => {
      const handler = vi.fn()
      
      const unsub = agent.subscribe('sub:channel', handler)
      expect(typeof unsub).toBe('function')
      
      messageBus.publish('sub:channel', {
        id: 'msg_1',
        from: 'x',
        to: 'y',
        channel: 'sub:channel',
        type: 'event',
        payload: {},
        timestamp: Date.now()
      })
      
      expect(handler).toHaveBeenCalled()
    })

    it('should unsubscribe from channel', () => {
      const handler = vi.fn()
      
      agent.subscribe('unsub:channel', handler)
      agent.unsubscribe('unsub:channel')
      
      messageBus.publish('unsub:channel', {
        id: 'msg_1',
        from: 'x',
        to: 'y',
        channel: 'unsub:channel',
        type: 'event',
        payload: {},
        timestamp: Date.now()
      })
      
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('inbox/outbox operations', () => {
    it('should clear inbox', () => {
      agent.receive({
        id: 'msg_1',
        from: 'x',
        to: 'test_agent',
        channel: 'ch',
        type: 'request',
        payload: {},
        timestamp: Date.now()
      })
      
      agent.clearInbox()
      expect(agent.getInbox().length).toBe(0)
    })

    it('should clear outbox', () => {
      agent.send('target', {
        channel: 'ch',
        type: 'request',
        payload: {},
        timestamp: Date.now()
      })
      
      agent.clearOutbox()
      expect(agent.getOutbox().length).toBe(0)
    })
  })

  describe('state management', () => {
    it('should set state', () => {
      agent.setState('working')
      expect(agent.state).toBe('working')
    })

    it('should reset agent', () => {
      agent.setState('working')
      agent.receive({
        id: 'msg_1',
        from: 'x',
        to: 'test_agent',
        channel: 'ch',
        type: 'request',
        payload: {},
        timestamp: Date.now()
      })
      
      agent.reset()
      
      expect(agent.state).toBe('idle')
      expect(agent.getInbox().length).toBe(0)
      expect(agent.getOutbox().length).toBe(0)
    })
  })

  describe('getInfo', () => {
    it('should return agent info', () => {
      const info = agent.getInfo()
      
      expect(info.id).toBe('test_agent')
      expect(info.name).toBe('TestAgent')
      expect(info.role).toBe('plot')
      expect(info.state).toBe('idle')
    })
  })
})
