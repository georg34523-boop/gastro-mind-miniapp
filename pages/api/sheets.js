import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Не указана ссылка" });

    // Вытаскиваем sheetId из ссылки
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : null;

    if (!sheetId) return res.status(400).json({ error: "sheetId не найден" });

    // Авторизация Google Service Account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Читаем первый лист
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:Z" // колонок достаточно
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(200).json({ data: [], message: "Пустая таблица" });
    }

    return res.status(200).json({ data: rows });

  } catch (e) {
    console.error("Ошибка Google Sheets:", e);
    return res.status(500).json({ error: e.message });
  }
}
