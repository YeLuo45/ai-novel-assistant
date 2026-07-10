// V5306-V5315: CY Performance Profiling 2.0 Core Batch 1/3
// DistributedTracer + MetricsExporter + LogAggregator + SpanCollector + TraceContext + ContextPropagator + SamplingStrategy + MetricsAggregator2 + AlertManager2

export class TraceContext {
  private _traceId: string;
  private _spanId: string;
  private _parentSpanId: string | null;

  constructor(traceId?: string, spanId?: string, parentSpanId: string | null = null) {
    this._traceId = traceId ?? `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this._spanId = spanId ?? `span-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this._parentSpanId = parentSpanId;
  }

  traceId(): string { return this._traceId; }
  spanId(): string { return this._spanId; }
  parentSpanId(): string | null { return this._parentSpanId; }

  setParent(parentSpanId: string): this {
    this._parentSpanId = parentSpanId;
    return this;
  }

  isRoot(): boolean {
    return this._parentSpanId === null;
  }

  toJSON(): Record<string, unknown> {
    return {
      traceId: this._traceId,
      spanId: this._spanId,
      parentSpanId: this._parentSpanId
    };
  }
}

export interface Span {
  name: string;
  context: TraceContext;
  startMs: number;
  endMs: number | null;
  tags: Record<string, string>;
}

export class DistributedTracer {
  private _spans: Span[] = [];

  startSpan(name: string, context: TraceContext, tags: Record<string, string> = {}): Span {
    const span: Span = {
      name,
      context,
      startMs: Date.now(),
      endMs: null,
      tags
    };
    this._spans.push(span);
    return span;
  }

  finishSpan(span: Span): void {
    span.endMs = Date.now();
  }

  spansByTrace(traceId: string): Span[] {
    return this._spans.filter(s => s.context.traceId() === traceId);
  }

  duration(span: Span): number {
    if (span.endMs === null) return 0;
    return span.endMs - span.startMs;
  }

  totalSpans(): number { return this._spans.length; }

  clear(): void { this._spans = []; }
}

export class MetricsExporter {
  private _metrics: Array<{ name: string; value: number; ts: number; tags: Record<string, string> }> = [];

  record(name: string, value: number, tags: Record<string, string> = {}): this {
    this._metrics.push({ name, value, ts: Date.now(), tags });
    return this;
  }

  export(): string {
    return JSON.stringify(this._metrics, null, 2);
  }

  exportCSV(): string {
    if (this._metrics.length === 0) return 'name,value,timestamp';
    const lines = ['name,value,timestamp'];
    for (const m of this._metrics) {
      lines.push(`${m.name},${m.value},${m.ts}`);
    }
    return lines.join('\n');
  }

  count(): number { return this._metrics.length; }

  byName(name: string): Array<{ name: string; value: number; ts: number }> {
    return this._metrics.filter(m => m.name === name);
  }

  clear(): void { this._metrics = []; }
}

export class LogAggregator {
  private _logs: Array<{ ts: number; level: 'info' | 'warn' | 'error' | 'debug'; message: string; source: string }> = [];

  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, source = 'app'): this {
    this._logs.push({ ts: Date.now(), level, message, source });
    return this;
  }

  info(message: string, source?: string): this { return this.log('info', message, source); }
  warn(message: string, source?: string): this { return this.log('warn', message, source); }
  error(message: string, source?: string): this { return this.log('error', message, source); }
  debug(message: string, source?: string): this { return this.log('debug', message, source); }

  byLevel(level: 'info' | 'warn' | 'error' | 'debug'): Array<{ ts: number; level: string; message: string; source: string }> {
    return this._logs.filter(l => l.level === level);
  }

  bySource(source: string): Array<{ ts: number; level: string; message: string; source: string }> {
    return this._logs.filter(l => l.source === source);
  }

  count(): number { return this._logs.length; }

  logs(): Array<{ ts: number; level: string; message: string; source: string }> {
    return [...this._logs];
  }

  clear(): void { this._logs = []; }
}

export class SpanCollector {
  private _spans: Span[] = [];

  collect(span: Span): this {
    if (span.endMs !== null) this._spans.push(span);
    return this;
  }

  spans(): Span[] { return [...this._spans]; }

  slowSpans(thresholdMs: number): Span[] {
    return this._spans.filter(s => s.endMs !== null && (s.endMs - s.startMs) >= thresholdMs);
  }

