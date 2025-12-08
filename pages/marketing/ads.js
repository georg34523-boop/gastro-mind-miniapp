import { useState } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [kpi, setKpi] = useState(null);
  const [columnMap, setColumnMap] = useState(null);
  const [aiInsights, setAiInsights] = useState(null); // 🤖 новый блок аналитики

  async function connectSheet() {
    if (!sheetUrl.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    setStatus("loading");
    setKpi(null);
    setColumnMap(null);
    setAiInsights(null);

    try {
      // 1️⃣ Тянем данные таблицы
      const sheetRes = await fetch("/api/sheets?url=" + encodeURIComponent(sheetUrl));
      const sheetJson = await sheetRes.json();

      if (sheetJson.error) {
        alert(sheetJson.error);
        setStatus("error");
        return;
      }

      // 2️⃣ Отправляем таблицу в AI-парсер
      const aiRes = await fetch("/api/ads/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: sheetJson.headers,
          rows: sheetJson.rows,
        }),
      });

      const aiJson = await aiRes.json();

      if (aiJson.error) {
        alert(aiJson.error);
        setStatus("error");
        return;
      }

      setKpi(aiJson.kpi);
      setColumnMap(aiJson.columnMap);

      // 3️⃣ AI-инсайты (вариант C — лёгкая версия)
      if (aiJson.summary) {
        setAiInsights(aiJson.summary);
      }

      setStatus("ok");
    } catch (e) {
      console.error(e);
      alert("Произошла ошибка.");
      setStatus("error");
    }
  }

  return (
    <div className="page-container ads-container">
      <Link href="/marketing" className="back-link">← Назад</Link>

      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">
        Подключите таблицу — AI автоматически сделает анализ
      </p>

      {/* URL input */}
      <div className="sheet-input-block">
        <input
          type="text"
          placeholder="Вставьте ссылку на Google Таблицу"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          className="sheet-input"
        />
        <button
          onClick={connectSheet}
          className="sheet-button"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Анализ..." : "Подключить"}
        </button>
      </div>

      {status === "loading" && <p className="loading-text">Загрузка...</p>}
      {status === "error" && <p className="error-text">Ошибка анализа данных.</p>}

      {/* KPI DASHBOARD */}
      {status === "ok" && kpi && (
        <div className="kpi-grid">
          <KpiCard label="Показы" value={kpi.impressions} />
          <KpiCard label="Клики" value={kpi.clicks} />
          <KpiCard label="CTR" value={kpi.ctr + "%"} />
          <KpiCard label="Расходы" value={kpi.spend + " €"} />
          <KpiCard label="Цена клика" value={kpi.cpc + " €"} />
          <KpiCard label="Лиды" value={kpi.leads} />
          <KpiCard label="CPL" value={kpi.cpl + " €"} />
          <KpiCard label="Доход" value={kpi.revenue + " €"} />
          <KpiCard label="ROAS" value={kpi.roas + "x"} />
        </div>
      )}

      {/* AI нашёл такие столбцы */}
      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI определил столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}

      {/* 🤖 БЛОК AI-АНАЛИТИКИ */}
      {status === "ok" && aiInsights && (
        <div className="ai-box">
          <h3 className="ai-title">AI-анализ кампании</h3>
          <p className="ai-text">{aiInsights}</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value ?? "—"}</div>
    </div>
  );
}
