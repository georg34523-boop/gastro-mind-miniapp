import { getCache, setCache } from "../../../../lib/cache";
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CACHE_TTL = 60 * 60 * 6; // 6 часов

/**
 * Раскрываем short-link (maps.app.goo.gl → google.com/maps/...)
 */
async function resolveGoogleMapsUrl(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });

    return res.url || url;
  } catch (e) {
    return url;
  }
}

/**
 * Получаем placeId через Text Search (Places API New)
 */
async function getPlaceIdFromUrl(finalUrl) {
  const match = finalUrl.match(/\/place\/([^/]+)/);
  if (!match) return null;

  const placeName = decodeURIComponent(match[1]).replace(/\+/g, " ");

  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        textQuery: placeName,
        maxResultCount: 1,
      }),
    }
  );

  const json = await res.json();
  return json.places?.[0] || null;
}

/**
 * Получаем отзывы
 */
async function getPlaceReviews(placeId) {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask":
          "displayName,rating,userRatingCount,reviews",
      },
    }
  );

  const json = await res.json();
  return json;
}

export default async function handler(req, res) {
  try {
    const { url, refresh } = req.query;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const cacheKey = `google_reviews_by_link_${url}`;

    if (!refresh) {
      const cached = getCache(cacheKey);
      if (cached) {
        return res.status(200).json({ ...cached, cached: true });
      }
    }

    // 1️⃣ раскрываем short-link
    const resolvedUrl = await resolveGoogleMapsUrl(url);

    // 2️⃣ получаем placeId
    const placeInfo = await getPlaceIdFromUrl(resolvedUrl);
    if (!placeInfo?.id) {
      return res
        .status(404)
        .json({ error: "Place not found by provided link" });
    }

    // 3️⃣ получаем отзывы
    const placeData = await getPlaceReviews(placeInfo.id);

    const result = {
      success: true,
      place: {
        id: placeInfo.id,
        name: placeData.displayName?.text || placeInfo.displayName?.text,
        rating: placeData.rating || null,
        totalReviews: placeData.userRatingCount || 0,
      },
      reviews:
        placeData.reviews?.map((r) => ({
          author: r.authorAttribution?.displayName || "Anonymous",
          rating: r.rating,
          text: r.text?.text || "",
          language: r.text?.languageCode || null,
          publishTime: r.publishTime,
        })) || [],
      cached: false,
    };

    // 4️⃣ кеш
    setCache(cacheKey, result, CACHE_TTL);

    res.status(200).json(result);
  } catch (e) {
    console.error("Google by-link error:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
