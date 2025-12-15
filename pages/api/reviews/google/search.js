import { getCache, setCache } from "../../../../lib/cache";

export default async function handler(req, res) {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "query is required" });

  const cacheKey = `google_search_${query}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "en",
          regionCode: "DE",
        }),
      }
    );

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return res.json({ status: "not_found" });
    }

    if (data.places.length === 1) {
      return res.json({
        status: "resolved",
        placeId: data.places[0].id,
      });
    }

    const result = {
      status: "select",
      places: data.places.map((p) => ({
        placeId: p.id,
        name: p.displayName?.text,
        address: p.formattedAddress,
        rating: p.rating,
        totalReviews: p.userRatingCount,
      })),
    };

    setCache(cacheKey, result, 3600);
    res.json(result);
  } catch {
    res.status(500).json({ error: "Search failed" });
  }
}
