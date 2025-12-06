import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const url = req.query.url;

    if (!url) return res.status(400).json({ error: "No URL" });

    // Google Sheets CSV export
    const csvUrl = url.replace("/edit#gid=", "/export?format=csv&gid=");

    const response = await fetch(csvUrl);
    const csv = await response.text();

    res.status(200).json({ csv });
  } catch (e) {
    res.status(500).json({ error: "Fail", details: e.toString() });
  }
}
