// pages/api/sheets.js
import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { sheetUrl } = req.query;

    if (!sheetUrl) {
      return res.status(400).json({ error: "sheetUrl is required" });
    }

    // 1. Извлекаем ID таблицы из ссылки
    const match = sheetUrl.match(/\/d\/(.*)\/edit/);
    if (!match) {
      return res.status(400).json({ error: "Invalid sheet URL" });
    }

    const sheetId = match[1];

    // 2. Авторизация через сервисный аккаунт
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    // 3. Читаем данные первого листа
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:Z", // читаем первые 26 колонок
    });

    const rows = response.data.values || [];

    if (!rows.length) {
      return res.status(200).json({ rows: [] });
    }

    return res.status(200).json({ rows });
  } catch (err) {
    console.error("Sheets API Error:", err);
    return res.status(500).json({ error: "Failed to load sheet data" });
  }
}
