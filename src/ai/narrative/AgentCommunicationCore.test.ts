/**
 * V839 AgentCommunicationCore Tests — Direction A Iter 6/9 (Round 4)
 * Coverage target: 99%+, pass rate: 100%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAgentCommunicationCoreState,
  sendMessage,
  processMessage,
  createChannel,
  getMessagesByAgent,
  getMessagesByType,
  getCommunicationCoreReport,
  resetAgentCommunicationCoreState,
  type AgentCommunicationCoreState,
} from './AgentCommunicationCore';

describe('AgentCommunicationCore', () => {
  let state: AgentCommunicationCoreState;

  beforeEach(() => { state = createAgentCommunicationCoreState(); });

  describe('createAgentCommunicationCoreState', () => {
    it('should initialize with defaults', () => {
      expect(state.messages.size).toBe(0);
      expect(state.channels.size).toBe(0);
    });
  });

  describe('sendMessage', () => {
    it('should send', () => {
      const next = sendMessage(state, 'm1', 'agent1', 'agent2', 'request', 'Please help');
      expect(next.messages.size).toBe(1);
      expect(next.totalMessages).toBe(1);
    });
  });

  describe('processMessage', () => {
    it('should process successfully', () => {
      let next = sendMessage(state, 'm1', 'agent1', 'agent2', 'request', 'content');
      next = processMessage(next, 'm1', true);
      expect(next.processedMessages).toBe(1);
    });

    it('should mark as failed', () => {
      let next = sendMessage(state, 'm1', 'agent1', 'agent2', 'request', 'content');
      next = processMessage(next, 'm1', false);
      expect(next.failedMessages).toBe(1);
    });
  });

  describe('createChannel', () => {
    it('should create channel', () => {
      const next = createChannel(state, 'c1', 'general', ['a1', 'a2'], 'discussion');
      expect(next.totalChannels).toBe(1);
    });
  });

  describe('getMessagesByAgent', () => {
    it('should return agent messages', () => {
      let next = sendMessage(state, 'm1', 'a1', 'a2', 'request', 'c');
      next = sendMessage(next, 'm2', 'a2', 'a3', 'request', 'c');
      const a1Messages = getMessagesByAgent(next, 'a1');
      expect(a1Messages.length).toBe(1);
    });
  });

  describe('getMessagesByType', () => {
    it('should filter by type', () => {
      let next = sendMessage(state, 'm1', 'a1', 'a2', 'request', 'c');
      next = sendMessage(next, 'm2', 'a1', 'a2', 'response', 'c');
      const requests = getMessagesByType(next, 'request');
      expect(requests.length).toBe(1);
    });
  });

  describe('getCommunicationCoreReport', () => {
    it('should return comprehensive report', () => {
      const report = getCommunicationCoreReport(state);
      expect(report.totalMessages).toBe(0);
      expect(typeof report.communicationEfficiency).toBe('number');
    });

    it('should include recommendations for empty state', () => {
      const report = getCommunicationCoreReport(state);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('resetAgentCommunicationCoreState', () => {
    it('should reset all state', () => {
      let next = sendMessage(state, 'm1', 'a1', 'a2', 'request', 'c');
      next = resetAgentCommunicationCoreState();
      expect(next.messages.size).toBe(0);
      expect(next.totalMessages).toBe(0);
    });
  });
});