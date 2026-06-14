import { describe, it, expect } from 'vitest';
import { createContextEncoderState, encodeContext, getEncodedContext, contextCount, contextsByModality, contextEncoderHealth } from './ContextEncoder';

describe('V2266 ContextEncoder', () => {
  it('should create empty state', () => {
    const s = createContextEncoderState();
    expect(contextCount(s)).toBe(0);
  });

  it('should encode context', () => {
    const s = createContextEncoderState();
    const { ctx } = encodeContext(s, 'hello world', 'text');
    expect(ctx.hash).toHaveLength(8);
    expect(ctx.tokens).toBeGreaterThan(0);
  });

  it('should get encoded context', () => {
    const s = createContextEncoderState();
    const { ctx, state } = encodeContext(s, 'hello', 'text');
    expect(getEncodedContext(state, 'hello')?.hash).toBe(ctx.hash);
  });

  it('should return undefined for unknown', () => {
    const s = createContextEncoderState();
    expect(getEncodedContext(s, 'nope')).toBeUndefined();
  });

  it('should query by modality', () => {
    let s = createContextEncoderState();
    s = encodeContext(s, 'a', 'text').state;
    s = encodeContext(s, '{"x":1}', 'json').state;
    expect(contextsByModality(s, 'text')).toHaveLength(1);
  });

  it('should compute health', () => {
    let s = createContextEncoderState();
    s = encodeContext(s, 'a', 'text').state;
    const h = contextEncoderHealth(s);
    expect(h.health).toBe(1);
  });
});
