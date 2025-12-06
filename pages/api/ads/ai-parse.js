import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { rows } = req.body;

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "No rows provided" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
Вот строки из рекламной таблицы:

${rows.map((r) => r.join(", ")).join("\n")}

Твоя задача — распознать данные о рекламе, даже если они:
- в разных колонках
- называются по-разному
- содержат числа в тексте

Найди и посчитай:
- Название кампании (если нет — создай краткое)
- Потрачено (spend)
- Показы (impressions)
- Клики (clicks)
- CTR (%)
- CPC
- Конверсии
- CPA

Верни строго JSON вида:

{
  "campaigns": [
    {
      "name": "",
      "spend": "",
      "impressions": "",
      "clicks": "",
      "ctr": "",
      "cpc": "",
      "conversions": "",
      "cpa": ""
    }
  ]
}

Без текста вокруг JSON.
`;

    const aiResponse = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let parsed;

    try {
      parsed = JSON.parse(aiResponse.choices[0].message.content);
    } catch (e) {
      return res.status(200).json({
        error: "AI returned non-JSON response",
        raw: aiResponse.choices[0].message.content,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("AI Parsing Error:", err);
    return res.status(500).json({ error: "AI parsing failed" });
  }
}
