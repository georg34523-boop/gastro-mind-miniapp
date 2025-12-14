export default async function handler(req, res) {
  const { placeId } = req.query;

  if (!placeId) {
    return res.status(400).json({
      error: "PLACE_ID_REQUIRED",
      message: "Передай placeId в query параметре",
    });
  }

  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      error: "API_KEY_MISSING",
      message: "GOOGLE_MAPS_API_KEY не задан в env",
    });
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": API_KEY,
        // ЧЕТКО указываем что нам нужно
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        error: "GOOGLE_API_ERROR",
        details: data,
      });
    }

    // Нормализуем отзывы
    const reviews =
      data.reviews?.map((r) => ({
        author: r.authorAttribution?.displayName || "Anonymous",
        rating: r.rating || null,
        text: r.text?.text || "",
        language: r.text?.languageCode || null,
        publishTime: r.publishTime || null,
      })) || [];

    return res.status(200).json({
      success: true,
      place: {
        name: data.displayName?.text || null,
        rating: data.rating || null,
        totalReviews: data.userRatingCount || 0,
      },
      reviews,
    });
  } catch (error) {
    console.error("Google Reviews Error:", error);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Ошибка при получении отзывов",
    });
  }
}
