import { useEffect, useState } from "react";
import { format, parse } from "date-fns";
import { uk } from "date-fns/locale";

export default function Ads() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // ---------------------------
  // Загружаем таблицу
  // ---------------------------
  const loadSheet = async (url) => {
    try {
      setLoading(true);

      const res = await fetch(`/api/sheets?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!data.success) {
        alert("Ошибка загрузки таблицы");
        return;
      }

      setHeaders(data.headers || []);
      setRows(data.rows || []);
      setFiltered(data.rows || []);
      setConnected(true);

      localStorage.setItem("ads_sheet_url", url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Восстанавливаем сохранённую таблицу
  // ---------------------------
  useEffect(() => {
    const saved = localStorage.getItem("ads_sheet_url");
    if (saved) {
      setSheetUrl(saved);
      loadSheet(saved);
    }
  }, []);

  // ---------------------------
  // Конвертация строки в дату
  // ---------------------------
  const parseDate = (str) => {
    if (!str) return null;

    str = str.trim();

    // dd.mm.yy
    if (/^\d{2}\.\d{2}\.\d{2}$/.test(str)) {
      return parse(str, "dd.MM.yy", new Date(), { locale: uk });
    }

    // dd.mm.yyyy
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
      return parse(str, "dd.MM.yyyy", new Date(), { locale: uk });
    }

    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return parse(str, "yyyy-MM-dd", new Date(), { locale: uk });
    }

    return null;
  };

  // ---------------------------
  // ФИЛЬТР ПО ДАТАМ
  // ---------------------------
  const applyFilter = () => {
    if (!fromDate && !toDate) {
      setFiltered(rows);
      return;
    }

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const filteredRows = rows.filter((row) => {
      const dateStr = row[0];
      const dateObj = parseDate(dateStr);
      if (!dateObj) return false;

      if (from && dateObj < from) return false;
      if (to && dateObj > to) return false;

      return true;
    });

    setFiltered(filteredRows);
  };

  useEffect(() => {
    applyFilter();
  }, [fromDate, toDate]);

  // ---------------------------
  // Удаление привязанной таблицы
  // ---------------------------
  const removeSheet = () => {
    localStorage.removeItem("ads_sheet_url");
    setConnected(false);
    setHeaders([]);
    setRows([]);
    setFiltered([]);
    setSheetUrl("");
  };

  // UI --------------------------------------------------------------

  if (!connected) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Привяжи Google Таблицу</h2>

        <input
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          placeholder="Вставь ссылку на Google Sheet"
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={() => loadSheet(sheetUrl)}
          disabled={loading}
          style={{
            marginTop: 12,
            padding: "12px 20px",
            borderRadius: 8,
            background: "#007bff",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {loading ? "Загрузка..." : "Подключить"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Реклама — Dashboard</h2>

        <button
          onClick={removeSheet}
          style={{
            padding: "10px 16px",
            background: "#ff3b30",
            border: "none",
            color: "white",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Удалить таблицу
        </button>
      </div>

      {/* Фильтры */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <div>
          <label>От даты</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div>
          <label>До даты</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Таблица */}
      <div style={{ marginTop: 30, overflowX: "auto" }}>
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              {headers.map((h, idx) => (
                <th key={idx}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
