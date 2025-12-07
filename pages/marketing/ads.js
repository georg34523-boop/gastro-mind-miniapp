import { useState } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");

  async function connectSheet() {
    console.log("RAW sheetUrl from input:", sheetUrl);

    if (!sheetUrl.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }

    // 🧠 Надёжное извлечение sheetId
    const sheetId =
      sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
      sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
      sheetUrl.match(/id=([a-zA-Z0-9-_]+)/)?.[1];

    console.log("Extracted sheetId:", sheetId);

    if (!sheetId) {
      alert("Не удалось определить ID таблицы");
      return;
    }

    setStatus("loading");

    // 🧠 API ждёт parameter url, а не sheetId
    const res = await fetch(`/api/sheets?url=${encodeURIComponent(sheetUrl)}`);

    const json = await res.json();

    console.log("Response from API:", json);

    if (json.error) {
      alert(json.error);
      setStatus("error");
      return;
    }

    setData(json.rows || json.data || []);
    setStatus("ok");
  }

  return (
    <div className="page-container">
      <Link href="/marketing" className="back-link">← Назад</Link>

      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">Данные из вашей Google Таблицы</p>

      {/* Поле для ссылки */}
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

      {/* Статусы */}
      {status === "loading" && <p>Загрузка данных...</p>}
      {status === "error" && <p>Ошибка загрузки</p>}

      {/* Таблица */}
      {status === "ok" && data && (
        <div className="sheet-table-wrapper">
          <div className="sheet-table">
            {data.map((row, index) => (
              <div key={index} className={`sheet-row ${index === 0 ? "header" : ""}`}>
                {Object.values(row).map((cell, i) => (
                  <div key={i} className="sheet-cell">
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
