const cache = new Map();

export function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expireAt) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

export function setCache(key, value, ttlSeconds = 3600) {
  cache.set(key, {
    value,
    expireAt: Date.now() + ttlSeconds * 1000,
  });
}
