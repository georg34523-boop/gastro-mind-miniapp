// pages/api/sheets.js

import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    let { url } = req.query;

    console.log("RAW URL from client:", url);

    if (!url) {
      return res.status(400).json({ error: "Не указана ссылка на таблицу" });
    }

    // Декодируем URL
    url = decodeURIComponent(url);
    console.log("Decoded URL:", url);

    // Проверяем что это вообще google sheets
    if (!url.includes("docs.google.com")) {
      return res.status(400).json({ error: "Это не ссылка Google Таблицы", urlReceived: url });
    }

    // Ищем sheetId
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    console.log("MATCH RESULT:", match);

    if (!match || !match[1]) {
      return res.status(400).json({
        error: "Неверная ссылка Google Таблицы — sheetId не найден",
        urlReceived: url
      });
    }

    const sheetId = match[1];
    console.log("Extracted sheetId:", sheetId);

    // Авторизация Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:ZZ",
    });

    const rows = response.data.values || [];
    console.log("Rows length:", rows.length);

    if (rows.length === 0) {
      return res.status(200).json({ data: [], message: "Таблица пустая" });
    }

    const headers = rows[0];
    const items = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || "";
      });
      return obj;
    });

    return res.status(200).json({ data: items });

  } catch (error) {
    console.error("FULL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
