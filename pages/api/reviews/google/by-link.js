// pages/api/reviews/google/by-link.js

import fetch from "node-fetch";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Разворачиваем короткие ссылки maps.app.goo.gl
 */
async function resolveRedirect(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    return res.url;
  } catch (e) {
    return url;
  }
}

/**
 * Получаем placeId через Places API (New)
 */
async function getPlaceIdFromText(text) {
  const endpoint =
    "https://places.googleapis.com/v1/places:searchText";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify({
      textQuery: text,
      maxResultCount: 1,
    }),
  });

  const json = await res.json();

  if (!json.places || !json.places.length) {
    return null;
  }

  return json.places[0].id;
}

export default async function handler(req, res) {
  try {
    const { url, refresh } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "URL parameter is required",
      });
    }

    // 1️⃣ разворачиваем короткую ссылку
    const fullUrl = await resolveRedirect(url);

    // 2️⃣ используем URL как текстовый запрос
    const placeId = await getPlaceIdFromText(fullUrl);

    if (!placeId) {
      return res.status(404).json({
        error: "Place not found by provided link",
      });
    }

    // 3️⃣ проксируем в основной API
    const targetUrl =
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews/google` +
      `?placeId=${placeId}` +
      (refresh ? "&refresh=1" : "");

    const reviewsRes = await fetch(targetUrl);
    const data = await reviewsRes.json();

    return res.status(200).json({
      success: true,
      placeId,
      source: "by-link",
      ...data,
    });
  } catch (error) {
    console.error("by-link error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
