// pages/api/sheets.js

import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { sheetId } = req.query;

    console.log("➡️ API CALLED WITH sheetId:", sheetId);

    if (!sheetId) {
      return res.status(400).json({
        error: "Не указан sheetId. Пример вызова: /api/sheets?sheetId=XXXXX"
      });
    }

    // Авторизация Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    console.log("📡 Запрашиваем данные из Google Sheets...");

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:ZZ",
    });

    const rows = response.data.values || [];
    console.log("📊 Получено строк:", rows.length);

    if (rows.length === 0) {
      return res.status(200).json({
        data: [],
        message: "Таблица пустая",
      });
    }

    // Преобразуем таблицу в объекты
    const headers = rows[0];
    const items = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });

    return res.status(200).json({
      success: true,
      headers,
      rows,
      items,
    });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
}
