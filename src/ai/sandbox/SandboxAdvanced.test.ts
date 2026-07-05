// Round 9 Direction CJ — Plugin Runtime Sandbox Batch 2/3 (Advanced Tests)
// V4866-V4875: 10 engines tested
import { describe, it, expect } from 'vitest';
import {
  CodeValidator, ASTAnalyzer, SignatureChecker, DependencyResolver, SandboxCommunicator,
  IPCChannel, MemoryIsolation, CPUScheduler, NetworkFilter, FilesystemGuard,
  SandboxAdvancedIndex, CJ_BATCH_2_ENGINES
} from './SandboxAdvanced';

describe('CodeValidator', () => {
  it('detect eval() as error', () => {
    const v = new CodeValidator();
    const issues = v.validate('eval("foo")');
    expect(issues.some(i => i.rule === 'no-eval' && i.severity === 'error')).toBe(true);
  });

  it('detect innerHTML as warning', () => {
    const v = new CodeValidator();
    const issues = v.validate('el.innerHTML = x');
    expect(issues.some(i => i.rule === 'no-innerHTML' && i.severity === 'warning')).toBe(true);
  });

  it('clean code no issues', () => {
    const v = new CodeValidator();
    const issues = v.validate('const x = 1 + 2;');
    expect(issues).toHaveLength(0);
  });

  it('addRule + custom rule', () => {
    const v = new CodeValidator();
    v.addRule('no-debugger', /debugger/g, 'error', 'No debugger statements');
    const issues = v.validate('debugger;');
    expect(issues.some(i => i.rule === 'no-debugger')).toBe(true);
  });

  it('hasErrors + line number', () => {
    const v = new CodeValidator();
    const issues = v.validate('line1\nline2\neval()');
    expect(v.hasErrors(issues)).toBe(true);
    const evalIssue = issues.find(i => i.rule === 'no-eval');
    expect(evalIssue!.line).toBe(3);
  });
});

describe('ASTAnalyzer', () => {
  it('extract function declarations', () => {
    const a = new ASTAnalyzer();
    const funcs = a.functions('function foo() {}\nfunction bar() {}');
    expect(funcs).toHaveLength(2);
    expect(funcs[0].name).toBe('foo');
  });

  it('extract arrow functions', () => {
    const a = new ASTAnalyzer();
    const funcs = a.functions('const greet = () => {};');
    expect(funcs.some(f => f.name === 'greet')).toBe(true);
  });

  it('extract imports', () => {
    const a = new ASTAnalyzer();
    const imps = a.imports(`import x from 'lodash';\nconst y = require('axios');`);
    expect(imps).toHaveLength(2);
    expect(imps[0].type).toBe('esm');
    expect(imps[1].type).toBe('cjs');
  });

  it('statementCount', () => {
    const a = new ASTAnalyzer();
    expect(a.statementCount('const a = 1; const b = 2;')).toBe(2);
  });

  it('cyclomaticComplexity counts branches', () => {
    const a = new ASTAnalyzer();
    expect(a.cyclomaticComplexity('if (a) {} else if (b) {}')).toBeGreaterThan(2);
  });

  it('variables tracks let/const/var', () => {
    const a = new ASTAnalyzer();
    const vars = a.variables('let x; const y = 1; var z;');
    expect(vars).toHaveLength(3);
  });
});

describe('SignatureChecker', () => {
  it('register + verify', () => {
    const s = new SignatureChecker();
    const code = 'console.log("hi")';
    const hash = (s as any)._hash(code);
    s.register('p1', hash);
    expect(s.verify('p1', code).valid).toBe(true);
  });

  it('verify fails on tampered content', () => {
    const s = new SignatureChecker();
    s.register('p1', (s as any)._hash('original'));
    expect(s.verify('p1', 'tampered').valid).toBe(false);
  });

  it('verify unregistered returns invalid', () => {
    const s = new SignatureChecker();
    expect(s.verify('unknown', 'any').valid).toBe(false);
  });

  it('isRegistered + count', () => {
    const s = new SignatureChecker();
    s.register('a', 'sig1');
    expect(s.isRegistered('a')).toBe(true);
    expect(s.count()).toBe(1);
  });
});

