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

    try {
      const res = await fetch(
        `/api/sheets?url=${encodeURIComponent(sheetUrl)}`
      );

      const json = await res.json();
      console.log("CLIENT RECEIVED:", json);

      if (json.error) {
        alert(json.error);
        setStatus("error");
        return;
      }

      setHeaders(json.headers || []);
      setRows(json.rows || []);
      setStatus("ok");
    } catch (e) {
      alert("Ошибка загрузки данных");
      setStatus("error");
    }
  }

  return (
    <div className="page-container">
      <Link href="/marketing" className="back-link">← Назад</Link>

      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">Данные из вашей Google Таблицы</p>

      {/* Поле ввода */}
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

      {status === "loading" && <p>Загрузка...</p>}
      {status === "error" && <p>Ошибка загрузки данных</p>}

      {/* ТАБЛИЦА */}
      {status === "ok" && headers.length > 0 && (
        <div className="sheet-table-wrapper">
          <div className="sheet-table">

            {/* Заголовки */}
            <div className="sheet-row header">
              {headers.map((h, i) => (
                <div key={i} className="sheet-cell header-cell">
                  {h}
                </div>
              ))}
            </div>

            {/* Данные */}
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="sheet-row">
                {headers.map((h, colIndex) => (
                  <div key={colIndex} className="sheet-cell">
                    {row[h] || "-"}
                  </div>
                ))}
              </div>
            ))}

          </div>
        </div>
      )}

      {status === "ok" && headers.length === 0 && (
        <p>Таблица подключена, но данных нет.</p>
      )}
    </div>
  );
}
