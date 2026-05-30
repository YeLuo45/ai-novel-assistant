/**
 * V45 Budget ContextCompressor - 上下文压缩器
 * Compresses context when > 150k tokens, preserving key plot/characters/outline
 */

import type { Message } from '../memory/ContextCompressor';

export interface CompressionResult {
  compressed: Message[];
  originalCount: number;
  compressedCount: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

// Preserve these types of content during compression
const PRIORITY_PATTERNS = [
  /人物[：:]/,
  /角色[：:]/,
  /主角[：:]/,
  /情节[：:]/,
  /大纲[：:]/,
  /故事[：:]/,
  /主题[：:]/,
  /设定[：:]/,
  /世界观[：:]/,
  /伏笔[：:]/,
  /高潮[：:]/,
  /结局[：:]/,
];

export class BudgetContextCompressor {
  private readonly TOKENS_PER_CHAR = 0.25;  // 1 token ≈ 4 chars
  private readonly CONTEXT_THRESHOLD;        // Compress when > this many tokens

  constructor(contextThreshold: number = 150000) {
    this.CONTEXT_THRESHOLD = contextThreshold;
  }

  /**
   * Check if compression is needed based on token count
   */
  needsCompression(messages: Message[]): boolean {
    const totalTokens = this.estimateTotalTokens(messages);
    return totalTokens > this.CONTEXT_THRESHOLD;
  }

  /**
   * Get estimated token count
   */
  estimateTotalTokens(messages: Message[]): number {
    return messages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
  }

  /**
   * Estimate tokens for a single message
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length * this.TOKENS_PER_CHAR);
  }

  /**
   * Compress messages to fit within threshold
   * Preserves: system prompts, recent messages, key plot/character/outline content
   */
  compress(messages: Message[], targetTokens?: number): CompressionResult {
    if (messages.length === 0) {
      return { compressed: [], originalCount: 0, compressedCount: 0, compressionRatio: 1, wasCompressed: false };
    }

    const originalCount = messages.length;
    const target = targetTokens || this.CONTEXT_THRESHOLD * 0.8; // Target 80% of threshold
    const originalTokens = this.estimateTotalTokens(messages);

    // If already under threshold, return as-is
    if (originalTokens <= target) {
      return {
        compressed: [...messages],
        originalCount,
        compressedCount: originalCount,
        compressionRatio: 1,
        wasCompressed: false,
      };
    }

    // Categorize messages by importance
    const categorized = this.categorizeByImportance(messages);
    
    // Build compressed result preserving key elements
    const compressed: Message[] = [];
    let currentTokens = 0;

    // 1. Always keep system prompts
    for (const msg of categorized.system) {
      const tokens = this.estimateTokens(msg.content);
      if (currentTokens + tokens <= target * 0.3) {  // System max 30%
        compressed.push(msg);
        currentTokens += tokens;
      }
    }

    // 2. Keep key plot/character/outline content
    for (const msg of categorized.keyContent) {
      const tokens = this.estimateTokens(msg.content);
      if (currentTokens + tokens <= target * 0.6) {  // Key content max 60%
        compressed.push(msg);
        currentTokens += tokens;
      }
    }

    // 3. Keep recent messages (last 20%)
    const recentMessages = categorized.recent;
    for (const msg of recentMessages) {
      const tokens = this.estimateTokens(msg.content);
      if (currentTokens + tokens <= target) {
        compressed.push(msg);
        currentTokens += tokens;
      }
    }

    // 4. If still over target, summarize the rest
    if (currentTokens > target && categorized.summarizable.length > 0) {
      const summary = this.generateSummary(categorized.summarizable);
      const summaryTokens = this.estimateTokens(summary);
      
      if (currentTokens - this.getComposableTokens(categorized.summarizable) + summaryTokens <= target) {
        // Remove old messages and add summary
        const toRemove = categorized.summarizable;
        const keptMessages = compressed.filter(m => !toRemove.includes(m));
        compressed.length = 0;
        compressed.push(...keptMessages);
        
        if (summaryTokens <= target * 0.4) {
          compressed.unshift({
            role: 'system',
            content: `[上下文摘要] ${summary}`,
          });
          currentTokens = this.estimateTotalTokens(compressed);
        }
      }
    }

    const compressedCount = compressed.length;
    const compressedTokens = this.estimateTotalTokens(compressed);
    const ratio = originalTokens > 0 ? compressedTokens / originalTokens : 1;

    return {
      compressed,
      originalCount,
      compressedCount,
      compressionRatio: Math.round(ratio * 100) / 100,
      wasCompressed: compressedCount < originalCount,
    };
  }

  /**
   * Categorize messages by importance
   */
  private categorizeByImportance(messages: Message[]): {
    system: Message[];
    keyContent: Message[];
    recent: Message[];
    summarizable: Message[];
  } {
    const system: Message[] = [];
    const keyContent: Message[] = [];
    const recent: Message[] = [];
    const summarizable: Message[] = [];

    const threshold = this.CONTEXT_THRESHOLD;

    messages.forEach((msg, index) => {
      const isRecent = index >= messages.length * 0.8;
      const isKey = PRIORITY_PATTERNS.some(pattern => pattern.test(msg.content));

      if (msg.role === 'system') {
        system.push(msg);
      } else if (isKey) {
        keyContent.push(msg);
      } else if (isRecent) {
        recent.push(msg);
      } else {
        summarizable.push(msg);
      }
    });

    // Sort recent messages by recency (most recent first)
    recent.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return { system, keyContent, recent, summarizable };
  }

  /**
   * Generate summary from summarizable messages
   */
  private generateSummary(messages: Message[]): string {
    if (messages.length === 0) return '';

    // Extract key sentences
    const sentences = messages
      .flatMap(m => m.content.split(/[。！？.!?]/))
      .filter(s => s.trim().length > 10)
      .slice(0, 20);

    // Create summary
    const summaryParts = sentences.slice(0, 10);
    return summaryParts.join('。') + '。';
  }

  /**
   * Get total tokens from composable (to-be-summarized) messages
   */
  private getComposableTokens(messages: Message[]): number {
    return messages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0);
  }

  /**
   * Get context threshold
   */
  getThreshold(): number {
    return this.CONTEXT_THRESHOLD;
  }
}

// Default instance
export const budgetContextCompressor = new BudgetContextCompressor();