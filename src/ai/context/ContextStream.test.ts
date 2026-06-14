import { describe, it, expect } from 'vitest';
import { createContextStreamState, publishContextEvent, subscribeContext, unsubscribeContext, contextEventsForTopic, contextStreamHealth } from './ContextStream';

describe('V2276 ContextStream', () => {
  it('should create empty state', () => {
    const s = createContextStreamState();
    expect(s.events).toEqual([]);
  });

  it('should publish event', () => {
    let s = createContextStreamState();
    s = publishContextEvent(s, 'ctx.add', 'k1');
    expect(s.events).toHaveLength(1);
  });

  it('should subscribe', () => {
    let s = createContextStreamState();
    s = subscribeContext(s, 'sub1', 'ctx.add');
    expect(s.subs.size).toBe(1);
  });

  it('should deliver to subs', () => {
    let s = createContextStreamState();
    s = subscribeContext(s, 'sub1', 'ctx.add');
    s = publishContextEvent(s, 'ctx.add', 'k1');
    expect(s.delivered.get('sub1')).toBe(1);
  });

  it('should unsubscribe', () => {
    let s = createContextStreamState();
    s = subscribeContext(s, 'sub1', 'ctx.add');
    s = unsubscribeContext(s, 'sub1');
    expect(s.subs.size).toBe(0);
  });

  it('should query by topic', () => {
    let s = createContextStreamState();
    s = publishContextEvent(s, 'ctx.add', 'k1');
    s = publishContextEvent(s, 'ctx.del', 'k2');
    expect(contextEventsForTopic(s, 'ctx.add')).toHaveLength(1);
  });

  it('should compute health', () => {
    const s = createContextStreamState();
    const h = contextStreamHealth(s);
    expect(h.health).toBe(0.5);
  });
});
