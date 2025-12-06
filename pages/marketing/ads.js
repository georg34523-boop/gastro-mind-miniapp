import { useState, useEffect } from "react";

export default function Ads() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [data, setData] = useState(null);

  // Загружаем сохранённую ссылку
  useEffect(() => {
    const saved = localStorage.getItem("adsSheetUrl");
    if (saved) {
      setSheetUrl(saved);
      fetchData(saved);
    }
  }, []);

  // Получение данных из API
  async function fetchData(url) {
    try {
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      console.log("sheet data:", json);

      if (json.values && json.values.length > 1) {
        setData(json.values);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error(e);
      setData([]);
    }
  }

  function saveUrl() {
    localStorage.setItem("adsSheetUrl", sheetUrl);
    fetchData(sheetUrl);
  }

  return (
    <div className="app-container">

      {/* кнопка НАЗАД */}
      <a href="/marketing" className="back-btn">← назад</a>

      <h1 className="title">Реклама</h1>
      <p className="subtitle">Данные из вашей Google Таблицы</p>

      {/* Ввод ссылки */}
      <div className="input-block">
        <label className="input-label">Ссылка на Google Таблицу</label>
        <input
          className="url-input"
          type="text"
          placeholder="https://docs.google.com/…"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
        />
        <button className="save-btn" onClick={saveUrl}>Подключить таблицу</button>
      </div>

      {/* Таблица */}
      {data && data.length > 0 ? (
        <div className="table-container">
          <table className="data-table">

            <thead>
              <tr>
                {data[0].map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.slice(1).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      ) : (
        <p style={{ marginTop: 20 }}>
          Таблица подключена, но нет данных для отображения.
        </p>
      )}
    </div>
  );
}
