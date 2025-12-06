import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { sheetUrl } = req.body;

    if (!sheetUrl) {
      return res.status(400).json({ error: "Не передана ссылка на таблицу" });
    }

    // 1) ПАРСИМ ID таблицы
    const match = sheetUrl.match(/\/d\/(.*?)\//);
    const sheetId = match?.[1];

    if (!sheetId) {
      return res.status(400).json({ error: "Неверная ссылка на таблицу" });
    }

    // 2) ПОДКЛЮЧАЕМ Google Sheets API
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows({ limit: 40 });

    if (!rows.length) {
      return res.json({ error: "Таблица пустая" });
    }

    // 3) ПРЕОБРАЗУЕМ в массив объектов
    const sample = rows.map((r) => r._rawData);

    const headers = sheet.headerValues;

    let csvSample = [headers, ...sample]
      .map((r) => r.join(","))
      .join("\n");

    // 4) GPT-4.1 — ОПРЕДЕЛЕНИЕ СМЫСЛА КОЛОНОК
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `
Ты — аналитик маркетинга. 
Тебе даётся таблица (фрагмент CSV). Определи, какие колонки означают:
- дата
- показы
- клики
- затраты
- конверсии
- выручка
- название кампании

Верни JSON строго в формате:
{
  "mapping": {
    "date": "...",
    "impressions": "...",
    "clicks": "...",
    "spend": "...",
    "conversions": "...",
    "revenue": "...",
    "campaign": "..."
  },
  "reasoning": "краткое описание, как ты определил колонки"
}

Если столбца нет — пиши null.
        `,
        },
        {
          role: "user",
          content: `Вот данные рекламной таблицы:\n\n${csvSample}`,
        },
      ],
      max_tokens: 500,
    });

    const mapping = JSON.parse(aiResponse.choices[0].message.content);

    // 5) ГОТОВЫЙ ОТВЕТ
    return res.status(200).json({
      success: true,
      mapping: mapping.mapping,
      reasoning: mapping.reasoning,
      preview: sample.slice(0, 10),
    });

  } catch (e) {
    console.error("AI Parse Error:", e);
    return res.status(500).json({ error: e.message });
  }
}
