import { describe, it, expect } from 'vitest';
import { createGraphStreamState, publishGraphEvent, subscribeGraph, unsubscribeGraph, graphEventsForTopic, graphStreamSubCount, graphStreamHealth } from './GraphStream';

describe('V2186 GraphStream', () => {
  it('should create empty state', () => {
    const s = createGraphStreamState();
    expect(s.events).toEqual([]);
  });

  it('should publish event', () => {
    let s = createGraphStreamState();
    s = publishGraphEvent(s, 'topic1', { x: 1 });
    expect(s.events).toHaveLength(1);
  });

  it('should subscribe to topic', () => {
    let s = createGraphStreamState();
    s = subscribeGraph(s, 'sub1', 'topic1');
    expect(graphStreamSubCount(s)).toBe(1);
  });

  it('should deliver to matching subscribers', () => {
    let s = createGraphStreamState();
    s = subscribeGraph(s, 'sub1', 'topic1');
    s = publishGraphEvent(s, 'topic1', 'x');
    expect(s.delivered.get('sub1')).toBe(1);
  });

  it('should not deliver to non-matching topic', () => {
    let s = createGraphStreamState();
    s = subscribeGraph(s, 'sub1', 'topic1');
    s = publishGraphEvent(s, 'topic2', 'x');
    expect(s.delivered.get('sub1')).toBeUndefined();
  });

  it('should unsubscribe', () => {
    let s = createGraphStreamState();
    s = subscribeGraph(s, 'sub1', 'topic1');
    s = unsubscribeGraph(s, 'sub1');
    expect(graphStreamSubCount(s)).toBe(0);
  });

  it('should query by topic', () => {
    let s = createGraphStreamState();
    s = publishGraphEvent(s, 'a', 1);
    s = publishGraphEvent(s, 'b', 2);
    s = publishGraphEvent(s, 'a', 3);
    expect(graphEventsForTopic(s, 'a')).toHaveLength(2);
  });

  it('should compute health', () => {
    const s = createGraphStreamState();
    const h = graphStreamHealth(s);
    expect(h.health).toBe(0.5);
  });
});
