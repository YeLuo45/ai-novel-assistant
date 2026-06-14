import { describe, it, expect } from 'vitest';
import { createLoadBalancerState, addWorker, removeWorker, updateWorkerLoad, pickWorker, assignOp, totalLoad, loadBalancerHealth } from './OpLoadBalancer';

describe('V2220 OpLoadBalancer', () => {
  it('should create state', () => {
    const s = createLoadBalancerState();
    expect(s.workers.size).toBe(0);
  });

  it('should add worker', () => {
    let s = createLoadBalancerState();
    s = addWorker(s, 'w1');
    expect(s.workers.size).toBe(1);
  });

  it('should remove worker', () => {
    let s = createLoadBalancerState();
    s = addWorker(s, 'w1');
    s = removeWorker(s, 'w1');
    expect(s.workers.size).toBe(0);
  });

  it('should update load', () => {
    let s = createLoadBalancerState();
    s = addWorker(s, 'w1');
    s = updateWorkerLoad(s, 'w1', 50);
    expect(s.workers.get('w1')?.load).toBe(50);
  });

  it('should pick least-loaded', () => {
    let s = createLoadBalancerState('least_loaded');
    s = addWorker(s, 'w1', 100);
    s = addWorker(s, 'w2', 100);
    s = updateWorkerLoad(s, 'w1', 50);
    expect(pickWorker(s)).toBe('w2');
  });

  it('should return null for empty', () => {
    const s = createLoadBalancerState();
    expect(pickWorker(s)).toBe(null);
  });

  it('should assign op', () => {
    let s = createLoadBalancerState();
    s = addWorker(s, 'w1');
    const r = assignOp(s, 'op1');
    expect(r.worker).toBe('w1');
  });

  it('should compute total load', () => {
    let s = createLoadBalancerState();
    s = addWorker(s, 'w1');
    s = updateWorkerLoad(s, 'w1', 30);
    expect(totalLoad(s)).toBe(30);
  });

  it('should compute health', () => {
    let s = createLoadBalancerState();
    s = addWorker(s, 'w1');
    const h = loadBalancerHealth(s);
    expect(h.health).toBe(1);
  });
});