  byName(name: string): Span[] {
    return this._spans.filter(s => s.name === name);
  }

  count(): number { return this._spans.length; }

  clear(): void { this._spans = []; }
}

export class ContextPropagator {
  private _contexts: Map<string, TraceContext> = new Map();

  inject(traceId: string, context: TraceContext): this {
    this._contexts.set(traceId, context);
    return this;
  }

  extract(traceId: string): TraceContext | null {
    return this._contexts.get(traceId) ?? null;
  }

  has(traceId: string): boolean {
    return this._contexts.has(traceId);
  }

  remove(traceId: string): boolean {
    return this._contexts.delete(traceId);
  }

  count(): number { return this._contexts.size; }
}

export class SamplingStrategy {
  // Sample 1 in N
  shouldSample(rate: number, seed: number): boolean {
    if (rate <= 0) return false;
    if (rate >= 1) return true;
    return seed % Math.max(1, Math.floor(1 / rate)) === 0;
  }

  // Always sample errors
  shouldKeepError(): boolean { return true; }

  // Tail-based sampling
  shouldKeepSlowRequest(durationMs: number, thresholdMs = 1000): boolean {
    return durationMs >= thresholdMs;
  }

  // Adaptive sampling based on QPS
  adaptiveRate(qps: number, maxQps = 10_000): number {
    if (qps <= 0) return 1.0;
    return Math.min(1.0, maxQps / qps);
  }
}

export class MetricsAggregator2 {
  private _values: Map<string, number[]> = new Map();

  record(name: string, value: number): this {
    let list = this._values.get(name);
    if (!list) { list = []; this._values.set(name, list); }
    list.push(value);
    return this;
  }

  sum(name: string): number {
    return (this._values.get(name) ?? []).reduce((a, b) => a + b, 0);
  }

  average(name: string): number {
    const list = this._values.get(name);
    return list && list.length > 0 ? list.reduce((a, b) => a + b, 0) / list.length : 0;
  }

  min(name: string): number {
    const list = this._values.get(name);
    return list && list.length > 0 ? Math.min(...list) : 0;
  }

  max(name: string): number {
    const list = this._values.get(name);
    return list && list.length > 0 ? Math.max(...list) : 0;
  }

  p95(name: string): number {
    const list = this._values.get(name);
    if (!list || list.length === 0) return 0;
    const sorted = [...list].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length))];
  }

  count(name: string): number {
    return this._values.get(name)?.length ?? 0;
  }

  names(): string[] {
    return [...this._values.keys()];
  }
}

export class AlertManager2 {
  private _alerts: Array<{ ts: number; level: 'info' | 'warning' | 'critical'; message: string; source: string; acknowledged: boolean }> = [];

  raise(level: 'info' | 'warning' | 'critical', message: string, source: string): void {
    this._alerts.push({ ts: Date.now(), level, message, source, acknowledged: false });
  }

  acknowledge(ts: number): boolean {
    const a = this._alerts.find(x => x.ts === ts);
    if (!a) return false;
    a.acknowledged = true;
    return true;
  }

  byLevel(level: 'info' | 'warning' | 'critical'): Array<{ ts: number; level: string; message: string; source: string; acknowledged: boolean }> {
    return this._alerts.filter(a => a.level === level);
  }

  unacknowledged(): Array<{ ts: number; level: string; message: string; source: string; acknowledged: boolean }> {
    return this._alerts.filter(a => !a.acknowledged);
  }

  count(): number { return this._alerts.length; }
  clear(): void { this._alerts = []; }
}

// V5315: APMCoreIndex
export const CY_BATCH_1_ENGINES = [
  'DistributedTracer', 'MetricsExporter', 'LogAggregator', 'SpanCollector', 'TraceContext',
  'ContextPropagator', 'SamplingStrategy', 'MetricsAggregator2', 'AlertManager2', 'APMCoreIndex'
] as const;

export class APMCoreIndex {
  list(): string[] {
    return [...CY_BATCH_1_ENGINES];
  }

  count(): number {
    return CY_BATCH_1_ENGINES.length;
  }

  engines(): string[] {
    return this.list();
  }

  has(name: string): boolean {
    return CY_BATCH_1_ENGINES.includes(name as typeof CY_BATCH_1_ENGINES[number]);
  }
}