import { isBrowser, metaStore, ensureStoresReady, recordWriteTimestamp } from './db';

export const CURRENT_SCHEMA_VERSION = 2;
const SCHEMA_VERSION_KEY = 'flyleaf_db_schema_version';

export async function getStoredSchemaVersion() {
  if (!isBrowser) return CURRENT_SCHEMA_VERSION;
  try {
    const ver = localStorage.getItem(SCHEMA_VERSION_KEY);
    return ver ? Number(ver) : 1;
  } catch {
    return 1;
  }
}

export async function runStorageMigrations() {
  if (!isBrowser || !metaStore) return;
  await ensureStoresReady();

  const currentVer = await getStoredSchemaVersion();
  if (currentVer >= CURRENT_SCHEMA_VERSION) return;

  // Migration v1 -> v2: Ensure all books have integer progress (0-100) and string ids
  try {
    const keys = await metaStore.keys();
    for (const key of keys) {
      const book = await metaStore.getItem(key);
      if (!book) continue;
      let changed = false;
      const updated = { ...book };

      if (typeof updated.progress === 'number' && updated.progress > 0 && updated.progress <= 1) {
        updated.progress = Math.round(updated.progress * 100);
        updated.progressPercentage = updated.progress;
        changed = true;
      }
      if (!updated.id) {
        updated.id = String(key);
        changed = true;
      }

      if (changed) {
        await metaStore.setItem(String(key), updated);
      }
    }

    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
    recordWriteTimestamp();
  } catch (err) {
    console.warn('[Storage Migrations] Migration failed:', err);
  }
}
