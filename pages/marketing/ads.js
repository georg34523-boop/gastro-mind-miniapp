import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdsPage() {
  // boot | idle | loading | error | ok
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("boot");
  const [kpi, setKpi] = useState(null);
  const [columnMap, setColumnMap] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // -----------------------------
  //  Загружаем сохранённую таблицу
  // -----------------------------
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined"
        ? localStorage.getItem("ads_sheet_url")
        : null;

      if (saved) {
        setSheetUrl(saved);
        // не показываем форму, сразу грузим
        connectSheet(saved, true);
      } else {
        setStatus("idle");
      }
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  }, []);

  // -----------------------------
  //  Подключение таблицы
  // -----------------------------
  async function connectSheet(forcedUrl = null, silent = false) {
    const url = forcedUrl || sheetUrl;

    if (!url.includes("docs.google.com")) {
      if (!silent) alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    setStatus("loading");

    try {
      // 1. Получаем таблицу
      const resSheet = await fetch("/api/sheets?url=" + encodeURIComponent(url));
      const jsonSheet = await resSheet.json();

      if (jsonSheet.error) {
        if (!silent) alert(jsonSheet.error);
        setStatus("error");
        return;
      }

      // 2. GPT разбирает таблицу
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

      setKpi(jsonAI.kpi);
      setColumnMap(jsonAI.columnMap);
      setStatus("ok");

      // Сохраняем URL
      localStorage.setItem("ads_sheet_url", url);
    } catch (err) {
      console.error(err);
      if (!silent) alert("Ошибка соединения");
      setStatus("error");
    }
  }

  // -----------------------------
  //  Удалить таблицу
  // -----------------------------
  function removeSheet() {
    try {
      localStorage.removeItem("ads_sheet_url");
    } catch (e) {
      console.error(e);
    }
    setSheetUrl("");
    setKpi(null);
    setColumnMap(null);
    setStatus("idle");
  }

  // =============================
  //  UI
  // =============================

  return (
    <div className="page-container">
      {/* Верхняя панель */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link href="/marketing" className="back-link">
          ← Назад
        </Link>

        {status === "ok" && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              marginRight: "4px",
            }}
          >
            ⋮
          </button>
        )}
      </div>

      {/* Меню справа */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            right: "20px",
            top: "70px",
            background: "white",
            padding: "12px 16px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => {
              setMenuOpen(false);
              removeSheet();
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 0",
              background: "none",
              border: "none",
              color: "#d11a2a",
              textAlign: "left",
              fontSize: "15px",
            }}
          >
            Удалить таблицу
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              setStatus("idle");
            }}
            style={{
              display: "block",
              width: "100%",
              padding: "10px 0",
              background: "none",
              border: "none",
              color: "#333",
              textAlign: "left",
              fontSize: "15px",
            }}
          >
            Изменить таблицу
          </button>
        </div>
      )}

      <h1 className="page-title">Реклама</h1>

      {/* Форма подключения показывается ТОЛЬКО когда реально idle */}
      {status === "idle" && (
        <>
          <p className="page-subtitle">
            Подключите таблицу — AI автоматически сделает анализ
          </p>

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
        </>
      )}

      {/* Состояния */}
      {status === "loading" && (
        <p className="loading-text">Загрузка данных...</p>
      )}
      {status === "error" && (
        <p className="error-text">Ошибка при анализе данных.</p>
      )}

      {/* DASHBOARD KPI */}
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

      {/* Отладочная инфа по мэппингу столбцов (можно позже спрятать) */}
      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI нашёл такие столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
