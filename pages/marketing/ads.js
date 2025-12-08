// pages/ads.js
import { useState } from "react";
import Link from "next/link";

const emptyMetrics = {
  impressions: null,
  clicks: null,
  ctr: null,
  spend: null,
  cpc: null,
  leads: null,
  cpl: null,
  revenue: null,
  roas: null,
};

export default function AdsPage() {
  const [sheetUrl, setSheetUrl] = useState("");
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [mapping, setMapping] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [error, setError] = useState("");

  function isGoogleSheetUrl(url) {
    return url.includes("docs.google.com") && url.includes("spreadsheets");
  }

  async function connectSheet() {
    setError("");

    if (!sheetUrl || !isGoogleSheetUrl(sheetUrl)) {
      setError("Вставь корректную ссылку на Google Таблицу");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(
        `/api/ads/ai-parse?url=${encodeURIComponent(sheetUrl)}`
      );
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Ошибка при анализе таблицы");
      }

      const m = json.metrics || json.data?.metrics || json.kpi || {};

      const normalizedMetrics = {
        impressions: m.impressions ?? m.shows ?? null,
        clicks: m.clicks ?? m.click ?? null,
        ctr: m.ctr ?? m.CTR ?? null,
        spend: m.spend ?? m.cost ?? m.expense ?? null,
        cpc: m.cpc ?? m.cost_per_click ?? null,
        leads: m.leads ?? m.conversions ?? m.result ?? null,
        cpl: m.cpl ?? m.cost_per_lead ?? null,
        revenue: m.revenue ?? m.income ?? m.purchasesValue ?? null,
        roas: m.roas ?? m.roi ?? null,
      };

      setMetrics(normalizedMetrics);

      const map =
        json.mapping ||
        json.columnMap ||
        json.columns ||
        json.columnHints ||
        null;

      setMapping(map || null);
      setStatus("ready");
    } catch (e) {
      console.error("ADS CONNECT ERROR:", e);
      setError(e.message || "Что-то пошло не так");
      setStatus("error");
    }
  }

  // ===== Форматирование значений =====
  function formatInt(value) {
    if (value == null || value === "") return "—";
    const num = Number(String(value).replace(/[^\d.-]/g, ""));
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("ru-RU");
  }

  function formatMoney(value) {
    if (value == null || value === "") return "—";
    const num = Number(String(value).replace(/[^\d.-]/g, ""));
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("ru-RU", {
      maximumFractionDigits: 2,
    }) + " €";
  }

  function formatPercent(value) {
    if (value == null || value === "") return "—";
    const num = Number(String(value).toString().replace("%", ""));
    if (Number.isNaN(num)) return String(value);
    // если пришло 0.2 — делаем 20%
    const normalized = num <= 1 ? num * 100 : num;
    return normalized.toFixed(1).replace(/\.0$/, "") + " %";
  }

  function formatMultiplier(value) {
    if (value == null || value === "") return "—";
    const num = Number(String(value).replace(/[^\d.-]/g, ""));
    if (Number.isNaN(num)) return String(value);
    return num.toFixed(1).replace(/\.0$/, "") + "x";
  }

  return (
    <div className="ads-page">
      {/* Верхняя панель */}
      <div className="ads-top">
        <Link href="/marketing" className="ads-back">
          ← Назад
        </Link>
        <h1 className="ads-title">Реклама</h1>
        <p className="ads-subtitle">
          Подключите таблицу — AI сам разберётся с колонками и посчитает
          показатели.
        </p>

        <div className="ads-url-row">
          <input
            type="text"
            className="ads-input"
            placeholder="Вставьте ссылку на Google Таблицу"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
          />
          <button
            className="ads-connect-btn"
            onClick={connectSheet}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Анализируем…" : "Подключить"}
          </button>
        </div>

        {error && <div className="ads-error">{error}</div>}
      </div>

      {/* KPI блок */}
      <div className="ads-section">
        <h2 className="ads-section-title">Ключевые показатели</h2>

        <div className="ads-kpi-grid">
          <div className="ads-kpi-card">
            <div className="ads-kpi-label">Показы</div>
            <div className="ads-kpi-value big">
              {formatInt(metrics.impressions)}
            </div>
          </div>

          <div className="ads-kpi-card">
            <div className="ads-kpi-label">Клики</div>
            <div className="ads-kpi-value big">
              {formatInt(metrics.clicks)}
            </div>
          </div>

          <div className="ads-kpi-card">
            <div className="ads-kpi-label">CTR</div>
            <div className="ads-kpi-value accent">
              {formatPercent(metrics.ctr)}
            </div>
          </div>

          <div className="ads-kpi-card">
            <div className="ads-kpi-label">Расходы</div>
            <div className="ads-kpi-value">{formatMoney(metrics.spend)}</div>
          </div>

          <div className="ads-kpi-card">
            <div className="ads-kpi-label">Цена клика</div>
            <div className="ads-kpi-value">
              {formatMoney(metrics.cpc).replace(" €", " €")}
            </div>
          </div>

          <div className="ads-kpi-card">
            <div className="ads-kpi-label">Лиды</div>
            <div className="ads-kpi-value">{formatInt(metrics.leads)}</div>
          </div>

          <div className="ads-kpi-card">
            <div className="ads-kpi-label">CPL</div>
            <div className="ads-kpi-value">
              {formatMoney(metrics.cpl).replace(" €", " €")}
            </div>
          </div>

          <div className="ads-kpi-card">
            <div className="ads-kpi-label">Доход</div>
            <div className="ads-kpi-value">{formatMoney(metrics.revenue)}</div>
          </div>

          <div className="ads-kpi-card wide">
            <div className="ads-kpi-label">ROAS</div>
            <div className="ads-kpi-value roas">
              {formatMultiplier(metrics.roas)}
            </div>
          </div>
        </div>
      </div>

      {/* Блок с найденными колонками AI */}
      {mapping && (
        <div className="ads-section">
          <h2 className="ads-section-title">AI нашёл такие столбцы:</h2>
          <pre className="ads-mapping-block">
            {JSON.stringify(mapping, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
