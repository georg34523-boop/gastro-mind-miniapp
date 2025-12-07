// pages/api/sheets.js

import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Не указана ссылка на таблицу" });
    }

    // ДЕКОДИРУЕМ URL (главное исправление)
    url = decodeURIComponent(url);

    // Извлекаем sheetId
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);

    if (!match || !match[1]) {
      return res.status(400).json({ error: "Неверная ссылка Google Таблицы" });
    }

    const sheetId = match[1];

    // Авторизация Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Получаем данные
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:ZZ",
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return res.status(200).json({ data: [], message: "Таблица пустая" });
    }

    // Преобразование в JSON-объекты
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
    console.error("Sheets API error:", error);
    return res.status(500).json({ error: error.message });
  }
}
