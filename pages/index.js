import { useEffect, useState } from "react";

export default function Home() {
  const [tg, setTg] = useState(null);

  useEffect(() => {
    // Telegram WebApp доступен глобально после загрузки скрипта
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;

      webapp.expand(); // разворачивает mini-app на максимум
      webapp.enableClosingConfirmation(); // предупреждение при закрытии

      setTg(webapp);
    }
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>GastroMind</h1>

      <p style={styles.subtitle}>
        AI-ассистент ресторатора
      </p>

      <button
        style={styles.button}
        onClick={() => tg?.sendData("start_work")}
      >
        Начать работу
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.7,
    marginBottom: 25,
  },
  button: {
    padding: "14px 20px",
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: "#2ea6ff",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};
