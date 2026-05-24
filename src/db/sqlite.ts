/**
 * SQLite Storage Layer using sql.js (WebAssembly)
 * Provides offline-first SQLite storage for projects, chapters, and materials
 */

import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  projectId: string;
  title: string;
  content: string;
  tags: string;
  createdAt: string;
}

/**
 * Initialize SQLite database with sql.js
 * Creates tables for projects, chapters, and materials if they don't exist
 */
export async function initSqliteDB(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    // Configure locateFile for sql.js wasm file
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`
  });

  db = new SQL.Database();

  // Projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Chapters table
  db.run(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      title TEXT DEFAULT '',
      content TEXT DEFAULT '',
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (projectId) REFERENCES projects(id)
    )
  `);

  // Materials table
  db.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      title TEXT DEFAULT '',
      content TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Offline queue table for sync
  db.run(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  return db;
}

/**
 * Get the current SQLite database instance
 */
export function getSqliteDB(): Database | null {
  return db;
}

/**
 * Close the SQLite database connection
 */
export function closeSqliteDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Set a value in a table (INSERT OR REPLACE)
 */
export async function sqliteSet(table: string, key: string, value: any): Promise<void> {
  const database = await initSqliteDB();
  const json = JSON.stringify(value);
  database.run(
    `INSERT OR REPLACE INTO ${table} (id, data, updatedAt) VALUES (?, ?, datetime('now'))`,
    [key, json]
  );
}

/**
 * Get a value from a table by key
 */
export async function sqliteGet(table: string, key: string): Promise<any | null> {
  const database = await initSqliteDB();
  const result = database.exec(
    `SELECT data FROM ${table} WHERE id = ?`,
    [key]
  );
  if (result.length === 0 || result[0].values.length === 0) return null;
  return JSON.parse(result[0].values[0][0] as string);
}

/**
 * Delete a value from a table by key
 */
export async function sqliteDelete(table: string, key: string): Promise<void> {
  const database = await initSqliteDB();
  database.run(`DELETE FROM ${table} WHERE id = ?`, [key]);
}

/**
 * List all keys in a table
 */
export async function sqliteList(table: string): Promise<string[]> {
  const database = await initSqliteDB();
  const result = database.exec(`SELECT id FROM ${table}`);
  if (result.length === 0) return [];
  return result[0].values.map(row => row[0] as string);
}