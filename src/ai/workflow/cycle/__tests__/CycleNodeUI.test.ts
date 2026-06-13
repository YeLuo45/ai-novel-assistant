import { describe, it, expect } from 'vitest';
import {
  classifyNodeKind,
  buildDescriptor,
  buildDescriptors,
  serializeDescriptors,
} from '../CycleNodeUI';

describe('CycleNodeUI - classifyNodeKind', () => {
  it('returns super when isSuper', () => {
    expect(classifyNodeKind(false, false, false, true, false)).toBe('super');
  });
  it('returns entry when isEntry', () => {
    expect(classifyNodeKind(false, true, false, false, false)).toBe('entry');
  });
  it('returns exit when isExit', () => {
    expect(classifyNodeKind(false, false, true, false, false)).toBe('exit');
  });
  it('returns cycle when isInCycle', () => {
    expect(classifyNodeKind(true, false, false, false, false)).toBe('cycle');
  });
  it('returns isolated when hasNoEdges', () => {
    expect(classifyNodeKind(false, false, false, false, true)).toBe('isolated');
  });
  it('returns normal otherwise', () => {
    expect(classifyNodeKind(false, false, false, false, false)).toBe('normal');
  });
});

describe('CycleNodeUI - buildDescriptor', () => {
  it('builds with explicit label', () => {
    const d = buildDescriptor({
      id: 'n1',
      label: 'Node 1',
      isInCycle: false,
      isEntry: true,
      isExit: false,
    });
    expect(d.id).toBe('n1');
    expect(d.label).toBe('Node 1');
    expect(d.kind).toBe('entry');
    expect(d.status).toBe('idle');
  });

  it('defaults label to id', () => {
    const d = buildDescriptor({
      id: 'n2',
      isInCycle: true,
      isEntry: false,
      isExit: false,
    });
    expect(d.label).toBe('n2');
  });

  it('includes progress when provided', () => {
    const d = buildDescriptor({
      id: 'n3',
      isInCycle: false,
      isEntry: false,
      isExit: false,
      progress: 0.5,
    });
    expect(d.progress).toBe(0.5);
  });
});

describe('CycleNodeUI - buildDescriptors', () => {
  it('maps a list of nodes', () => {
    const descs = buildDescriptors([
      { id: 'a', isInCycle: false, isEntry: true, isExit: false },
      { id: 'b', isInCycle: true, isEntry: false, isExit: false },
    ]);
    expect(descs.length).toBe(2);
    expect(descs[0].kind).toBe('entry');
    expect(descs[1].kind).toBe('cycle');
  });
});

describe('CycleNodeUI - serializeDescriptors', () => {
  it('produces JSON', () => {
    const s = serializeDescriptors([buildDescriptor({ id: 'x', isInCycle: false, isEntry: false, isExit: false })]);
    expect(JSON.parse(s)[0].id).toBe('x');
  });
});