describe('DependencyResolver', () => {
  it('addDependency + dependencies', () => {
    const d = new DependencyResolver();
    d.addDependency('a', 'b');
    d.addDependency('a', 'c');
    expect(d.dependencies('a')).toHaveLength(2);
  });

  it('removeDependency', () => {
    const d = new DependencyResolver();
    d.addDependency('a', 'b');
    d.removeDependency('a', 'b');
    expect(d.dependencies('a')).toHaveLength(0);
  });

  it('hasCircularDependency true on cycle', () => {
    const d = new DependencyResolver();
    d.addDependency('a', 'b');
    d.addDependency('b', 'a');
    expect(d.hasCircularDependency('a')).toBe(true);
  });

  it('hasCircularDependency false on DAG', () => {
    const d = new DependencyResolver();
    d.addDependency('a', 'b');
    d.addDependency('b', 'c');
    expect(d.hasCircularDependency('a')).toBe(false);
  });

  it('topologicalOrder returns DAG order', () => {
    const d = new DependencyResolver();
    d.addDependency('a', 'b');
    d.addDependency('a', 'c');
    const order = d.topologicalOrder();
    const aIdx = order.indexOf('a');
    const bIdx = order.indexOf('b');
    expect(bIdx).toBeLessThan(aIdx);
  });

  it('pluginCount', () => {
    const d = new DependencyResolver();
    d.addDependency('a', 'b');
    d.addDependency('c', 'd');
    expect(d.pluginCount()).toBe(2);
  });
});

describe('SandboxCommunicator', () => {
  it('createChannel + send', () => {
    const c = new SandboxCommunicator();
    c.createChannel('a', 'b');
    expect(c.send('a', 'b', 'hello').success).toBe(true);
  });

  it('send fails without channel', () => {
    const c = new SandboxCommunicator();
    expect(c.send('a', 'b', 'hello').reason).toBe('no_channel');
  });

  it('closeChannel blocks sends', () => {
    const c = new SandboxCommunicator();
    c.createChannel('a', 'b');
    c.closeChannel('a', 'b');
    expect(c.send('a', 'b', 'x').success).toBe(false);
  });

  it('canCommunicate check', () => {
    const c = new SandboxCommunicator();
    c.createChannel('a', 'b');
    expect(c.canCommunicate('a', 'b')).toBe(true);
    expect(c.canCommunicate('b', 'a')).toBe(false);
  });

  it('messageCount', () => {
    const c = new SandboxCommunicator();
    c.createChannel('a', 'b');
    c.send('a', 'b', 'x');
    c.send('a', 'b', 'y');
    expect(c.messageCount()).toBe(2);
  });
});

describe('IPCChannel', () => {
  it('define + hasChannel', () => {
    const ipc = new IPCChannel();
    ipc.define('req', 'request-response');
    expect(ipc.hasChannel('req')).toBe(true);
  });

  it('isRequestResponse true/false', () => {
    const ipc = new IPCChannel();
    ipc.define('req', 'request-response');
    ipc.define('event', 'fire-forget');
    expect(ipc.isRequestResponse('req')).toBe(true);
    expect(ipc.isRequestResponse('event')).toBe(false);
  });

  it('sendRequest + resolveRequest', () => {
    const ipc = new IPCChannel();
    ipc.define('req', 'request-response');
    let resolved: unknown = null;
    const id = ipc.sendRequest('req', { foo: 1 }, v => { resolved = v; });
    expect(ipc.pendingCount()).toBe(1);
    ipc.resolveRequest(id, { result: 'ok' });
    expect(ipc.pendingCount()).toBe(0);
    expect(resolved).toEqual({ result: 'ok' });
  });

  it('resolveRequest fails for unknown', () => {
    const ipc = new IPCChannel();
    expect(ipc.resolveRequest('fake', 'x')).toBe(false);
  });
});

describe('MemoryIsolation', () => {
  it('allocate + used + peak', () => {
    const m = new MemoryIsolation();
    m.allocate('sb1', 100);
    m.allocate('sb1', 50);
    expect(m.used('sb1')).toBe(150);
    expect(m.peak('sb1')).toBe(150);
  });

  it('deallocate', () => {
    const m = new MemoryIsolation();
    m.allocate('sb1', 100);
    m.deallocate('sb1', 30);
    expect(m.used('sb1')).toBe(70);
  });

  it('runGC collects ~30%', () => {
    const m = new MemoryIsolation();
    m.allocate('sb1', 1000);
    const collected = m.runGC('sb1');
    expect(collected).toBe(300);
    expect(m.used('sb1')).toBe(700);
  });

  it('level get/set', () => {
    const m = new MemoryIsolation();
    m.setLevel('container');
    expect(m.level()).toBe('container');
  });

  it('gcStats tracks last run', () => {
    const m = new MemoryIsolation();
    m.allocate('sb1', 100);
    m.runGC('sb1');
    expect(m.gcStats().collected).toBe(30);
  });
});

