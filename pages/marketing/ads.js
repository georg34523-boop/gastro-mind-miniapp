// pages/ads.js

import { useState } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("idle");

  async function connectSheet() {
    if (!sheetUrl.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    // Поддерживаем разные форматы ссылок
    const sheetId =
      sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
      sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
      sheetUrl.match(/id=([a-zA-Z0-9-_]+)/)?.[1];

    if (!sheetId) {
      alert("Не удалось определить ID таблицы");
      return;
    }

    setStatus("loading");

    try {
      // Отправляем ИМЕННО url, а не sheetId — так настроен /api/sheets
      const res = await fetch(
        `/api/sheets?url=${encodeURIComponent(sheetUrl)}`
      );
      const json = await res.json();

      if (json.error) {
        console.error("API error:", json);
        alert(json.error);
        setStatus("error");
        return;
      }

      // НОРМАЛИЗАЦИЯ ДАННЫХ
      let normalized = [];

      // Вариант 1: бэк вернул уже объекты
      if (Array.isArray(json.data) && json.data.length) {
        if (
          typeof json.data[0] === "object" &&
          !Array.isArray(json.data[0])
        ) {
          normalized = json.data;
        } else if (
          Array.isArray(json.data[0]) &&
          Array.isArray(json.headers)
        ) {
          // data = массив массивов + headers
          normalized = json.data.map((row) => {
            const obj = {};
            json.headers.forEach((h, i) => {
              obj[h] = row[i] ?? "";
            });
            return obj;
          });
        }
      }

      // Вариант 2: формат { headers, rows }
      if (
        !normalized.length &&
        Array.isArray(json.rows) &&
        Array.isArray(json.headers)
      ) {
        normalized = json.rows.map((row) => {
          const obj = {};
          json.headers.forEach((h, i) => {
            obj[h] = row[i] ?? "";
          });
          return obj;
        });
      }

      // safety: если всё равно пусто, но сервер прислал хоть что-то
      if (
        !normalized.length &&
        Array.isArray(json.rows) &&
        json.rows.length > 0
      ) {
        normalized = json.rows.map((row, index) => ({
          row: index,
          values: Array.isArray(row) ? row.join(" | ") : String(row),
        }));
      }

      setRows(normalized);
      setStatus("ok");
    } catch (e) {
      console.error("Client error:", e);
      alert("Ошибка при загрузке данных таблицы");
      setStatus("error");
    }
  }

  const hasData = rows && rows.length > 0;

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
      {status === "error" && (
        <p>Ошибка загрузки. Проверьте ссылку или доступы к таблице.</p>
      )}

      {/* Таблица */}
      {status === "ok" && hasData && (
        <div className="sheet-table-container">
          <div className="sheet-table">
            {/* Header — берём ключи из первого объекта */}
            <div className="sheet-row header">
              {Object.keys(rows[0]).map((col, i) => (
                <div key={i} className="sheet-cell header-cell">
                  {col}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="sheet-body">
              {rows.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`sheet-row ${
                    rowIndex % 2 === 0 ? "even" : "odd"
                  }`}
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

      {status === "ok" && !hasData && (
        <p>Таблица подключена, но данные не нашлись. Посмотрим это отдельно.</p>
      )}
    </div>
  );
}
