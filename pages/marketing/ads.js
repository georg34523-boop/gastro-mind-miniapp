// pages/ads.js

import { useState } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");

  async function connectSheet() {
    if (!sheetUrl.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    // ПОДДЕРЖИВАЕМ ЛЮБОЙ ФОРМАТ ССЫЛКИ
    const sheetId =
      sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
      sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
      sheetUrl.match(/id=([a-zA-Z0-9-_]+)/)?.[1];

    if (!sheetId) {
      alert("Не удалось определить ID таблицы");
      return;
    }

    setStatus("loading");

    const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetUrl)}`);
    const json = await res.json();

    if (json.error) {
      alert(json.error);
      setStatus("error");
      return;
    }

    setData(json.data || []); // JSON вернёт "data"
    setStatus("ok");
  }

  return (
    <div className="page-container">
      <Link href="/marketing" className="back-link">
        ← Назад
      </Link>

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

      {/* Состояния */}
      {status === "loading" && <p>Загрузка данных...</p>}
      {status === "error" && <p>Ошибка загрузки</p>}

      {/* ====== КРАСИВАЯ ТАБЛИЦА ====== */}
      {status === "ok" && data && data.length > 0 && (
        <div className="sheet-table-container">
          <div className="sheet-table">
            {/* Header */}
            <div className="sheet-row header">
              {Object.keys(data[0]).map((col, i) => (
                <div key={i} className="sheet-cell header-cell">
                  {col}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="sheet-body">
              {data.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`sheet-row ${rowIndex % 2 === 0 ? "even" : "odd"}`}
                >
                  {Object.values(row).map((value, cellIndex) => (
                    <div key={cellIndex} className="sheet-cell">
                      {value || "-"}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === "ok" && data?.length === 0 && (
        <p>Таблица подключена, но данных нет.</p>
      )}
    </div>
  );
}