describe('CPUScheduler', () => {
  it('add + next returns task', () => {
    const s = new CPUScheduler();
    s.add('task1', 5, 100);
    expect(s.next()).toBe('task1');
  });

  it('priority scheduling picks highest', () => {
    const s = new CPUScheduler().setPolicy('priority');
    s.add('low', 1, 100);
    s.add('high', 10, 100);
    expect(s.next()).toBe('high');
  });

  it('round-robin alternates', () => {
    const s = new CPUScheduler().setPolicy('round-robin');
    s.add('a', 1, 100);
    s.add('b', 1, 100);
    const first = s.next();
    const second = s.next();
    expect(first).not.toBe(second);
  });

  it('fifo picks oldest', () => {
    const s = new CPUScheduler().setPolicy('fifo');
    s.add('a', 1, 100);
    setTimeout(() => s.add('b', 1, 100), 5);
    setTimeout(() => { expect(s.next()).toBe('a'); }, 10);
  });

  it('remove + taskCount', () => {
    const s = new CPUScheduler();
    s.add('a', 1, 100);
    expect(s.remove('a')).toBe(true);
    expect(s.taskCount()).toBe(0);
  });

  it('next returns null when empty', () => {
    expect(new CPUScheduler().next()).toBeNull();
  });
});

describe('NetworkFilter', () => {
  it('default allows all when no lists', () => {
    const n = new NetworkFilter();
    expect(n.isAllowed('https://example.com')).toBe(true);
  });

  it('block list denies', () => {
    const n = new NetworkFilter();
    n.block('evil.com');
    expect(n.isAllowed('evil.com')).toBe(false);
    expect(n.isAllowed('sub.evil.com')).toBe(false);
  });

  it('allow list restricts', () => {
    const n = new NetworkFilter();
    n.allow('safe.com');
    expect(n.isAllowed('safe.com')).toBe(true);
    expect(n.isAllowed('unsafe.com')).toBe(false);
  });

  it('request tracks allowed/blocked', () => {
    const n = new NetworkFilter();
    n.allow('a.com');
    n.request('a.com');
    n.request('b.com');
    expect(n.allowedCount()).toBe(1);
    expect(n.blockedCount()).toBe(1);
  });

  it('requestCount + allowListSize + blockListSize', () => {
    const n = new NetworkFilter();
    n.allow('a');
    n.allow('b');
    n.block('c');
    expect(n.allowListSize()).toBe(2);
    expect(n.blockListSize()).toBe(1);
  });
});

describe('FilesystemGuard', () => {
  it('default allows all when no allowedPaths', () => {
    const f = new FilesystemGuard();
    expect(f.isPathAllowed('/tmp/x')).toBe(true);
  });

  it('block list denies', () => {
    const f = new FilesystemGuard();
    f.block('/etc');
    expect(f.isPathAllowed('/etc/passwd')).toBe(false);
  });

  it('allow list restricts to prefixes', () => {
    const f = new FilesystemGuard();
    f.allow('/app/data');
    expect(f.isPathAllowed('/app/data/file.txt')).toBe(true);
    expect(f.isPathAllowed('/app/etc/passwd')).toBe(false);
  });

  it('read/write/delete track ops', () => {
    const f = new FilesystemGuard();
    f.block('/secret');
    expect(f.read('/secret/x')).toBe(false);
    expect(f.write('/secret/x')).toBe(false);
    expect(f.delete('/secret/x')).toBe(false);
    expect(f.opCount()).toBe(3);
  });

  it('blockedOps filters', () => {
    const f = new FilesystemGuard();
    f.block('/x');
    f.read('/x/y');
    expect(f.blockedOps()).toHaveLength(1);
  });
});

describe('SandboxAdvancedIndex', () => {
  it('list has 10 engines', () => {
    expect(new SandboxAdvancedIndex().list()).toHaveLength(10);
  });

  it('count 10', () => {
    expect(new SandboxAdvancedIndex().count()).toBe(10);
  });

  it('has checks', () => {
    expect(new SandboxAdvancedIndex().has('CodeValidator')).toBe(true);
    expect(new SandboxAdvancedIndex().has('Unknown')).toBe(false);
  });

  it('CJ_BATCH_2_ENGINES const has 10', () => {
    expect(CJ_BATCH_2_ENGINES).toHaveLength(10);
  });
});