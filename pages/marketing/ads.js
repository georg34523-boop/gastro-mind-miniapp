import { useState, useEffect } from "react";
import Head from "next/head";

export default function Ads() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [savedSheetUrl, setSavedSheetUrl] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("adsSheetUrl");
    if (saved) setSavedSheetUrl(saved);
  }, []);

  const saveSheetUrl = () => {
    if (!sheetUrl.includes("docs.google.com")) {
      alert("Введите корректную ссылку на Google Таблицу");
      return;
    }
    localStorage.setItem("adsSheetUrl", sheetUrl);
    setSavedSheetUrl(sheetUrl);
  };

  return (
    <div className="app-container">
      <Head>
        <title>Реклама — GastroMind</title>
      </Head>

      <h1 className="title">Реклама</h1>

      {!savedSheetUrl && (
        <div className="card">
          <h2>Подключите Google Таблицу</h2>
          <p className="subtitle">
            Вставьте ссылку на таблицу, где таргетолог ведёт расходы, результаты и кампании.
          </p>

          <input
            className="input"
            type="text"
            placeholder="https://docs.google.com/..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
          />

          <button className="btn" onClick={saveSheetUrl}>
            Сохранить
          </button>
        </div>
      )}

      {savedSheetUrl && (
        <div className="card">
          <h2>Google Таблица подключена</h2>
          <p>Мы будем автоматически анализировать данные.</p>

          <div className="sheet-url">{savedSheetUrl}</div>

          <button
            className="btn-secondary"
            onClick={() => {
              localStorage.removeItem("adsSheetUrl");
              setSavedSheetUrl("");
            }}
          >
            Изменить таблицу
          </button>

          {/* Здесь позже появятся графики, бюджеты, ROAS и т.д. */}
          <div className="dashboard-placeholder">
            📊 Дашборд появится после интеграции данных
          </div>
        </div>
      )}
    </div>
  );
}
