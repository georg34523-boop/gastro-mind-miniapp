// pages/marketing/ads.js

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "gastroMind_ads_sheet_url";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [errorMessage, setErrorMessage] = useState("");

  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnMap, setColumnMap] = useState(null);

  const [baseKpi, setBaseKpi] = useState(null);   // KPI по всей таблице
  const [kpi, setKpi] = useState(null);           // KPI с учётом фильтра дат

  const [dateColumnIndex, setDateColumnIndex] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showInput, setShowInput] = useState(false); // чтобы не мигал инпут при автоподключении

  // ---- 1. Восстанавливаем сохранённую таблицу при загрузке ----
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedUrl = window.localStorage.getItem(STORAGE_KEY);

    if (savedUrl) {
      setSheetUrl(savedUrl);
      // не показываем инпут, сразу пробуем подключиться «тихо»
      connectSheet(savedUrl, { silent: true });
    } else {
      setShowInput(true);
    }
  }, []);

  // ---- 2. Подключение таблицы ----
  async function connectSheet(urlOverride, options = {}) {
    const url = (urlOverride || sheetUrl || "").trim();

    if (!url) {
      alert("Вставьте ссылку на Google Таблицу");
      return;
    }
    if (!url.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    setErrorMessage("");
    if (!options.silent) setStatus("loading");

    try {
      // 2.1. Тянем таблицу из /api/sheets
      const sheetRes = await fetch("/api/sheets?url=" + encodeURIComponent(url));
      const sheetJson = await sheetRes.json();

      if (sheetJson.error) {
        throw new Error(sheetJson.error);
      }

      setHeaders(sheetJson.headers || []);
      setRows(sheetJson.rows || []);

      // 2.2. Отправляем часть данных в AI-парсер,
      //       чтобы он сказал, какой столбец — показы, клики, расходы и т.д.
      const aiRes = await fetch("/api/ads/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers: sheetJson.headers,
          rows: (sheetJson.rows || []).slice(0, 50), // достаточно сэмпла
        }),
      });

      const aiJson = await aiRes.json();
      if (aiJson.error) {
        throw new Error(aiJson.error);
      }

      const map = aiJson.columnMap || {};
      setColumnMap(map);

      // 2.3. Находим столбец даты (по названию)
      const dateIdx = detectDateColumnIndex(sheetJson.headers, map);
      setDateColumnIndex(dateIdx);

      // 2.4. Считаем базовые KPI по всей таблице
      const fullKpi = computeKpi(sheetJson.headers, sheetJson.rows, map, dateIdx, null, null);
      setBaseKpi(fullKpi);
      setKpi(fullKpi);

      setStatus("ok");
      setShowInput(false);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, url);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Ошибка при подключении таблицы");
    }
  }

  // ---- 3. Сброс таблицы ----
  function handleClearSheet() {
    setSheetUrl("");
    setStatus("idle");
    setErrorMessage("");

    setHeaders([]);
    setRows([]);
    setColumnMap(null);
    setBaseKpi(null);
    setKpi(null);

    setDateColumnIndex(null);
    setFromDate("");
    setToDate("");

    setShowInput(true);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  // ---- 4. Изменение фильтра по датам ----
  function handleDateChange(type, value) {
    if (type === "from") {
      setFromDate(value);
    } else {
      setToDate(value);
    }

    if (!rows.length || !columnMap || dateColumnIndex == null) {
      return;
    }

    const from = parseDate(type === "from" ? value : fromDate);
    const to = parseDate(type === "to" ? value : toDate);

    // если обе даты пустые — возвращаем базовый KPI
    if (!from && !to) {
      setKpi(baseKpi);
      return;
    }

    const filteredKpi = computeKpi(headers, rows, columnMap, dateColumnIndex, from, to);
    setKpi(filteredKpi);
  }

  const displayKpi = kpi || baseKpi || {
    impressions: 0,
    clicks: 0,
    ctr: 0,
    spend: 0,
    cpc: 0,
    leads: 0,
    cpl: 0,
    revenue: 0,
    roas: 0,
  };

  const hasDateFilter = dateColumnIndex !== null;

  // ---- RENDER ----
  return (
    <div className="page-container">
      <Link href="/marketing" className="back-link">
        ← Назад
      </Link>

      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">
        Подключите таблицу — AI автоматически сделает анализ
      </p>

      {/* Блок ввода URL только пока таблица не подключена */}
      {showInput && (
        <div className="sheet-input-block">
          <input
            type="text"
            placeholder="Вставьте ссылку на Google Таблицу"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            className="sheet-input"
          />
          <button
            onClick={() => connectSheet()}
            className="sheet-button"
          >
            Подключить
          </button>
        </div>
      )}

      {/* Кнопка удалить / привязать другую таблицу */}
      {status === "ok" && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={handleClearSheet}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              border: "none",
              background: "#e53e3e",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Удалить таблицу
          </button>
        </div>
      )}

      {/* Ошибка */}
      {status === "error" && (
        <p className="error-text">
          {errorMessage || "Ошибка при анализе данных."}
        </p>
      )}

      {status === "loading" && (
        <p className="loading-text">Загрузка и анализ данных…</p>
      )}

      {/* Фильтр по датам */}
      {status === "ok" && hasDateFilter && (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, opacity: 0.8 }}>Период:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleDateChange("from", e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #d0d0d0",
              fontSize: 13,
            }}
          />
          <span>—</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => handleDateChange("to", e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #d0d0d0",
              fontSize: 13,
            }}
          />
        </div>
      )}

      {/* KPI DASHBOARD */}
      {status === "ok" && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Показы</div>
            <div className="kpi-value">{displayKpi.impressions}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Клики</div>
            <div className="kpi-value">{displayKpi.clicks}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">CTR</div>
            <div className="kpi-value">{displayKpi.ctr.toFixed(1)}%</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Расходы</div>
            <div className="kpi-value">{displayKpi.spend.toFixed(2)} €</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Цена клика</div>
            <div className="kpi-value">{displayKpi.cpc.toFixed(2)} €</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Лиды</div>
            <div className="kpi-value">{displayKpi.leads}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">CPL</div>
            <div className="kpi-value">{displayKpi.cpl.toFixed(2)} €</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Доход</div>
            <div className="kpi-value">{displayKpi.revenue.toFixed(2)} €</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">ROAS</div>
            <div className="kpi-value">{displayKpi.roas.toFixed(2)}x</div>
          </div>
        </div>
      )}

      {/* Отладочная подсказка — какие столбцы нашёл AI */}
      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI нашёл такие столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/* ============================
   HELPERS
   ============================ */

