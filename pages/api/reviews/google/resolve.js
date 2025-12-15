export default async function handler(req, res) {
  const { input } = req.query;
  if (!input) return res.status(400).json({ error: "input is required" });

  if (input.includes("maps.google") || input.includes("maps.app")) {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews/google/by-link?url=${encodeURIComponent(
        input
      )}`
    );
    const data = await r.json();
    return res.json(data);
  }

  const r = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/reviews/google/search?query=${encodeURIComponent(
      input
    )}`
  );
  const data = await r.json();
  res.json(data);
}
