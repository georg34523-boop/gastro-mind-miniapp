import { getCache, setCache } from "../../../../lib/cache";

async function resolveRedirect(url) {
  const res = await fetch(url, { redirect: "follow" });
  return res.url;
}

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url is required" });

  const cacheKey = `google_by_link_${url}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const finalUrl = await resolveRedirect(url);

    // 1️⃣ пробуем вытащить placeId напрямую
    const placeIdMatch = finalUrl.match(/place\/[^/]+\/.*?place_id=([^&]+)/);
    if (placeIdMatch) {
      const result = {
        status: "resolved",
        placeId: placeIdMatch[1],
      };
      setCache(cacheKey, result);
      return res.json(result);
    }

    // 2️⃣ fallback — берём название + адрес
    const nameMatch = finalUrl.match(/\/place\/([^/]+)/);
    if (nameMatch) {
      const query = decodeURIComponent(nameMatch[1]).replace(/\+/g, " ");
      const result = {
        status: "need_search",
        query,
      };
      setCache(cacheKey, result);
      return res.json(result);
    }

    res.status(404).json({ error: "Place not found by provided link" });
  } catch {
    res.status(500).json({ error: "Failed to resolve link" });
  }
}
