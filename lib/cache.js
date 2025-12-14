// lib/cache.js

const store = new Map();

/**
 * Сохраняем значение в кэш
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs - время жизни в мс
 */
export function setCache(key, value, ttlMs) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Получаем значение из кэша
 */
export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Принудительно удалить ключ
 */
export function deleteCache(key) {
  store.delete(key);
}
