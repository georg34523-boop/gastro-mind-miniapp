// lib/cache.js

const store = new Map();

export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;

  const { value, expiresAt } = entry;

  if (Date.now() > expiresAt) {
    store.delete(key);
    return null;
  }

  return value;
}

export function setCache(key, value, ttlMs = 60 * 60 * 1000) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearCache(key) {
  store.delete(key);
}
