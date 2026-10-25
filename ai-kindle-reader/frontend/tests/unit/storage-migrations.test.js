import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

let runStorageMigrations;
let CURRENT_SCHEMA_VERSION;
let getStoredSchemaVersion;
let metaStore;
let ensureStoresReady;

describe('lib/storage/migrations', () => {
  beforeAll(async () => {
    // Provide browser globals for localforage & localStorage in Node
    if (typeof global.window === 'undefined') {
      global.window = global;
    }
    const storageMap = new Map();
    global.localStorage = {
      getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
      setItem: (k, v) => storageMap.set(k, String(v)),
      removeItem: (k) => storageMap.delete(k),
      clear: () => storageMap.clear(),
    };

    const storage = await import('@/lib/storage');
    runStorageMigrations = storage.runStorageMigrations;
    CURRENT_SCHEMA_VERSION = storage.CURRENT_SCHEMA_VERSION;
    getStoredSchemaVersion = storage.getStoredSchemaVersion;
    metaStore = storage.metaStore;
    ensureStoresReady = storage.ensureStoresReady;
  });

  beforeEach(async () => {
    global.localStorage.clear();
    await ensureStoresReady();
    if (metaStore) {
      await metaStore.clear();
    }
  });

  it('reports default schema version 1 when localStorage has no version', async () => {
    global.localStorage.removeItem('flyleaf_db_schema_version');
    const ver = await getStoredSchemaVersion();
    expect(ver).toBe(1);
  });

  it('migrates v1 schema to v2 by normalizing fractional progress to percentage integers', async () => {
    global.localStorage.removeItem('flyleaf_db_schema_version');

    // Seed v1 format books with 0.45 and 0.82 fractional progress
    await metaStore.setItem('book-1', {
      title: 'Moby Dick',
      author: 'Herman Melville',
      progress: 0.45,
    });
    await metaStore.setItem('book-2', {
      title: 'Frankenstein',
      author: 'Mary Shelley',
      progress: 0.82,
    });

    await runStorageMigrations();

    const book1 = await metaStore.getItem('book-1');
    const book2 = await metaStore.getItem('book-2');

    expect(book1.progress).toBe(45);
    expect(book1.progressPercentage).toBe(45);
    expect(book1.id).toBe('book-1');

    expect(book2.progress).toBe(82);
    expect(book2.progressPercentage).toBe(82);
    expect(book2.id).toBe('book-2');

    const updatedVer = await getStoredSchemaVersion();
    expect(updatedVer).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('skips migration when already on CURRENT_SCHEMA_VERSION', async () => {
    global.localStorage.setItem('flyleaf_db_schema_version', String(CURRENT_SCHEMA_VERSION));

    await metaStore.setItem('book-3', {
      id: 'book-3',
      title: 'Clean Code',
      progress: 0.5,
    });

    await runStorageMigrations();

    const book3 = await metaStore.getItem('book-3');
    // Not migrated because schema was already marked as current
    expect(book3.progress).toBe(0.5);
  });
});
