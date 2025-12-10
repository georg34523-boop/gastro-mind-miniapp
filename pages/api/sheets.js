// pages/api/sheets.js

import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Не указана ссылка на таблицу" });
    }

    url = decodeURIComponent(url);

    if (!url.includes("docs.google.com")) {
      return res.status(400).json({ error: "Это не ссылка Google Таблицы" });
    }

    // sheetId
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return res.status(400).json({ error: "Неверная ссылка Google Таблицы" });
    }

    const sheetId = match[1];

    // Google auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Read
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:ZZ",
    });

    const rows = response.data.values || [];

    if (!rows.length) {
      return res.status(200).json({ headers: [], rows: [] });
    }

    const headers = rows[0];

    // ОСНОВНОЕ: превращаем rawRows → массивы
    // Ты прислал объектами — значит где-то у тебя AI уже преобразовал
    // Но мы гарантируем массивы как формат по-умолчанию
    const cleanRows = rows.slice(1).map((row) => {
      // row может быть массивом или объектом
      if (Array.isArray(row)) return row;

      // если объект — конвертируем
      const newRow = headers.map((h) => row[h] ?? "");
      return newRow;
    });

    return res.status(200).json({
      success: true,
      headers,
      rows: cleanRows,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