// попытка найти столбец даты по названию
function detectDateColumnIndex(headers = [], columnMap = {}) {
  // если AI вдруг вернул date
  if (columnMap.date) {
    const target = String(columnMap.date).toLowerCase().trim();
    const idx = headers.findIndex(
      (h) => String(h || "").toLowerCase().trim() === target
    );
    if (idx !== -1) return idx;
  }

  const candidates = [
    "date",
    "дата",
    "дата отчета",
    "дата отчёта",
    "report date",
    "day",
    "день",
    "period",
    "период",
  ];

  const norm = headers.map((h) => String(h || "").toLowerCase().trim());

  for (let i = 0; i < norm.length; i++) {
    const h = norm[i];
    if (!h) continue;
    if (candidates.some((w) => h.includes(w))) {
      return i;
    }
  }

  return null;
}

// парсим любую адекватную дату в объект Date
function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  let str = String(value).trim();

  // ISO / yyyy-mm-dd / yyyy-mm-ddTHH:MM
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // форматы dd.mm.yy(yy), dd/mm/yy(yy), dd-mm-yy(yy)
  const m2 = str.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (m2) {
    let [, d, m, y] = m2;
    let yearNum = Number(y);
    if (y.length === 2) {
      // 00–49 → 2000–2049, 50–99 → 1950–1999
      yearNum = yearNum < 50 ? 2000 + yearNum : 1900 + yearNum;
    }
    return new Date(yearNum, Number(m) - 1, Number(d));
  }

  // fallback — пусть JS сам попробует
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

// приводим ячейку к числу (убираем валюту, %, пробелы)
function toNumber(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  let str = String(value)
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, ""); // оставляем только цифры, точку и минус

  if (!str) return 0;
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// строим соответствие: impressions → индекс столбца и т.д.
function buildIndexMap(headers = [], columnMap = {}) {
  const map = {};
  const lowerHeaders = headers.map((h) => String(h || "").toLowerCase().trim());

  Object.entries(columnMap || {}).forEach(([key, headerName]) => {
    const target = String(headerName || "").toLowerCase().trim();
    const idx = lowerHeaders.findIndex((h) => h === target);
    if (idx !== -1) {
      map[key] = idx;
    }
  });

  return map;
}

// считаем KPI по заданному диапазону дат (или по всей таблице)
function computeKpi(headers, rows, columnMap, dateColumnIndex, from, to) {
  if (!rows || !rows.length || !columnMap) {
    return {
      impressions: 0,
      clicks: 0,
      ctr: 0,
      spend: 0,
      cpc: 0,
      leads: 0,
      cpl: 0,
      revenue: 0,
      roas: 0,
    };
  }

  const idxMap = buildIndexMap(headers, columnMap);

  let impressions = 0;
  let clicks = 0;
  let spend = 0;
  let leads = 0;
  let revenue = 0;

  for (const row of rows) {
    // фильтр по датам
    if (dateColumnIndex != null) {
      const rawDate = row[dateColumnIndex];
      const d = parseDate(rawDate);
      if (!d) continue;

      if (from && d < from) continue;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        if (d > toEnd) continue;
      }
    }

    if (idxMap.impressions != null)
      impressions += toNumber(row[idxMap.impressions]);
    if (idxMap.clicks != null) clicks += toNumber(row[idxMap.clicks]);
    if (idxMap.spend != null) spend += toNumber(row[idxMap.spend]);
    if (idxMap.leads != null) leads += toNumber(row[idxMap.leads]);
    if (idxMap.revenue != null) revenue += toNumber(row[idxMap.revenue]);
  }

  const ctr = impressions ? (clicks / impressions) * 100 : 0;
  const cpc = clicks ? spend / clicks : 0;
  const cpl = leads ? spend / leads : 0;
  const roas = spend ? revenue / spend : 0;

  return {
    impressions: Math.round(impressions),
    clicks: Math.round(clicks),
    ctr: isFinite(ctr) ? ctr : 0,
    spend: isFinite(spend) ? spend : 0,
    cpc: isFinite(cpc) ? cpc : 0,
    leads: Math.round(leads),
    cpl: isFinite(cpl) ? cpl : 0,
    revenue: isFinite(revenue) ? revenue : 0,
    roas: isFinite(roas) ? roas : 0,
  };
}
