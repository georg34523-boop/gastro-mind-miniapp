import { getCache, setCache } from "../../../lib/cache";
export default async function handler(req, res) {
  const { placeId, refresh } = req.query;

  if (!placeId) {
    return res.status(400).json({ error: "placeId is required" });
  }

  const cacheKey = `google_reviews_${placeId}`;

  // если НЕ refresh — пробуем кэш
  if (!refresh) {
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }
  }

  // если refresh=1 — чистим кэш
  if (refresh === "1") {
    deleteCache(cacheKey);
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({
        error: data.error.message || "Google API error",
      });
    }

    const result = {
      success: true,
      place: {
        name: data.displayName?.text || "",
        rating: data.rating || null,
        totalReviews: data.userRatingCount || 0,
      },
      reviews:
        (data.reviews || []).map((r) => ({
          author: r.authorAttribution?.displayName || "",
          rating: r.rating,
          text: r.text?.text || "",
          publishTime: r.publishTime,
          language: r.text?.languageCode,
        })) || [],
    };

    // ⏱ TTL = 6 часов
    setCache(cacheKey, result, 6 * 60 * 60 * 1000);

    res.json({
      ...result,
      cached: false,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
}
