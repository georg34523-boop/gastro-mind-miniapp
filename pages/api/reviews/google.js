export default async function handler(req, res) {
  try {
    const placeId =
      req.method === "GET"
        ? req.query.placeId
        : req.body?.placeId;

    if (!placeId) {
      return res.status(400).json({
        error: "placeId is required",
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Google Maps API key not configured",
      });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&language=ru&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(500).json({
        error: data.status,
        details: data.error_message,
      });
    }

    const place = data.result;

    return res.status(200).json({
      success: true,
      name: place.name,
      rating: place.rating,
      totalReviews: place.user_ratings_total,
      reviews:
        place.reviews?.map((r) => ({
          author: r.author_name,
          rating: r.rating,
          text: r.text,
          time: r.time,
        })) || [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
}
