// pages/api/ads/ai-parse.js

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { headers, rows } = req.body;

    if (!headers || !rows) {
      return res.status(400).json({ error: "Нет данных таблицы" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Формируем текст для GPT
    const prompt = `
Ты — аналитик рекламы. У тебя есть таблица (заголовки + строки).
Определи, какие столбцы относятся к:

- impressions (показы)
- clicks (клики)
- ctr
- spend (расходы)
- cost_per_click / cpc
- leads / conversions
- cpl
- revenue
- roas

Названия могут быть на РУССКОМ, УКРАИНСКОМ, АНГЛИЙСКОМ или вообще нестандартные.

ТВОЯ ЗАДАЧА:

1) Определи какие заголовки соответствуют этим параметрам  
2) Построй итоговые KPI по ВСЕМ данным (суммы, средние)
3) Верни ответ строго в JSON формате:

{
  "columnMap": {
    "impressions": "...",
    "clicks": "...",
    "ctr": "...",
    "spend": "...",
    "leads": "...",
    "revenue": "..."
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
  }
}

ОПРЕДЕЛЯЙ ТОЛЬКО ТО, ЧТО НАЙДЁШЬ. Если нет данных — ставь 0.

Вот таблица:
Заголовки: ${JSON.stringify(headers)}
Строки: ${JSON.stringify(rows.slice(0, 40))}
(показываем максимум 40 строк, чтобы не перегружать тебя)
`;

    const ai = await client.chat.completions.create({
      model: "gpt-4.1",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Ты эксперт по маркетинговой аналитике." },
        { role: "user", content: prompt },
      ],
    });

    const parsed = JSON.parse(ai.choices[0].message.content);

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("AI PARSE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
