import { describe, it, expect } from 'vitest';
import { createMemoryStreamState, publish, subscribe, unsubscribe, eventsForTopic, subCount, deliveredCount, memoryStreamHealth } from './MemoryStream';

describe('V2157 MemoryStream', () => {
  it('should create empty state', () => {
    const s = createMemoryStreamState();
    expect(s.events).toEqual([]);
  });

  it('should publish event', () => {
    let s = createMemoryStreamState();
    s = publish(s, 'topic1', { x: 1 });
    expect(s.events).toHaveLength(1);
  });

  it('should subscribe to topic', () => {
    let s = createMemoryStreamState();
    s = subscribe(s, 'sub1', 'topic1', () => {});
    expect(subCount(s)).toBe(1);
  });

  it('should deliver events to matching subscribers', () => {
    let s = createMemoryStreamState();
    s = subscribe(s, 'sub1', 'topic1', () => {});
    s = publish(s, 'topic1', 'x');
    expect(deliveredCount(s, 'sub1')).toBe(1);
  });

  it('should not deliver to non-matching topic', () => {
    let s = createMemoryStreamState();
    s = subscribe(s, 'sub1', 'topic1', () => {});
    s = publish(s, 'topic2', 'x');
    expect(deliveredCount(s, 'sub1')).toBe(0);
  });

  it('should unsubscribe', () => {
    let s = createMemoryStreamState();
    s = subscribe(s, 'sub1', 'topic1', () => {});
    s = unsubscribe(s, 'sub1');
    expect(subCount(s)).toBe(0);
  });

  it('should query events by topic', () => {
    let s = createMemoryStreamState();
    s = publish(s, 'topic1', 'a');
    s = publish(s, 'topic2', 'b');
    s = publish(s, 'topic1', 'c');
    expect(eventsForTopic(s, 'topic1')).toHaveLength(2);
  });

  it('should compute health', () => {
    const s = createMemoryStreamState();
    const h = memoryStreamHealth(s);
    expect(h.health).toBe(0.5);
  });
});
