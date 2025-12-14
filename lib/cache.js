// lib/cache.js

const cache = new Map();

/**
 * Получить данные из кэша
 */
export function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  const { data, expiresAt } = entry;

  if (Date.now() > expiresAt) {
    cache.delete(key);
    return null;
  }

  return data;
}

/**
 * Сохранить данные в кэш
 */
export function setCache(key, data, ttlMs) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Принудительно очистить кэш (на будущее)
 */
export function clearCache(key) {
  cache.delete(key);
}
