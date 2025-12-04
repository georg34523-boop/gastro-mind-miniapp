import { useEffect, useState } from "react";
import MenuCard from "../components/MenuCard";

export default function Home() {
  const [tg, setTg] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.ready();
      webapp.expand();
      setTg(webapp);
    }
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>GastroMind</h1>
      <p style={styles.subtitle}>Выберите раздел</p>

      <div style={styles.grid}>
        <MenuCard
          title="Маркетинг"
          icon="📣"
          onClick={() => tg?.sendData("open_marketing")}
        />
        <MenuCard
          title="Меню & Себестоимость"
          icon="📊"
          onClick={() => tg?.sendData("open_cost")}
        />
        <MenuCard
          title="Персонал"
          icon="👨‍🍳"
          onClick={() => tg?.sendData("open_staff")}
        />
        <MenuCard
          title="Финансы & Аналитика"
          icon="💰"
          onClick={() => tg?.sendData("open_finance")}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    fontFamily: "system-ui, sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: 26,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.6,
    marginBottom: 20,
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
};
