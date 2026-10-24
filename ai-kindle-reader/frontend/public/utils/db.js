/**
 * Universal browser-side bridge for dynamic import('/utils/db.js')
 * Delegates to the app's internal DB stores or directly to IndexedDB.
 */

async function getDbBridge() {
  for (let i = 0; i < 50; i++) {
    if (typeof window !== 'undefined' && window.__db) {
      return window.__db;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

export async function saveBook(meta, blob) {
  const bridge = await getDbBridge();
  if (bridge?.saveBook) {
    return bridge.saveBook(meta, blob);
  }

  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open('KindleAIReaderDB');
    openReq.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('books_meta')) db.createObjectStore('books_meta');
      if (!db.objectStoreNames.contains('books_blobs')) db.createObjectStore('books_blobs');
      if (!db.objectStoreNames.contains('reader_settings')) db.createObjectStore('reader_settings');
      if (!db.objectStoreNames.contains('reading_progress')) db.createObjectStore('reading_progress');
    };
    openReq.onsuccess = () => {
      const db = openReq.result;
      try {
        const tx = db.transaction(['books_meta', 'books_blobs'], 'readwrite');
        const id = (typeof meta === 'object' && meta ? meta.id : meta) || 'book-' + Date.now();
        const metaObj = typeof meta === 'object' && meta ? meta : { id, title: 'Flyleaf Test Book' };
        tx.objectStore('books_meta').put(metaObj, id);
        if (blob) tx.objectStore('books_blobs').put(blob, id);
        tx.oncomplete = () => resolve(id);
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    };
    openReq.onerror = () => reject(openReq.error);
  });
}

export async function getBookBlob(bookId) {
  const bridge = await getDbBridge();
  if (bridge?.getBookBlob) {
    return bridge.getBookBlob(bookId);
  }
  return new Promise((resolve) => {
    const openReq = indexedDB.open('KindleAIReaderDB');
    openReq.onsuccess = () => {
      const db = openReq.result;
      try {
        const tx = db.transaction(['books_blobs'], 'readonly');
        const req = tx.objectStore('books_blobs').get(String(bookId));
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    openReq.onerror = () => resolve(null);
  });
}

export async function getBookMeta(bookId) {
  const bridge = await getDbBridge();
  if (bridge?.getBookMeta) {
    return bridge.getBookMeta(bookId);
  }
  return new Promise((resolve) => {
    const openReq = indexedDB.open('KindleAIReaderDB');
    openReq.onsuccess = () => {
      const db = openReq.result;
      try {
        const tx = db.transaction(['books_meta'], 'readonly');
        const req = tx.objectStore('books_meta').get(String(bookId));
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    openReq.onerror = () => resolve(null);
  });
}

export async function saveReaderSettings(settings) {
  const bridge = await getDbBridge();
  if (bridge?.saveReaderSettings) {
    return bridge.saveReaderSettings(settings);
  }

  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open('KindleAIReaderDB');
    openReq.onsuccess = () => {
      const db = openReq.result;
      try {
        const tx = db.transaction(['reader_settings'], 'readwrite');
        tx.objectStore('reader_settings').put(settings, 'settings');
        tx.oncomplete = () => resolve(settings);
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    };
    openReq.onerror = () => reject(openReq.error);
  });
}

export async function saveSettings(settings) {
  const bridge = await getDbBridge();
  if (bridge?.saveSettings) {
    return bridge.saveSettings(settings);
  }
  return saveReaderSettings(settings);
}

export async function getSettings() {
  const bridge = await getDbBridge();
  if (bridge?.getSettings) {
    return bridge.getSettings();
  }
  return null;
}

export async function saveReadingLocation(bookId, cfiString, percentage, chapterTitle, currentPage, totalPages) {
  const bridge = await getDbBridge();
  if (bridge?.saveReadingLocation) {
    return bridge.saveReadingLocation(bookId, cfiString, percentage, chapterTitle, currentPage, totalPages);
  }

  return new Promise((resolve) => {
    const openReq = indexedDB.open('KindleAIReaderDB');
    openReq.onsuccess = () => {
      const db = openReq.result;
      try {
        const tx = db.transaction(['reading_progress', 'books_meta'], 'readwrite');
        const loc = {
          bookId,
          cfi: cfiString || null,
          percentage: percentage || 0,
          chapter: chapterTitle || null,
          currentPage: currentPage || 1,
          totalPages: totalPages || 1,
          updatedAt: Date.now(),
        };
        tx.objectStore('reading_progress').put(loc, bookId);
        const metaStore = tx.objectStore('books_meta');
        const getMeta = metaStore.get(String(bookId));
        getMeta.onsuccess = () => {
          const meta = getMeta.result || { id: String(bookId) };
          meta.lastReadCfi = cfiString || meta.lastReadCfi || null;
          meta.currentPage = currentPage || meta.currentPage || 1;
          meta.totalPages = totalPages || meta.totalPages || 1;
          metaStore.put(meta, String(bookId));
        };
        tx.oncomplete = () => resolve(loc);
        tx.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    openReq.onerror = () => resolve(null);
  });
}

export async function getReadingLocation(bookId) {
  const bridge = await getDbBridge();
  if (bridge?.getReadingLocation) {
    return bridge.getReadingLocation(bookId);
  }

  return new Promise((resolve) => {
    const openReq = indexedDB.open('KindleAIReaderDB');
    openReq.onsuccess = () => {
      const db = openReq.result;
      try {
        const tx = db.transaction(['reading_progress'], 'readonly');
        const getReq = tx.objectStore('reading_progress').get(bookId);
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    openReq.onerror = () => resolve(null);
  });
}
