import { useState } from "react";
import Link from "next/link";

export default function ReviewsPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  async function loadReviews(force = false) {
    if (!url) {
      setError("Вставьте ссылку на Google Maps");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/reviews/google/by-link?url=${encodeURIComponent(url)}${
          force ? "&refresh=1" : ""
        }`
      );

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Ошибка загрузки отзывов");
      }

      setData(json);
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      {/* Верх */}
      <Link href="/marketing" className="back-link">
        ← Назад
      </Link>

      <h1 className="page-title">Отзывы</h1>

      <p className="page-subtitle">
        Вставьте ссылку на Google Maps — мы подтянем отзывы автоматически
      </p>

      {/* Ввод ссылки */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="https://maps.app.goo.gl/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />

        <button
          onClick={() => loadReviews(false)}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border: "none",
            background: "#5a67d8",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Проверить
        </button>

        {data && (
          <button
            onClick={() => loadReviews(true)}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: "1px solid #5a67d8",
              background: "white",
              color: "#5a67d8",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        )}
      </div>

      {/* Состояния */}
      {loading && <p>Загрузка отзывов…</p>}
      {error && <p style={{ color: "#d11a2a" }}>{error}</p>}

      {/* Данные */}
      {data && data.place && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 16,
            background: "#f8fafc",
          }}
        >
          <h2 style={{ marginBottom: 4 }}>{data.place.name}</h2>

          <div style={{ fontSize: 14, color: "#555" }}>
            ⭐ {data.place.rating || "—"} ·{" "}
            {data.place.totalReviews} отзывов
            {data.cached && " · из кеша"}
          </div>
        </div>
      )}

      {/* Список отзывов */}
      {data?.reviews?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {data.reviews.map((r, idx) => (
            <div
              key={idx}
              style={{
                padding: 14,
                borderRadius: 14,
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <strong>{r.author}</strong>
                <span>⭐ {r.rating}</span>
              </div>

              <div style={{ fontSize: 14, color: "#333" }}>{r.text}</div>

              {r.publishTime && (
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#888",
                  }}
                >
                  {new Date(r.publishTime).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.reviews?.length === 0 && (
        <p style={{ marginTop: 16 }}>Отзывов не найдено</p>
      )}
    </div>
  );
}
