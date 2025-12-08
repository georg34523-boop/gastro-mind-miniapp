import { useState } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [kpi, setKpi] = useState(null);
  const [columnMap, setColumnMap] = useState(null);

  async function connectSheet() {
    if (!sheetUrl.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    setStatus("loading");

    try {
      // 1️⃣ Тянем таблицу
      const sheetRes = await fetch("/api/sheets?url=" + encodeURIComponent(sheetUrl));
      const sheetJson = await sheetRes.json();

      if (sheetJson.error) {
        alert(sheetJson.error);
        setStatus("error");
        return;
      }

      // 2️⃣ Посылаем таблицу в GPT-парсер
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
      setStatus("ok");
    } catch (e) {
      console.error(e);
      setStatus("error");
      alert("Произошла ошибка.");
    }
  }

  return (
    <div className="page-container">
      <Link href="/marketing" className="back-link">← Назад</Link>

      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">Подключите таблицу — AI сделает анализ автоматически</p>

      {/* URL input */}
      <div className="sheet-input-block">
        <input
          type="text"
          placeholder="Вставьте ссылку на Google Таблицу"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          className="sheet-input"
        />
        <button onClick={connectSheet} className="sheet-button">
          Подключить
        </button>
      </div>

      {status === "loading" && <p className="loading-text">Загрузка данных...</p>}
      {status === "error" && <p className="error-text">Ошибка при анализе данных.</p>}

      {/* ДАШБОРД KPI */}
      {status === "ok" && kpi && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Показы</div>
            <div className="kpi-value">{kpi.impressions}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Клики</div>
            <div className="kpi-value">{kpi.clicks}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">CTR</div>
            <div className="kpi-value">{kpi.ctr}%</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Расходы</div>
            <div className="kpi-value">{kpi.spend} €</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Цена клика</div>
            <div className="kpi-value">{kpi.cpc} €</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Лиды</div>
            <div className="kpi-value">{kpi.leads}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">CPL</div>
            <div className="kpi-value">{kpi.cpl} €</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Доход</div>
            <div className="kpi-value">{kpi.revenue} €</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">ROAS</div>
            <div className="kpi-value">{kpi.roas}x</div>
          </div>
        </div>
      )}

      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI нашёл такие столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
