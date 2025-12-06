import { useState, useEffect } from "react";

export default function AdsPage() {
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Читаем сохранённый URL таблицы из localStorage
    const sheetUrl = localStorage.getItem("sheetUrl");

    if (!sheetUrl) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetUrl)}`);
        const data = await res.json();

        const parsed = parseCsv(data.csv);
        setCsvData(parsed);
      } catch (e) {
        console.error("Ошибка загрузки таблицы:", e);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  // CSV → JSON
  function parseCsv(csv) {
    const rows = csv.split("\n").map(r => r.split(","));
    const headers = rows[0];

    return rows.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h.trim(), row[i]?.trim()]))
    );
  }

  return (
    <div className="app-container">

      <h1 className="title">Реклама</h1>
      <p className="subtitle">Данные из вашей Google Таблицы</p>

      {loading && <p>Загрузка...</p>}

      {!loading && csvData.length === 0 && (
        <p>Таблица подключена, но нет данных для отображения.</p>
      )}

      {/* Выводим таблицу */}
      <div className="table-container">
        {csvData.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                {Object.keys(csvData[0]).map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {csvData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
