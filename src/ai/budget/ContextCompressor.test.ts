/**
 * V45 BudgetContextCompressor Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetContextCompressor, budgetContextCompressor } from './ContextCompressor';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

describe('BudgetContextCompressor', () => {
  let compressor: BudgetContextCompressor;

  beforeEach(() => {
    compressor = new BudgetContextCompressor(150000);
  });

  describe('constructor', () => {
    it('should create instance with default threshold', () => {
      expect(compressor.getThreshold()).toBe(150000);
    });

    it('should accept custom threshold', () => {
      const custom = new BudgetContextCompressor(100000);
      expect(custom.getThreshold()).toBe(100000);
    });
  });

  describe('needsCompression', () => {
    it('should return false for empty messages', () => {
      expect(compressor.needsCompression([])).toBe(false);
    });

    it('should return false when under threshold', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
      ];
      expect(compressor.needsCompression(messages)).toBe(false);
    });

    it('should return true when over threshold', () => {
      // Create messages that exceed threshold (600k chars = 150k tokens, need > 150k)
      const longContent = 'a'.repeat(600001); // ~150k+ tokens
      const messages: Message[] = [
        { role: 'user', content: longContent },
      ];
      expect(compressor.needsCompression(messages)).toBe(true);
    });
  });

  describe('estimateTotalTokens', () => {
    it('should estimate tokens for messages', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello world' }, // ~3 tokens
        { role: 'assistant', content: 'Hi there' }, // ~2 tokens
      ];
      const tokens = compressor.estimateTotalTokens(messages);
      expect(tokens).toBeGreaterThan(0);
    });

    it('should return 0 for empty array', () => {
      expect(compressor.estimateTotalTokens([])).toBe(0);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for text', () => {
      // 1 token ≈ 4 characters
      expect(compressor.estimateTokens('hello')).toBe(2);
      expect(compressor.estimateTokens('你好')).toBe(1);
    });

    it('should handle empty string', () => {
      expect(compressor.estimateTokens('')).toBe(0);
    });

    it('should round up', () => {
      expect(compressor.estimateTokens('abc')).toBe(1);
    });
  });

  describe('compress', () => {
    it('should return same messages when under threshold', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ];
      const result = compressor.compress(messages);
      
      expect(result.wasCompressed).toBe(false);
      expect(result.compressionRatio).toBe(1);
    });

    it('should compress when over threshold', () => {
      // Create messages that exceed threshold
      const longContent = 'a'.repeat(600000);
      const messages: Message[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: longContent },
        { role: 'assistant', content: longContent },
      ];
      
      const result = compressor.compress(messages, 50000);
      
      expect(result.wasCompressed).toBe(true);
      expect(result.compressedCount).toBeLessThan(messages.length);
      expect(result.compressionRatio).toBeLessThan(1);
    });

    it('should preserve system messages', () => {
      const messages: Message[] = [
        { role: 'system', content: 'Important system prompt' },
        { role: 'user', content: 'a'.repeat(600000) },
      ];
      
      const result = compressor.compress(messages, 50000);
      
      const systemMsg = result.compressed.find(m => m.role === 'system');
      expect(systemMsg).toBeDefined();
      expect(systemMsg?.content).toContain('Important system prompt');
    });

    it('should preserve key content with plot/character keywords', () => {
      const messages: Message[] = [
        { role: 'system', content: 'System' },
        { role: 'user', content: '人物：张三是一名警察' },
        { role: 'user', content: 'a'.repeat(500000) },
      ];
      
      const result = compressor.compress(messages, 50000);
      
      // Key content should be preserved
      const hasKeyContent = result.compressed.some(m => m.content.includes('人物'));
      expect(hasKeyContent).toBe(true);
    });

    it('should handle empty messages', () => {
      const result = compressor.compress([], 50000);
      
      expect(result.compressed).toEqual([]);
      expect(result.originalCount).toBe(0);
      expect(result.compressionRatio).toBe(1);
    });
  });

  describe('default export', () => {
    it('should export default instance with threshold 150000', () => {
      expect(budgetContextCompressor.getThreshold()).toBe(150000);
    });
  });
});