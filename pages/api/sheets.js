export const config = {
  runtime: "nodejs",
};

import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    const { sheetId, range } = req.query;

    if (!sheetId) {
      return res.status(400).json({ error: "Не указан sheetId" });
    }

    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range || "A1:Z1000",
    });

    return res.status(200).json({
      ok: true,
      data: response.data.values || [],
    });
  } catch (e) {
    console.error("Sheets API error:", e);
    res.status(500).json({ error: "Sheets API error", details: e.message });
  }
}
