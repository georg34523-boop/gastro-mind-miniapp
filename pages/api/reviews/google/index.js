import { getCache, setCache } from "../../../lib/cache";

export default async function handler(req, res) {
  const { placeId, refresh } = req.query;

  if (!placeId) {
    return res.status(400).json({ error: "placeId is required" });
  }

  const cacheKey = `google_reviews_${placeId}`;
  if (!refresh) {
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews&languageCode=en`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    const data = await response.json();

    const result = {
      success: true,
      place: {
        name: data.displayName?.text || "",
        rating: data.rating || null,
        totalReviews: data.userRatingCount || 0,
      },
      reviews:
        data.reviews?.map((r) => ({
          author: r.authorAttribution?.displayName,
          rating: r.rating,
          text: r.text?.text,
          publishTime: r.publishTime,
        })) || [],
    };

    setCache(cacheKey, result, 3600);

    res.json({ ...result, cached: false });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
}
