export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { placeId } = req.body;

  if (!placeId) {
    return res.status(400).json({ error: "placeId is required" });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,rating,userRatingCount,reviews&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({
        error: "Google API error",
        details: data.error,
      });
    }

    // Нормализуем отзывы
    const reviews =
      data.reviews?.map((r) => ({
        author: r.authorAttribution?.displayName || "Anonymous",
        rating: r.rating,
        text: r.text?.text || "",
        language: r.text?.languageCode || "unknown",
        time: r.publishTime,
      })) || [];

    return res.status(200).json({
      success: true,
      placeId,
      name: data.displayName?.text || "",
      rating: data.rating || null,
      totalReviews: data.userRatingCount || 0,
      reviews,
    });
  } catch (err) {
    console.error("Google Reviews error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
