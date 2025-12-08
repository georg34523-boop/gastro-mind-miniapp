// pages/ads.js

import { useState } from "react";
import Link from "next/link";

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");        // только реальная ссылка, без плейсхолдера
  const [status, setStatus] = useState("idle");        // idle | loading | ok | error
  const [error, setError] = useState("");

  // KPI
  const [metrics, setMetrics] = useState(null);
  // Мэппинг колонок, который показывает AI внизу
  const [mapping, setMapping] = useState(null);

  async function handleConnect() {
    try {
      setError("");
      setMetrics(null);
      setMapping(null);

      const url = sheetUrl.trim();

      if (!url || !url.includes("docs.google.com")) {
        alert("Вставь корректную ссылку на Google Таблицу");
        return;
      }

      setStatus("loading");

      // 👉 ВАЖНО: отправляем **РЕАЛЬНУЮ** ссылку пользователя
      const encoded = encodeURIComponent(url);

      const res = await fetch(`/api/ads/ai-parse?url=${encoded}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        console.error("AI-parse error:", json);
        setStatus("error");
        setError(json.error || "Ошибка при анализе таблицы");
        return;
      }

      // Поддерживаем оба варианта ответа бэка:
      // 1) { metrics: {...}, mapping: {...} }
      // 2) плоский объект { impressions, clicks, ... , mapping }
      const metricsFromApi =
        json.metrics || {
          impressions: json.impressions,
          clicks: json.clicks,
          ctr: json.ctr,
          spend: json.spend,
          cpc: json.cpc,
          leads: json.leads,
          cpl: json.cpl,
          revenue: json.revenue,
          roas: json.roas,
        };

      setMetrics(metricsFromApi || null);
      setMapping(json.mapping || json.columns || null);

      setStatus("ok");
    } catch (e) {
      console.error("handleConnect error:", e);
      setStatus("error");
      setError(e.message || "Неизвестная ошибка");
    }
  }

  return (
    <div className="page-container ads-page">
      {/* Назад */}
      <Link href="/marketing" className="back-link">
        ← Назад
      </Link>

      {/* Заголовок */}
      <h1 className="page-title">Реклама</h1>
      <p className="page-subtitle">
        Подключите таблицу — AI сделает анализ автоматически
      </p>

      {/* Поле ввода ссылки + кнопка */}
      <div className="sheet-input-block">
        <input
          type="text"
          className="sheet-input"
          placeholder="Вставьте ссылку на Google Таблицу"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
        />
        <button
          onClick={handleConnect}
          className="sheet-button primary"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Анализ..." : "Подключить"}
        </button>
      </div>

      {/* Ошибка */}
      {status === "error" && error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* Если KPI нет — ничего не показываем */}
      {status === "ok" && metrics && (
        <>
          {/* KPI GRID */}
          <div className="kpi-grid">
            <KpiCard label="Показы" value={metrics.impressions} />
            <KpiCard label="Клики" value={metrics.clicks} />
            <KpiCard
              label="CTR"
              value={
                metrics.ctr != null
                  ? `${(metrics.ctr * 100).toFixed(1)}%`
                  : "—"
              }
            />
            <KpiCard
              label="Расходы"
              value={
                metrics.spend != null
                  ? `${metrics.spend} €`
                  : "—"
              }
            />
            <KpiCard
              label="Цена клика"
              value={
                metrics.cpc != null
                  ? `${metrics.cpc} €`
                  : "—"
              }
            />
            <KpiCard label="Лиды" value={metrics.leads} />
            <KpiCard
              label="CPL"
              value={
                metrics.cpl != null
                  ? `${metrics.cpl} €`
                  : "—"
              }
            />
            <KpiCard
              label="Доход"
              value={
                metrics.revenue != null
                  ? `${metrics.revenue} €`
                  : "—"
              }
            />
            <KpiCard
              label="ROAS"
              value={
                metrics.roas != null
                  ? `${metrics.roas}x`
                  : "—"
              }
            />
          </div>

          {/* Блок с мэппингом колонок, чтобы можно было отдебажить, как AI понял таблицу */}
          {mapping && (
            <div className="mapping-section">
              <h2 className="mapping-title">AI нашёл такие столбцы:</h2>
              <pre className="mapping-box">
                {JSON.stringify(mapping, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      {status === "ok" && !metrics && (
        <p style={{ marginTop: 24 }}>Таблица подключена, но AI не смог посчитать метрики.</p>
      )}
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value ?? "—"}</div>
    </div>
  );
}
