// pages/api/sheets.js
import { google } from "googleapis";

export default async function handler(req, res) {
  console.log("🔥 API /sheets STARTED");
  console.log("Query received:", req.query);

  try {
    let { url } = req.query;

    console.log("👉 RAW url param:", url);

    if (!url) {
      return res.status(400).json({
        error: "Не указана ссылка",
        example: "/api/sheets?url=https://docs.google.com/..."
      });
    }

    url = decodeURIComponent(url);
    console.log("👉 Decoded URL:", url);

    if (!url.includes("docs.google.com")) {
      return res.status(400).json({
        error: "Это не Google Таблица",
        urlReceived: url
      });
    }

    const match =
      url.match(/\/d\/([a-zA-Z0-9-_]+)/) ||
      url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) ||
      url.match(/id=([a-zA-Z0-9-_]+)/);

    console.log("👉 MATCH RESULT:", match);

    if (!match || !match[1]) {
      return res.status(400).json({
        error: "sheetId не найден",
        urlReceived: url
      });
    }

    const sheetId = match[1];
    console.log("✅ Extracted sheetId:", sheetId);

    // Авторизация
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    console.log("📡 Sending request to Google Sheets API...");

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:ZZ",
    });

    console.log("📥 Google Response received");

    const rows = response.data.values || [];
    console.log("📊 Rows count:", rows.length);

    if (!rows.length) {
      return res.status(200).json({ data: [], headers: [] });
    }

    const headers = rows[0];
    const items = rows.slice(1).map((r) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = r[i] || ""));
      return obj;
    });

    return res.status(200).json({
      success: true,
      headers,
      rows: items,
    });

  } catch (error) {
    console.error("❌ FULL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
