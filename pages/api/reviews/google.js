import { getCache, setCache } from "@/lib/cache";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// 12 часов
const CACHE_TTL = 12 * 60 * 60 * 1000;

export default async function handler(req, res) {
  try {
    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({ error: "placeId is required" });
    }

    const cacheKey = `google_reviews:${placeId}`;

    // -----------------------------
    // 1️⃣ Проверяем кэш
    // -----------------------------
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }

    // -----------------------------
    // 2️⃣ Запрос в Google Places API (NEW)
    // -----------------------------
    const url =
      "https://places.googleapis.com/v1/places/" +
      placeId +
      "?fields=displayName,rating,userRatingCount,reviews" +
      "&languageCode=en";

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          "displayName,rating,userRatingCount,reviews.authorAttribution.displayName,reviews.rating,reviews.text.text,reviews.publishTime,reviews.languageCode",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Google API error",
        details: data,
      });
    }

    // -----------------------------
    // 3️⃣ Нормализация данных
    // -----------------------------
    const result = {
      success: true,
      place: {
        name: data.displayName?.text || "",
        rating: data.rating || null,
        totalReviews: data.userRatingCount || 0,
      },
      reviews: (data.reviews || []).map((r) => ({
        author: r.authorAttribution?.displayName || "Anonymous",
        rating: r.rating,
        text: r.text?.text || "",
        language: r.languageCode,
        publishTime: r.publishTime,
      })),
    };

    // -----------------------------
    // 4️⃣ Кладём в кэш
    // -----------------------------
    setCache(cacheKey, result, CACHE_TTL);

    return res.json({
      ...result,
      cached: false,
    });
  } catch (error) {
    console.error("Google reviews error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
