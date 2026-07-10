// V5306-V5315: CY Performance Profiling 2.0 Core Batch 1/3 tests
import { describe, it, expect } from 'vitest';
import {
  TraceContext,
  DistributedTracer,
  MetricsExporter,
  LogAggregator,
  SpanCollector,
  ContextPropagator,
  SamplingStrategy,
  MetricsAggregator2,
  AlertManager2,
  APMCoreIndex,
  CY_BATCH_1_ENGINES
} from './APMCore';

describe('TraceContext + DistributedTracer + SpanCollector', () => {
  it('TraceContext traceId + spanId + parent + isRoot + toJSON + setParent', () => {
    const c = new TraceContext('t1', 's1');
    expect(c.traceId()).toBe('t1');
    expect(c.spanId()).toBe('s1');
    expect(c.parentSpanId()).toBeNull();
    expect(c.isRoot()).toBe(true);
    const c2 = new TraceContext('t1', 's2', 's1');
    expect(c2.isRoot()).toBe(false);
    c2.setParent('s3');
    expect(c2.parentSpanId()).toBe('s3');
    const json = c2.toJSON();
    expect(json.traceId).toBe('t1');
    expect(json.spanId).toBe('s2');
    expect(json.parentSpanId).toBe('s3');
  });

  it('DistributedTracer startSpan + finishSpan + duration + spansByTrace + total + clear', async () => {
    const t = new DistributedTracer();
    const ctx = new TraceContext('trace-1');
    const span = t.startSpan('op1', ctx, { tag: 'v' });
    expect(span.name).toBe('op1');
    // Test duration with unfinished span returns 0
    expect(t.duration(span)).toBe(0);
    await new Promise(r => setTimeout(r, 5));
    t.finishSpan(span);
    expect(t.duration(span)).toBeGreaterThan(0);
    expect(t.totalSpans()).toBe(1);
    expect(t.spansByTrace('trace-1').length).toBe(1);
    expect(t.spansByTrace('missing').length).toBe(0);
    t.clear();
    expect(t.totalSpans()).toBe(0);
  });

  it('SpanCollector collect + spans + slowSpans + byName + count + clear', () => {
    const s = new SpanCollector();
    const span1 = { name: 'op', context: new TraceContext(), startMs: Date.now(), endMs: Date.now() + 100, tags: {} };
    const span2 = { name: 'op', context: new TraceContext(), startMs: Date.now(), endMs: null, tags: {} };
    s.collect(span1); s.collect(span2); // span2 has endMs=null, won't be collected
    expect(s.count()).toBe(1);
    expect(s.slowSpans(50)).toEqual([span1]);
    expect(s.slowSpans(200)).toEqual([]);
    expect(s.byName('op')).toEqual([span1]);
    expect(s.byName('missing')).toEqual([]);
    s.clear();
    expect(s.count()).toBe(0);
  });
});

describe('MetricsExporter + LogAggregator + ContextPropagator', () => {
  it('MetricsExporter record + export + exportCSV + count + byName + clear', () => {
    const m = new MetricsExporter();
    m.record('cpu', 50).record('cpu', 60, { host: 'a' });
    expect(m.count()).toBe(2);
    expect(m.byName('cpu').length).toBe(2);
    expect(m.export()).toContain('cpu');
    // Empty CSV header
    m.clear();
    expect(m.exportCSV()).toBe('name,value,timestamp');
    m.record('mem', 100);
    expect(m.exportCSV()).toContain('name,value,timestamp');
    expect(m.exportCSV()).toContain('mem,100');
    m.clear();
    expect(m.count()).toBe(0);
  });

  it('LogAggregator log + info + warn + error + debug + byLevel + bySource + count + clear', () => {
    const l = new LogAggregator();
    l.info('msg1', 'core').warn('msg2', 'core').error('msg3').debug('msg4');
    expect(l.count()).toBe(4);
    expect(l.byLevel('error').length).toBe(1);
    expect(l.bySource('core').length).toBe(2);
    expect(l.logs()[0].message).toBe('msg1');
    l.clear();
    expect(l.count()).toBe(0);
  });

  it('ContextPropagator inject + extract + has + remove + count', () => {
    const c = new ContextPropagator();
    const ctx = new TraceContext('t1');
    c.inject('t1', ctx);
    expect(c.extract('t1')?.traceId()).toBe('t1');
    expect(c.has('t1')).toBe(true);
    expect(c.extract('missing')).toBeNull();
    expect(c.remove('t1')).toBe(true);
    expect(c.remove('missing')).toBe(false);
    expect(c.count()).toBe(0);
  });
});

describe('SamplingStrategy + MetricsAggregator2 + AlertManager2 + APMCoreIndex', () => {
  it('SamplingStrategy shouldSample + shouldKeepError + shouldKeepSlowRequest + adaptiveRate', () => {
    const s = new SamplingStrategy();
    expect(s.shouldSample(1.0, 0)).toBe(true);
    expect(s.shouldSample(0.0, 0)).toBe(false);
    expect(s.shouldSample(0.5, 0)).toBe(true); // 1/0.5 = 2, 0%2=0
    expect(s.shouldSample(0.5, 1)).toBe(false); // 1%2=1
    expect(s.shouldKeepError()).toBe(true);
    expect(s.shouldKeepSlowRequest(2000, 1000)).toBe(true);
    expect(s.shouldKeepSlowRequest(500, 1000)).toBe(false);
    expect(s.adaptiveRate(0)).toBe(1.0);
    expect(s.adaptiveRate(5000, 10000)).toBe(1.0);
    expect(s.adaptiveRate(20000, 10000)).toBe(0.5);
  });

  it('MetricsAggregator2 record + sum + average + min + max + p95 + count + names', () => {
    const m = new MetricsAggregator2();
    m.record('latency', 10).record('latency', 20).record('latency', 30);
    expect(m.sum('latency')).toBe(60);
    expect(m.average('latency')).toBe(20);
    expect(m.min('latency')).toBe(10);
    expect(m.max('latency')).toBe(30);
    expect(m.count('latency')).toBe(3);
    expect(m.p95('latency')).toBe(30);
    expect(m.names()).toEqual(['latency']);
    expect(m.sum('missing')).toBe(0);
    expect(m.average('missing')).toBe(0);
    expect(m.min('missing')).toBe(0);
    expect(m.max('missing')).toBe(0);
    expect(m.p95('missing')).toBe(0);
    expect(m.count('missing')).toBe(0);
  });

  it('AlertManager2 raise + acknowledge + byLevel + unacknowledged + count + clear', () => {
    const a = new AlertManager2();
    a.raise('warning', 'high cpu', 'host1');
    a.raise('critical', 'disk full', 'host1');
    expect(a.count()).toBe(2);
    expect(a.unacknowledged().length).toBe(2);
    expect(a.byLevel('warning').length).toBe(1);
    const ts = a.unacknowledged()[0].ts;
    expect(a.acknowledge(ts)).toBe(true);
    expect(a.unacknowledged().length).toBe(1);
    expect(a.acknowledge(99999)).toBe(false);
    a.clear();
    expect(a.count()).toBe(0);
  });

  it('APMCoreIndex', () => {
    expect(new APMCoreIndex().list()).toHaveLength(10);
    const idx = new APMCoreIndex();
    expect(idx.count()).toBe(10);
    expect(idx.engines()).toEqual(idx.list());
    expect(idx.has('DistributedTracer')).toBe(true);
    expect(idx.has('Missing')).toBe(false);
    expect(CY_BATCH_1_ENGINES).toHaveLength(10);
  });
});