import { getCache, setCache } from "../../../../lib/cache";

const CACHE_TTL = 10 * 60 * 1000;

/**
 * Загружаем страницу и берём ФИНАЛЬНЫЙ URL + HTML
 */
async function fetchFinalPage(url) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });

  const html = await res.text();

  return {
    finalUrl: res.url,
    html,
  };
}

/**
 * Достаём placeId из HTML
 */
function extractPlaceIdFromHtml(html) {
  const match =
    html.match(/"place_id":"(ChI[a-zA-Z0-9_-]+)"/) ||
    html.match(/(ChI[a-zA-Z0-9_-]{20,})/);

  return match ? match[1] : null;
}

export default async function handler(req, res) {
  try {
    const { url, refresh } = req.query;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const cacheKey = `google:by-link:${url}`;

    if (!refresh) {
      const cached = getCache(cacheKey);
      if (cached) {
        return res.status(200).json({ ...cached, cached: true });
      }
    }

    // 🔥 ШАГ 1 — загружаем страницу полностью
    const { finalUrl, html } = await fetchFinalPage(url);

    // 🔥 ШАГ 2 — вытаскиваем placeId
    const placeId = extractPlaceIdFromHtml(html);

    if (!placeId) {
      return res.status(404).json({
        error: "Place not found by provided link",
        debug: {
          originalUrl: url,
          finalUrl,
        },
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Google API key is not configured" });
    }

    const apiUrl = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews&key=${apiKey}`;
    const apiRes = await fetch(apiUrl);

    if (!apiRes.ok) {
      return res.status(500).json({
        error: "Google Places API error",
        details: await apiRes.text(),
      });
    }

    const data = await apiRes.json();

    const result = {
      success: true,
      place: {
        name: data.displayName?.text || null,
        rating: data.rating || null,
        totalReviews: data.userRatingCount || 0,
      },
      reviews: (data.reviews || []).map((r) => ({
        author: r.authorAttribution?.displayName || "Anonymous",
        rating: r.rating || null,
        text: r.text?.text || "",
        language: r.text?.languageCode || null,
        publishTime: r.publishTime || null,
      })),
    };

    setCache(cacheKey, result, CACHE_TTL);

    return res.status(200).json({ ...result, cached: false });
  } catch (e) {
    console.error("Google by-link error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
