import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Находим индекс колонки с датой по заголовкам
 */
function findDateColumn(headers = []) {
  const lower = headers.map((h) => String(h || "").toLowerCase());
  const idx = lower.findIndex(
    (h) =>
      h.includes("дата") ||
      h.includes("date") ||
      h.includes("day") ||
      h.includes("period") ||
      h.includes("период")
  );
  // если не нашли — вернём -1 и дальше не будем фильтровать по датам
  return idx === -1 ? -1 : idx;
}

/**
 * Парсим дату из ячейки таблицы
 *
 * Поддерживаем:
 *  - 15.01.25
 *  - 5.1.25
 *  - 15.01.2025
 *  - 5/1/2025
 *  - 2025-01-15
 *  - 2025-1-5
 */
function parseSheetDate(value) {
  if (!value) return null;
  const s = String(value).trim();

  // yyyy-mm-dd или yyyy-m-d (включая варианты с временем)
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch.map(Number);
    return new Date(y, m - 1, d);
  }

  // dd.mm.yy(yy) или dd/mm/yy(yy) или dd-mm-yy(yy)
  const dmMatch = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (dmMatch) {
    let [, d, m, y] = dmMatch.map(Number);
    if (y < 100) y += 2000; // 25 -> 2025
    return new Date(y, m - 1, d);
  }

  // fallback: пробуем скормить JS
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Парсим дату из инпута type="date" (формат yyyy-mm-dd)
 */
function parseInputDate(str) {
  if (!str) return null;
  const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number);
  return new Date(y, mo - 1, d);
}

export default function AdsPage() {
  // boot | idle | loading | error | ok
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("boot");
  const [kpi, setKpi] = useState(null);
  const [columnMap, setColumnMap] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // исходная таблица
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
        // сразу грузим без показа формы
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
  //  Вызов GPT-парсера
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

      // сохраняем исходные данные
      const headers = jsonSheet.headers || [];
      const rows = jsonSheet.rows || [];
      setSheetData({ headers, rows });

      // сбрасываем фильтр
      setDateFrom("");
      setDateTo("");
      setFilterCount(null);

      // полный период
      await runAi(headers, rows, silent);

      // запомним URL
      if (typeof window !== "undefined") {
        localStorage.setItem("ads_sheet_url", url);
      }
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

    const { headers, rows } = sheetData;

    // если фильтр пустой — считаем по всем
    if (!dateFrom && !dateTo) {
      setFilterCount(null);
      await runAi(headers, rows);
      return;
    }

    const dateColIndex = findDateColumn(headers);
    if (dateColIndex === -1) {
      // не нашли колонку даты — просто считаем по всем и выходим
      alert("Не удалось определить колонку с датой в таблице.");
      setFilterCount(null);
      await runAi(headers, rows);
      return;
    }

    const from = parseInputDate(dateFrom);
    const to = parseInputDate(dateTo);

    // сразу считаем границы в ms, чтобы не трогать объекты Date в цикле
    const fromMs = from ? from.setHours(0, 0, 0, 0) : null;
    const toMs =
      to != null ? to.setHours(23, 59, 59, 999) : null; // включительно до конца дня

    const filteredRows = rows.filter((row) => {
      const cell = row[dateColIndex];
      const d = parseSheetDate(cell);
      if (!d) return false;

      const time = d.setHours(0, 0, 0, 0);

      if (fromMs !== null && time < fromMs) return false;
      if (toMs !== null && time > toMs) return false;

      return true;
    });

    setFilterCount(filteredRows.length);

    if (filteredRows.length === 0) {
      // нет строк в диапазоне — не мучаем GPT, просто обнуляем
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

    await runAi(headers, filteredRows);
  }

  // -----------------------------
  //  Удалить таблицу
  // -----------------------------
  function removeSheet() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("ads_sheet_url");
      }
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

      {/* Меню с "Удалить / Изменить" */}
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

      {/* Форма подключения — только когда действительно idle */}
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

      {/* Статусы */}
      {status === "loading" && (
        <p className="loading-text">Загрузка данных...</p>
      )}
      {status === "error" && (
        <p className="error-text">Ошибка при анализе данных.</p>
      )}

      {/* Фильтр по датам */}
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

      {/* Отладочный блок про столбцы */}
      {status === "ok" && columnMap && (
        <div className="column-map-info">
          <h3>AI нашёл такие столбцы:</h3>
          <pre>{JSON.stringify(columnMap, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
