import { useState } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");

  async function connectSheet() {
    if (!sheetUrl.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    setStatus("loading");

    const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetUrl)}`);
    const json = await res.json();

    if (!json.success) {
      alert(json.error || "Ошибка загрузки");
      setStatus("error");
      return;
    }

    setHeaders(json.headers);
    setRows(json.rows);
    setStatus("ok");
  }

  return (
    <div className="page-container">
      <Link href="/marketing" className="back-link">← Назад</Link>

      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">Данные из вашей Google Таблицы</p>

      {/* Поле для URL */}
      <div className="sheet-input-block">
        <input
          type="text"
          placeholder="Вставьте ссылку на Google Таблицу"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          className="sheet-input"
        />
        <button onClick={connectSheet} className="sheet-button">
          Подключить таблицу
        </button>
      </div>

      {status === "loading" && <p>Загрузка данных...</p>}
      {status === "error" && <p>Ошибка загрузки данных</p>}

      {/* Таблица */}
      {status === "ok" && rows.length > 0 && (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((h, cellIndex) => (
                    <td key={cellIndex}>{row[h] || "-"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status === "ok" && rows.length === 0 && (
        <p>Таблица подключена, но данных нет.</p>
      )}
    </div>
  );
}
