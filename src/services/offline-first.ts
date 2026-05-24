/**
 * Offline-First Service
 * Provides offline data storage with sync queue for online synchronization
 * Designed for use with SQLite storage layer
 */

import { sqliteSet, sqliteGet, sqliteDelete } from '../db/sqlite';

export type SyncItem = {
  key: string;
  data: any;
  timestamp: number;
};

export class OfflineFirstService {
  private _online: boolean = navigator.onLine;
  public syncQueue: SyncItem[] = [];

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this._online = true;
      this.sync();
    });
    window.addEventListener('offline', () => {
      this._online = false;
    });
  }

  /**
   * Check if currently online
   */
  get online(): boolean {
    return this._online;
  }

  /**
   * Save data to local storage and queue for sync if online
   */
  async save(key: string, data: any): Promise<void> {
    // Write to SQLite
    try {
      await sqliteSet('offline_queue', key, data);
    } catch (e) {
      console.warn('[OfflineFirst] SQLite save failed:', e);
    }

    // If online, add to sync queue for server sync
    if (this._online) {
      this.syncQueue.push({ key, data, timestamp: Date.now() });
    }
  }

  /**
   * Load data from local storage
   */
  async load(key: string): Promise<any | null> {
    try {
      return await sqliteGet('offline_queue', key);
    } catch (e) {
      console.warn('[OfflineFirst] SQLite load failed:', e);
      return null;
    }
  }

  /**
   * Delete data from local storage
   */
  async remove(key: string): Promise<void> {
    try {
      await sqliteDelete('offline_queue', key);
    } catch (e) {
      console.warn('[OfflineFirst] SQLite delete failed:', e);
    }

    // Remove from sync queue if present
    this.syncQueue = this.syncQueue.filter(item => item.key !== key);
  }

  /**
   * Force sync queued items to server
   */
  async sync(): Promise<void> {
    if (!navigator.onLine) {
      console.log('[OfflineFirst] Cannot sync: offline');
      return;
    }

    if (this.syncQueue.length === 0) {
      console.log('[OfflineFirst] No items to sync');
      return;
    }

    console.log('[OfflineFirst] Syncing', this.syncQueue.length, 'items');

    // TODO: Implement actual server sync here
    // For now, just log and clear the queue
    // In production, this would call a backend API

    this.syncQueue = [];
  }

  /**
   * Get the current sync queue length
   */
  getQueueLength(): number {
    return this.syncQueue.length;
  }

  /**
   * Clear the sync queue (use with caution)
   */
  clearQueue(): void {
    this.syncQueue = [];
  }
}

// Singleton instance for app-wide use
export const offlineService = new OfflineFirstService();