// pages/api/sheets.js

import { google } from "googleapis";

export default async function handler(req, res) {
  console.log("📡 Sheets API called");

  try {
    let { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "Не указана ссылка на таблицу" });
    }

    url = decodeURIComponent(url);

    if (!url.includes("docs.google.com")) {
      return res.status(400).json({
        error: "Неверная ссылка Google Таблицы",
        urlReceived: url,
      });
    }

    // Получаем ID таблицы
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      return res.status(400).json({
        error: "Не удалось определить sheetId",
        urlReceived: url,
      });
    }

    const sheetId = match[1];

    // Авторизация Google API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Читаем ВСЮ таблицу A:ZZ
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:ZZ",
    });

    const rowsRaw = response.data.values || [];

    if (!rowsRaw || rowsRaw.length === 0) {
      return res.status(200).json({
        success: true,
        headers: [],
        rows: [],
        message: "Таблица пустая",
      });
    }

    // ---------------------------
    //  1) Нормализуем строки
    // ---------------------------

    // Удаляем пустые строки
    let rows = rowsRaw.filter((r) => Array.isArray(r) && r.length > 0);

    // Убираем полностью пустые (все значения пустые)
    rows = rows.filter((r) => r.some((cell) => String(cell || "").trim() !== ""));

    // Вытаскиваем хедеры
    const headers = rows[0] || [];

    // Убираем заголовок из rows
    const body = rows.slice(1);

    // Чистим строки — убираем строки без даты
    const clean = body.filter((row) => {
      if (!Array.isArray(row) || row.length === 0) return false;
      const first = String(row[0] || "").trim();

      // убираем строку "Загально"
      if (first.toLowerCase().includes("загально")) return false;

      // dd.mm.yy
      if (/^\d{2}\.\d{2}\.\d{2}$/.test(first)) return true;

      // dd.mm.yyyy
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(first)) return true;

      // yyyy-mm-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(first)) return true;

      return false;
    });

    return res.status(200).json({
      success: true,
      headers,
      rows: clean,
    });

  } catch (error) {
    console.error("🔥 Sheets API error:", error);
    return res.status(500).json({
      error: "Ошибка сервера: " + error.message,
    });
  }
}
