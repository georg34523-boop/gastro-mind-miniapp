// pages/api/ads/ai-parse.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { headers, rows } = req.body || {};

    if (!Array.isArray(headers) || !Array.isArray(rows)) {
      return res.status(400).json({
        error: "Неверный формат данных. Нужны headers: string[] и rows: any[][].",
      });
    }

    // Делаем маленький превью таблицы, чтобы не слать в модель 5000 строк
    const previewRows = rows.slice(0, 80);

    const prompt = `
Ты — опытный медиабайер и аналитик рекламы. 
Тебе даются заголовки столбцов рекламной таблицы и несколько строк данных.

Твоя задача:

1) Определить, какие столбцы соответствуют этим сущностям (если нет — ставь null):
   - impressions — показы
   - clicks — клики
   - ctr — CTR
   - spend — рекламные расходы (в валюте, не в гривнах/рублях словом, а как число)
   - cost_per_click — цена клика
   - leads — количество лидов
   - cpl — цена лида
   - revenue — выручка/доход с рекламы
   - roas — ROAS

2) На основе всех доступных строк рассчитать агрегированные KPI:
   - impressions (сумма или среднее, как логичнее)
   - clicks
   - ctr (в процентах, округли до 1 знака)
   - spend (сумма, округли до 2 знаков)
   - cpc (цена клика, округли до 2 знаков)
   - leads
   - cpl (цена лида, если leads > 0, иначе 0)
   - revenue
   - roas (если есть revenue и spend > 0, иначе 0, округли до 2 знаков)

   Строки вроде "#DIV/0!", пустые значения, "грн.0,00" и т.п. нужно аккуратно чистить и 
   переводить в числа. Запятая — это десятичный разделитель. Знак "$" или "грн." — 
   просто убрать.

3) Сформировать КОРОТКИЙ текстовый анализ (analysis) на русском языке
   в стиле спокойного опытного медиабайера (без сленга).
   Формат анализа:
   - 3–6 пунктов
   - каждый пункт с тире в начале
   - описывай, что хорошо / плохо, какие тенденции видны
   - обязательно дай 2–3 практических рекомендации
   - не используй markdown, только обычный текст с переводами строки.

4) Верни строго такой JSON (json_object):

{
  "columnMap": {
    "impressions": "название столбца или null",
    "clicks": "...",
    "ctr": "...",
    "spend": "...",
    "cost_per_click": "...",
    "leads": "...",
    "cpl": "...",
    "revenue": "...",
    "roas": "..."
  },
  "kpi": {
    "impressions": number,
    "clicks": number,
    "ctr": number,
    "spend": number,
    "cpc": number,
    "leads": number,
    "cpl": number,
    "revenue": number,
    "roas": number
  },
  "analysis": "строка с несколькими строками текста"
}

Не добавляй никаких других полей.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            headers,
            rows: previewRows,
          }),
        },
      ],
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse error from OpenAI:", e, raw);
      return res.status(500).json({
        error: "Не удалось распарсить ответ AI.",
      });
    }

    // Подстрахуемся: если чего-то нет — докинем дефолты
    const safeKpi = {
      impressions: Number(parsed?.kpi?.impressions || 0),
      clicks: Number(parsed?.kpi?.clicks || 0),
      ctr: Number(parsed?.kpi?.ctr || 0),
      spend: Number(parsed?.kpi?.spend || 0),
      cpc: Number(parsed?.kpi?.cpc || 0),
      leads: Number(parsed?.kpi?.leads || 0),
      cpl: Number(parsed?.kpi?.cpl || 0),
      revenue: Number(parsed?.kpi?.revenue || 0),
      roas: Number(parsed?.kpi?.roas || 0),
    };

    const columnMap = parsed?.columnMap || {};
    const analysis = typeof parsed?.analysis === "string" ? parsed.analysis : "";

    return res.status(200).json({
      kpi: safeKpi,
      columnMap,
      analysis,
    });
  } catch (err) {
    console.error("AI parse error:", err);
    return res.status(500).json({
      error: "Ошибка на сервере AI-парсера.",
    });
  }
}
