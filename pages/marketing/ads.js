import { useState, useEffect } from "react";
import Link from "next/link";

function findDateColumn(headers = []) {
  const lower = headers.map((h) => String(h || "").toLowerCase());
  const idx = lower.findIndex(
    (h) => h.includes("дата") || h.includes("date")
  );
  return idx === -1 ? 0 : idx; // по умолчанию первый столбец
}

function parseSheetDate(value) {
  if (!value) return null;
  const s = String(value).trim();

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // dd.mm.yy или dd.mm.yyyy
  if (/^\d{2}\.\d{2}\.\d{2,4}$/.test(s)) {
    let [d, m, y] = s.split(".").map(Number);
    if (y < 100) y += 2000;
    return new Date(y, m - 1, d);
  }

  // fallback: Date умеет кое-как парсить строки
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export default function AdsPage() {
  // boot | idle | loading | error | ok
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("boot");
  const [kpi, setKpi] = useState(null);
  const [columnMap, setColumnMap] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // исходные данные таблицы целиком
  const [sheetData, setSheetData] = useState(null);

  // фильтр по датам
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterCount, setFilterCount] = useState(null);

  // -----------------------------
  //  Загружаем сохранённую таблицу
  // -----------------------------
  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("ads_sheet_url")
          : null;

      if (saved) {
        setSheetUrl(saved);
        // сразу грузим, без показа формы
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
  //  Универсальный вызов GPT-парсера
  // -----------------------------
  async function runAi(headers, rows, silent = false) {
    try {
      setStatus("loading");

      const resAI = await fetch("/api/ads/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, rows }),
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
    } catch (err) {
      console.error(err);
      if (!silent) alert("Ошибка соединения");
      setStatus("error");
    }
  }

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
      const resSheet = await fetch(
        "/api/sheets?url=" + encodeURIComponent(url)
      );
      const jsonSheet = await resSheet.json();

      if (jsonSheet.error) {
        if (!silent) alert(jsonSheet.error);
        setStatus("error");
        return;
      }

      // сохраняем полную таблицу в состоянии
      setSheetData({
        headers: jsonSheet.headers || [],
        rows: jsonSheet.rows || [],
      });

      // сбрасываем фильтр
      setDateFrom("");
      setDateTo("");
      setFilterCount(null);

      // считаем KPI по всей таблице
      await runAi(jsonSheet.headers, jsonSheet.rows, silent);

      // запоминаем URL
      localStorage.setItem("ads_sheet_url", url);
    } catch (err) {
      console.error(err);
      if (!silent) alert("Ошибка соединения");
      setStatus("error");
    }
  }

  // -----------------------------
  //  Применить фильтр по датам
  // -----------------------------
  async function applyDateFilter() {
    if (!sheetData) return;

    // если даты не заданы — считаем по всей таблице
    if (!dateFrom && !dateTo) {
      setFilterCount(null);
      await runAi(sheetData.headers, sheetData.rows);
      return;
    }

    const idx = findDateColumn(sheetData.headers);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const filteredRows = sheetData.rows.filter((row) => {
      const cell = row[idx];
      const d = parseSheetDate(cell);
      if (!d) return false;
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });

    setFilterCount(filteredRows.length);

    await runAi(sheetData.headers, filteredRows, false);
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
    setSheetData(null);
    setDateFrom("");
    setDateTo("");
    setFilterCount(null);
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
            onClick={() => setMenuOpen((v) => !v)}
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
      {status === "ok" && menuOpen && (
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

      {/* Форма подключения — только когда реально idle */}
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

      {/* Фильтр по датам — только когда есть данные */}
      {status === "ok" && sheetData && (
        <div
          style={{
            marginTop: 12,
            marginBottom: 8,
            padding: 12,
            borderRadius: 14,
            background: "#f1f2ff",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 8,
              color: "#4a4f7d",
            }}
          >
            Период
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                flex: 1,
                minWidth: 130,
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #d0d2f0",
                fontSize: 13,
              }}
            />
            <span style={{ fontSize: 13 }}>—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                flex: 1,
                minWidth: 130,
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #d0d2f0",
                fontSize: 13,
              }}
            />
            <button
              onClick={applyDateFilter}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "none",
                background: "#5a67d8",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Применить
            </button>
          </div>

          {filterCount !== null && (
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              Строк в выборке: {filterCount}
            </div>
          )}
        </div>
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

      {/* Отладочная инфа по мэппингу столбцов */}
      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI нашёл такие столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
