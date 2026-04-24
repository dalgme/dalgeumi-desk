import { set, get } from 'idb-keyval';

export async function saveCache<T>(key: string, data: T): Promise<void> {
  try {
    await set(key, data);
  } catch (e) {
    console.warn('cache save failed', key, e);
  }
}

export async function loadCache<T>(key: string): Promise<T | null> {
  try {
    const v = await get<T>(key);
    return v ?? null;
  } catch (e) {
    console.warn('cache load failed', key, e);
    return null;
  }
}

export const cacheKey = {
  sections: (userId: string) => `sections:${userId}`,
  bookmarks: (userId: string) => `bookmarks:${userId}`,
};
