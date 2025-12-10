import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Определяем индекс столбца с датой
 */
function findDateColumn(headers = []) {
  const lower = headers.map((h) => String(h || "").toLowerCase());
  return lower.findIndex(
    (h) =>
      h.includes("дата") ||
      h.includes("date") ||
      h.includes("day") ||
      h.includes("period") ||
      h.includes("период")
  );
}

/**
 * Парсим дату из ячейки таблицы
 *
 * Поддерживаем:
 * - 15.01.25
 * - 15.01.2025
 * - 15/1/2025
 * - 2025-01-15
 */
function parseSheetDate(value) {
  if (!value) return null;
  const s = String(value).trim();

  // yyyy-mm-dd / yyyy-m-d
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso.map(Number);
    return new Date(y, m - 1, d);
  }

  // dd.mm.yy(yy) / dd/mm/yy(yy) / dd-mm-yy(yy)
  const dmy = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy.map(Number);
    if (y < 100) y += 2000;
    return new Date(y, m - 1, d);
  }

  // fallback
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Парсим yyyy-mm-dd из input
 */
function parseInputDate(str) {
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  return new Date(y, mo - 1, d);
}

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("boot");
  const [kpi, setKpi] = useState(null);
  const [columnMap, setColumnMap] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [sheetData, setSheetData] = useState(null);

  // фильтр
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterCount, setFilterCount] = useState(null);

  // -----------------------------------------------------
  // Загружаем сохранённую таблицу
  // -----------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("ads_sheet_url");
    if (saved) {
      setSheetUrl(saved);
      connectSheet(saved, true);
    } else {
      setStatus("idle");
    }
  }, []);

  // -----------------------------------------------------
  // GPT анализ
  // -----------------------------------------------------
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

      setKpi(json.kpi);
      setColumnMap(json.columnMap);
      setStatus("ok");
    } catch (e) {
      console.error(e);
      if (!silent) alert("Ошибка соединения");
      setStatus("error");
    }
  }

  // -----------------------------------------------------
  // Подключение таблицы
  // -----------------------------------------------------
  async function connectSheet(forcedUrl = null, silent = false) {
    const url = forcedUrl || sheetUrl;

    if (!url.includes("docs.google.com")) {
      if (!silent) alert("Введите корректную ссылку");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/sheets?url=" + encodeURIComponent(url));
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

      localStorage.setItem("ads_sheet_url", url);
    } catch (e) {
      console.error(e);
      if (!silent) alert("Ошибка соединения");
      setStatus("error");
    }
  }

  // -----------------------------------------------------
  // ФИЛЬТР ПО ДАТАМ (исправленный)
  // -----------------------------------------------------
  async function applyDateFilter() {
    if (!sheetData) return;

    const { headers, rows } = sheetData;

    // если фильтр пустой — считаем весь период
    if (!dateFrom && !dateTo) {
      setFilterCount(null);
      await runAi(headers, rows);
      return;
    }

    const dateColIndex = findDateColumn(headers);
    if (dateColIndex === -1) {
      alert("Не удалось определить колонку даты");
      await runAi(headers, rows);
      return;
    }

    const from = parseInputDate(dateFrom);
    const to = parseInputDate(dateTo);

    const fromMs = from ? from.setHours(0,0,0,0) : null;
    const toMs   = to   ? to.setHours(23,59,59,999) : null;

    // FIX #1 — rows теперь массив массивов
    const filtered = rows.filter((r) => {
      const cell = r[dateColIndex];   // ✔ берём дату по индексу
      const d = parseSheetDate(cell); // ✔ корректно парсим
      if (!d) return false;

      const t = d.setHours(0,0,0,0);

      if (fromMs !== null && t < fromMs) return false;
      if (toMs   !== null && t > toMs) return false;

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

  // -----------------------------------------------------
  // Удалить таблицу
  // -----------------------------------------------------
  function removeSheet() {
    localStorage.removeItem("ads_sheet_url");
    setSheetUrl("");
    setKpi(null);
    setColumnMap(null);
    setSheetData(null);
    setDateFrom("");
    setDateTo("");
    setFilterCount(null);
    setStatus("idle");
  }

  // -----------------------------------------------------
  // UI (не изменял)
  // -----------------------------------------------------
  return (
    <div className="page-container">
      <div style={{ display:"flex", justifyContent:"space-between" }}>
        <Link href="/marketing" className="back-link">
          ← Назад
        </Link>

        {status === "ok" && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background:"none", border:"none", fontSize:24 }}
          >
            ⋮
          </button>
        )}
      </div>

      {menuOpen && (
        <div
          style={{
            position:"absolute",
            right:"20px",
            top:"70px",
            padding:"12px 16px",
            background:"white",
            borderRadius:"12px",
            boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
            zIndex:10,
          }}
        >
          <button
            onClick={() => { setMenuOpen(false); removeSheet(); }}
            style={{ color:"#d11a2a", padding:"10px 0", display:"block" }}
          >
            Удалить таблицу
          </button>

          <button
            onClick={() => { setMenuOpen(false); setStatus("idle"); }}
            style={{ padding:"10px 0", display:"block" }}
          >
            Изменить таблицу
          </button>
        </div>
      )}

      <h1 className="page-title">Реклама</h1>

      {status === "idle" && (
        <>
          <p className="page-subtitle">Подключите таблицу</p>
          <div className="sheet-input-block">
            <input
              type="text"
              placeholder="Вставьте ссылку"
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

      {status === "loading" && <p className="loading-text">Загрузка...</p>}
      {status === "error" && <p className="error-text">Ошибка</p>}

      {/* фильтр */}
      {status === "ok" && sheetData && (
        <div style={{ background:"#f1f2ff", padding:12, borderRadius:14 }}>
          <div style={{ fontSize:13, marginBottom:8 }}>Период</div>

          <div style={{ display:"flex", gap:8 }}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <button onClick={applyDateFilter}>Применить</button>
          </div>

          {filterCount !== null && (
            <div style={{ marginTop:6, fontSize:12 }}>
              Строк: {filterCount}
            </div>
          )}
        </div>
      )}

      {/* dashboard */}
      {status === "ok" && kpi && (
        <div className="kpi-grid">
          {/* ... KPI unchanged ... */}
        </div>
      )}

      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI нашёл столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
