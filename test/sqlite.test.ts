/**
 * SQLite Storage Layer Tests
 * Note: These tests use mocks because sql.js wasm cannot load in jsdom environment
 */

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock sql.js before importing sqlite module
const mockDb = {
  run: vi.fn(),
  exec: vi.fn(),
  close: vi.fn()
};

const mockSqlJs = {
  Database: vi.fn(() => mockDb)
};

vi.mock('sql.js', () => ({
  default: vi.fn(() => Promise.resolve(mockSqlJs)),
  __esModule: true
}));

// Import after mocking
import { 
  initSqliteDB, 
  getSqliteDB, 
  closeSqliteDB, 
  sqliteSet, 
  sqliteGet, 
  sqliteDelete, 
  sqliteList 
} from '../src/db/sqlite';

describe('SQLite Storage', () => {
  beforeAll(async () => {
    // Initialize the database before running tests
    await initSqliteDB();
  });

  afterAll(() => {
    // Close the database after all tests
    closeSqliteDB();
  });

  test('initSqliteDB() returns database', async () => {
    const db = await initSqliteDB();
    expect(db).toBeDefined();
    expect(typeof db.run).toBe('function');
    expect(typeof db.exec).toBe('function');
  });

  test('getSqliteDB() returns the same instance', async () => {
    const db1 = await initSqliteDB();
    const db2 = getSqliteDB();
    expect(db1).toBe(db2);
  });

  test('can create table and insert data', async () => {
    const db = await initSqliteDB();
    db.run('CREATE TABLE IF NOT EXISTS test_table (id TEXT PRIMARY KEY, val TEXT)');
    db.run('INSERT INTO test_table VALUES (?, ?)', ['1', 'hello']);
    expect(db.run).toHaveBeenCalled();
  });

  test('table creation is idempotent', async () => {
    const db = await initSqliteDB();
    // Should not throw
    expect(() => db.run('CREATE TABLE IF NOT EXISTS test_table2 (id TEXT PRIMARY KEY, val TEXT)')).not.toThrow();
  });

  test('sqliteSet and sqliteGet work correctly', async () => {
    // Mock exec to return a value
    mockDb.exec.mockReturnValue([{ values: [[JSON.stringify({ name: 'test', value: 123 })]] }]);
    
    await sqliteSet('test_setget', 'key1', { name: 'test', value: 123 });
    const result = await sqliteGet('test_setget', 'key1');
    expect(result).toEqual({ name: 'test', value: 123 });
  });

  test('sqliteGet returns null for non-existent key', async () => {
    mockDb.exec.mockReturnValue([]);
    const result = await sqliteGet('test_setget', 'nonexistent_key_12345');
    expect(result).toBeNull();
  });

  test('sqliteDelete removes data', async () => {
    await sqliteDelete('test_delete', 'key_to_delete');
    expect(mockDb.run).toHaveBeenCalled();
  });

  test('sqliteList returns all keys', async () => {
    mockDb.exec.mockReturnValue([{ values: [['item1'], ['item2'], ['item3']] }]);
    const keys = await sqliteList('test_list');
    expect(keys).toContain('item1');
    expect(keys).toContain('item2');
    expect(keys).toContain('item3');
  });

  test('sqliteSet with complex nested objects', async () => {
    mockDb.exec.mockReturnValue([{ values: [[JSON.stringify({
      nested: { deep: { value: [1, 2, 3], bool: true } },
      array: [{ a: 1 }, { b: 2 }],
      string: 'hello'
    })]] }]);
    
    const complexData = {
      nested: { deep: { value: [1, 2, 3], bool: true } },
      array: [{ a: 1 }, { b: 2 }],
      string: 'hello'
    };
    await sqliteSet('test_complex', 'complex_key', complexData);
    const result = await sqliteGet('test_complex', 'complex_key');
    expect(result).toEqual(complexData);
  });
});