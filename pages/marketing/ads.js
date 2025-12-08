import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [kpi, setKpi] = useState(null);
  const [columnMap, setColumnMap] = useState(null);

  // ============================
  // 1. Автозагрузка сохранённой таблицы
  // ============================
  useEffect(() => {
    const saved = localStorage.getItem("ads_sheet_url");
    if (saved) {
      setSheetUrl(saved);
      connectSheet(saved, true); // авто режим
    }
  }, []);

  // ============================
  // 2. Подключение таблицы
  // ============================
  async function connectSheet(forcedUrl = null, silent = false) {
    const url = forcedUrl || sheetUrl;

    if (!url.includes("docs.google.com")) {
      if (!silent) alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    setStatus("loading");

    try {
      // --- 1. Загружаем таблицу ---
      const resSheet = await fetch("/api/sheets?url=" + encodeURIComponent(url));
      const jsonSheet = await resSheet.json();

      if (jsonSheet.error) {
        if (!silent) alert(jsonSheet.error);
        setStatus("error");
        return;
      }

      // --- 2. Отправляем в GPT-парсер ---
      const resAI = await fetch("/api/ads/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: jsonSheet.headers,
          rows: jsonSheet.rows,
        }),
      });

      const jsonAI = await resAI.json();

      if (jsonAI.error) {
        if (!silent) alert(jsonAI.error);
        setStatus("error");
        return;
      }

      // Сохраняем в интерфейс
      setKpi(jsonAI.kpi);
      setColumnMap(jsonAI.columnMap);
      setStatus("ok");

      // ⚡ Сохранение таблицы в память устройства
      localStorage.setItem("ads_sheet_url", url);
    } catch (err) {
      console.error(err);
      if (!silent) alert("Ошибка соединения.");
      setStatus("error");
    }
  }

  // ============================
  // 3. Удаление таблицы
  // ============================
  function removeSheet() {
    localStorage.removeItem("ads_sheet_url");
    setSheetUrl("");
    setKpi(null);
    setColumnMap(null);
    setStatus("idle");
  }

  // ============================
  // UI
  // ============================
  return (
    <div className="page-container">
      <Link href="/marketing" className="back-link">← Назад</Link>

      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">Подключите таблицу — AI автоматически сделает анализ</p>

      {/* Инпут */}
      <div className="sheet-input-block">
        <input
          type="text"
          placeholder="Вставьте ссылку на Google Таблицу"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          className="sheet-input"
        />
        <button onClick={() => connectSheet()} className="sheet-button">
          Подключить
        </button>
      </div>

      {/* Кнопка удалить таблицу */}
      {sheetUrl && (
        <button
          onClick={removeSheet}
          style={{
            marginTop: "4px",
            background: "#e11d48",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "none",
            color: "white",
            fontSize: "14px",
          }}
        >
          Удалить таблицу
        </button>
      )}

      {status === "loading" && <p className="loading-text">Загрузка...</p>}
      {status === "error" && <p className="error-text">Ошибка при анализе</p>}

      {/* KPI DASHBOARD */}
      {status === "ok" && kpi && (
        <div className="kpi-grid">
          <div className="kpi-card"><div className="kpi-label">Показы</div><div className="kpi-value">{kpi.impressions}</div></div>
          <div className="kpi-card"><div className="kpi-label">Клики</div><div className="kpi-value">{kpi.clicks}</div></div>
          <div className="kpi-card"><div className="kpi-label">CTR</div><div className="kpi-value">{kpi.ctr}%</div></div>
          <div className="kpi-card"><div className="kpi-label">Расходы</div><div className="kpi-value">{kpi.spend} €</div></div>
          <div className="kpi-card"><div className="kpi-label">Цена клика</div><div className="kpi-value">{kpi.cpc} €</div></div>
          <div className="kpi-card"><div className="kpi-label">Лиды</div><div className="kpi-value">{kpi.leads}</div></div>
          <div className="kpi-card"><div className="kpi-label">CPL</div><div className="kpi-value">{kpi.cpl} €</div></div>
          <div className="kpi-card"><div className="kpi-label">Доход</div><div className="kpi-value">{kpi.revenue} €</div></div>
          <div className="kpi-card"><div className="kpi-label">ROAS</div><div className="kpi-value">{kpi.roas}x</div></div>
        </div>
      )}

      {/* AI column map */}
      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI нашёл такие столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
