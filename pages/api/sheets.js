// pages/api/sheets.js

import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Не указана ссылка на таблицу" });
    }

    // Проверяем что пользователь дал полный URL
    if (!url.includes("/d/")) {
      return res.status(400).json({ error: "Неверная ссылка Google Таблицы" });
    }

    // Извлекаем sheetId из URL
    const sheetId = url.split("/d/")[1].split("/")[0];

    if (!sheetId) {
      return res.status(400).json({ error: "Не удалось определить sheetId" });
    }

    // Авторизация Google API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Запрашиваем данные
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:ZZ",
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return res.status(200).json({ data: [], message: "Таблица пустая" });
    }

    // Превращаем массив → массив объектов
    const headers = rows[0];
    const items = rows.slice(1).map((row) => {
      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? "";
      });
      return obj;
    });

    return res.status(200).json({ data: items });

  } catch (error) {
    console.error("Sheets API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
