import { useState } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");

  function extractSheetId(url) {
    try {
      // Универсальный способ достать sheetId из любых URL форм
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async function connectSheet() {
    if (!sheetUrl.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    const sheetId = extractSheetId(sheetUrl);

    if (!sheetId) {
      alert("Не удалось определить ID таблицы");
      return;
    }

    setStatus("loading");

    const res = await fetch(`/api/sheets?sheetId=${encodeURIComponent(sheetId)}`);
    const json = await res.json();

    if (json.error) {
      alert(json.error);
      setStatus("error");
      return;
    }

    setData(json.rows || []);
    setStatus("ok");
  }

  return (
    <div className="page-container">
      <Link href="/marketing" className="back-link">← Назад</Link>

      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">Данные из вашей Google Таблицы</p>

      {/* Ввод ссылки */}
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
      {status === "error" && <p>Ошибка загрузки</p>}

      {/* Таблица */}
      {status === "ok" && data && (
        <div className="sheet-table-wrapper">
          <div className="sheet-table">
            {data.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`sheet-row ${rowIndex === 0 ? "header" : ""}`}
              >
                {row.map((cell, cellIndex) => (
                  <div key={cellIndex} className="sheet-cell">
                    {cell || "-"}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "ok" && data?.length === 0 && (
        <p>Таблица подключена, но данных нет.</p>
      )}
    </div>
  );
}
