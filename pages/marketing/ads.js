import { useState, useEffect } from "react";
import Link from "next/link";

export default function Ads() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("loading");

  // Загружаем сохранённую ссылку
  useEffect(() => {
    const saved = localStorage.getItem("sheetUrl");
    if (saved) {
      setSheetUrl(saved);
      loadSheetData(saved);
    } else {
      setStatus("no-sheet");
    }
  }, []);

  // Загрузка данных таблицы
  async function loadSheetData(url) {
    setStatus("loading");

    const sheetId = extractSheetId(url);
    if (!sheetId) {
      setStatus("invalid");
      return;
    }

    try {
      const res = await fetch(`/api/sheets?sheetId=${sheetId}`);
      const json = await res.json();

      if (json.error || !json.data) {
        setStatus("empty");
      } else {
        setData(json.data);
        setStatus("ok");
      }
    } catch (e) {
      setStatus("error");
    }
  }

  // Сохранение новой ссылки
  function saveUrl() {
    localStorage.setItem("sheetUrl", sheetUrl);
    loadSheetData(sheetUrl);
  }

  // Достаём sheetId из URL
  function extractSheetId(url) {
    if (!url) return null;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  return (
    <div className="page">
      <Link href="/marketing" className="back-button">← Назад</Link>

      <h1 className="title">Реклама</h1>
      <p className="subtitle">Данные из вашей Google Таблицы</p>

      {/* Инпут для ссылки */}
      <div className="sheet-input-block">
        <input
          type="text"
          className="sheet-input"
          placeholder="Вставьте ссылку на Google Таблицу"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
        />
        <button className="sheet-save-btn" onClick={saveUrl}>
          Подключить таблицу
        </button>
      </div>

      {/* Статусы */}
      {status === "no-sheet" && <p>Введите ссылку выше.</p>}
      {status === "invalid" && <p>Некорректная ссылка на таблицу.</p>}
      {status === "loading" && <p>Загрузка данных...</p>}
      {status === "empty" && <p>Таблица подключена, но нет данных.</p>}
      {status === "error" && <p>Ошибка загрузки таблицы.</p>}

      {/* Вывод данных */}
      {status === "ok" && (
        <div className="sheet-table">
          {data.map((row, i) => (
            <div key={i} className="sheet-row">
              {row.map((cell, j) => (
                <div key={j} className="sheet-cell">{cell}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
