export const config = {
  runtime: "nodejs",
};

import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { table } = req.body;

    if (!table || !Array.isArray(table)) {
      return res.status(400).json({ error: "Нет данных таблицы" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Ты — аналитик рекламных данных ресторана.
Проанализируй таблицу и определи ключевые показатели:
- общие расходы
- количество кликов
- количество лидов
- цену лида
- какие кампании эффективны
Таблица: ${JSON.stringify(table)}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
    });

    const result = completion.choices[0].message.content;

    res.status(200).json({ ok: true, analysis: result });
  } catch (e) {
    console.error("AI parse error:", e);
    res.status(500).json({ error: "AI error", details: e.message });
  }
}
