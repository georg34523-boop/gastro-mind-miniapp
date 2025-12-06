export default async function handler(req, res) {
  try {
    const url = req.query.url;

    if (!url) {
      return res.status(400).json({ error: "No URL provided" });
    }

    // конвертация в CSV
    const csvUrl = url.replace("/edit#gid=", "/export?format=csv&gid=");

    const response = await fetch(csvUrl);
    const csv = await response.text();

    return res.status(200).json({ csv });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch Google Sheet",
      details: error.toString(),
    });
  }
}
