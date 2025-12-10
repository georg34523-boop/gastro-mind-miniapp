import { useState, useEffect } from "react";
import Link from "next/link";

/* -----------------------------------------------
   ПОИСК КОЛОНКИ С ДАТОЙ
-------------------------------------------------*/
function findDateColumn(headers = []) {
  const lower = headers.map((h) => String(h || "").toLowerCase());
  const idx = lower.findIndex(
    (h) =>
      h.includes("дата") ||
      h.includes("date") ||
      h.includes("day") ||
      h.includes("period") ||
      h.includes("період") ||
      h.includes("період") ||
      h.includes("time")
  );
  return idx === -1 ? -1 : idx;
}

/* -----------------------------------------------
   ПАРСИНГ ДАТЫ ИЗ ЯЧЕЙКИ ТАБЛИЦЫ
-------------------------------------------------*/
function parseSheetDate(value) {
  if (!value) return null;
  const s = String(value).trim();

  // yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso.map(Number);
    return new Date(y, m - 1, d);
  }

  // dd.mm.yy(yy), dd/mm/yy(yy), dd-mm-yy(yy)
  const dm = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (dm) {
    let [, d, m, y] = dm.map(Number);
    if (y < 100) y += 2000;
    return new Date(y, m - 1, d);
  }

  // На крайний случай
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

/* -----------------------------------------------
   ПАРСИНГ ДАТЫ ИЗ input type="date"
-------------------------------------------------*/
function parseInputDate(str) {
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  return new Date(y, mo - 1, d);
}

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("boot"); // boot | idle | loading | ok | error
  const [kpi, setKpi] = useState(null);
  const [columnMap, setColumnMap] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [sheetData, setSheetData] = useState(null);

  // Фильтр дат
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterCount, setFilterCount] = useState(null);

  /* -----------------------------------------------
     АВТО-ЗАГРУЗКА ТАБЛИЦЫ
  -------------------------------------------------*/
  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("ads_sheet_url")
          : null;

      if (saved) {
        setSheetUrl(saved);

        // Сразу грузим без мигания формы
        connectSheet(saved, true);
      } else {
        setStatus("idle");
      }
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  }, []);

  /* -----------------------------------------------
     GPT: ПАРСИНГ KPI
  -------------------------------------------------*/
  async function runAi(headers, rows, silent = false) {
    try {
      setStatus("loading");

      const res = await fetch("/api/ads/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers, rows }),
      });

      const json = await res.json();

      if (json.error) {
        if (!silent) alert(json.error);
        setStatus("error");
        return;
      }

      setKpi(json.kpi || {});
      setColumnMap(json.columnMap || {});
      setStatus("ok");
    } catch (err) {
      console.error(err);
      if (!silent) alert("Ошибка соединения");
      setStatus("error");
    }
  }

  /* -----------------------------------------------
     ПОДКЛЮЧЕНИЕ ТАБЛИЦЫ
  -------------------------------------------------*/
  async function connectSheet(forcedUrl = null, silent = false) {
    const url = forcedUrl || sheetUrl;

    if (!url.includes("docs.google.com")) {
      if (!silent) alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(
        "/api/sheets?url=" + encodeURIComponent(url)
      );
      const json = await res.json();

      if (json.error) {
        if (!silent) alert(json.error);
        setStatus("error");
        return;
      }

      const headers = json.headers || [];
      const rows = json.rows || [];

      setSheetData({ headers, rows });

      setDateFrom("");
      setDateTo("");
      setFilterCount(null);

      await runAi(headers, rows, silent);

      if (typeof window !== "undefined") {
        localStorage.setItem("ads_sheet_url", url);
      }
    } catch (e) {
      console.error(e);
      if (!silent) alert("Ошибка соединения");
      setStatus("error");
    }
  }

  /* -----------------------------------------------
     ПРИМЕНИТЬ ФИЛЬТР ДАТ
  -------------------------------------------------*/
  async function applyDateFilter() {
    if (!sheetData) return;

    const { headers, rows } = sheetData;

    if (!dateFrom && !dateTo) {
      setFilterCount(null);
      await runAi(headers, rows);
      return;
    }

    const dateIdx = findDateColumn(headers);
    if (dateIdx === -1) {
      alert("Не удалось определить колонку даты");
      return;
    }

    const from = parseInputDate(dateFrom);
    const to = parseInputDate(dateTo);

    const fromMs = from ? from.setHours(0, 0, 0, 0) : null;
    const toMs = to ? to.setHours(23, 59, 59, 999) : null;

    const filtered = rows.filter((row) => {
      const d = parseSheetDate(row[dateIdx]);
      if (!d) return false;
      const t = d.setHours(0, 0, 0, 0);
      if (fromMs && t < fromMs) return false;
      if (toMs && t > toMs) return false;
      return true;
    });

    setFilterCount(filtered.length);

    if (filtered.length === 0) {
      setKpi({
        impressions: 0,
        clicks: 0,
        ctr: 0,
        spend: 0,
        cpc: 0,
        leads: 0,
        cpl: 0,
        revenue: 0,
        roas: 0,
      });
      setStatus("ok");
      return;
    }

    await runAi(headers, filtered);
  }

  /* -----------------------------------------------
     УДАЛИТЬ ТАБЛИЦУ
  -------------------------------------------------*/
  function removeSheet() {
    try {
      localStorage.removeItem("ads_sheet_url");
    } catch (e) {}
    setSheetUrl("");
    setSheetData(null);
    setKpi(null);
    setColumnMap(null);
    setDateFrom("");
    setDateTo("");
    setFilterCount(null);
    setStatus("idle");
  }

  /* -----------------------------------------------
     UI
  -------------------------------------------------*/
  return (
    <div className="page-container">
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
              fontSize: 26,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ⋮
          </button>
        )}
      </div>

      {/* Menu */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 20,
            background: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => {
              removeSheet();
              setMenuOpen(false);
            }}
            style={{
              display: "block",
              width: "100%",
              color: "#d11a2a",
              background: "none",
              border: "none",
              padding: "8px 0",
              textAlign: "left",
            }}
          >
            Удалить таблицу
          </button>

          <button
            onClick={() => {
              setStatus("idle");
              setMenuOpen(false);
            }}
            style={{
              display: "block",
              width: "100%",
              color: "#333",
              background: "none",
              border: "none",
              padding: "8px 0",
              textAlign: "left",
            }}
          >
            Изменить таблицу
          </button>
        </div>
      )}

      <h1 className="page-title">Реклама</h1>

      {/* Подключение таблицы */}
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

      {status === "loading" && <p className="loading-text">Загрузка…</p>}
      {status === "error" && (
        <p className="error-text">Ошибка при анализе данных</p>
      )}

      {/* Фильтр дат */}
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
              marginBottom: 8,
              color: "#4a4f7d",
              fontWeight: 500,
            }}
          >
            Период
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                flex: 1,
                minWidth: 130,
                padding: "8px 10px",
               .borderRadius: 10,
                border: "1px solid #d0d2f0",
              }}
            />
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
              }}
            />
            <button
              onClick={applyDateFilter}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: "#5a67d8",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Применить
            </button>
          </div>

          {filterCount !== null && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
              Строк в выборке: {filterCount}
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD */}
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

      {/* DEBUG */}
      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI нашёл такие столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
