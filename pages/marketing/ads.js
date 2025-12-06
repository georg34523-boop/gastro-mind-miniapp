import { useState } from "react";

export default function Ads() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState(null);
  const [status, setStatus] = useState("");

  const handleSave = () => {
    if (!sheetUrl.includes("docs.google.com")) {
      setStatus("❌ Это не похоже на ссылку Google Sheets");
      return;
    }

    setSavedUrl(sheetUrl);
    setStatus("✅ Таблица подключена!");
  };

  const checkData = async () => {
    if (!savedUrl) {
      setStatus("⚠️ Сначала подключите таблицу");
      return;
    }

    setStatus("⏳ Подключение к данным...");

    try {
      const res = await fetch(`/api/sheets?url=${encodeURIComponent(savedUrl)}`);
      const data = await res.json();

      if (data.error) {
        setStatus("❌ Ошибка чтения таблицы");
      } else {
        setStatus("✅ Данные успешно загружены!");
        console.log("DATA:", data);
      }
    } catch (err) {
      setStatus("❌ Ошибка соединения");
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">Реклама</h1>
      <p className="subtitle">Подключите Google Таблицу</p>

      <div className="card">
        <label>Ссылка на Google Sheets:</label>
        <input
          className="input"
          placeholder="Вставьте ссылку..."
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
        />

        <button className="btn" onClick={handleSave}>
          Подключить таблицу
        </button>

        {savedUrl && (
          <>
            <div className="sheet-url">Подключено: {savedUrl}</div>
            <button className="btn-secondary" onClick={checkData}>
              Проверить данные
            </button>
          </>
        )}

        {status && <p className="dashboard-placeholder">{status}</p>}
      </div>
    </div>
  );
}
