// pages/index.js
import MenuCard from "../components/MenuCard";

export default function Home() {
  const handleSectionClick = (section) => {
    // пока просто алерт, потом сюда повесим навигацию / страницы
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
    console.log("Open section:", section);
  };

  return (
    <div className="app-root">
      <div className="app-inner">
        <h1 className="app-title">GastroMind</h1>
        <p className="app-subtitle">AI-ассистент для рестика</p>

        <div className="app-section-title">Выберите раздел</div>

        <div className="app-grid">
          <MenuCard
            icon="📣"
            title="Маркетинг"
            description="Реклама, акции, трафик гостей"
            onClick={() => handleSectionClick("marketing")}
          />
          <MenuCard
            icon="📊"
            title="Меню & себестоимость"
            description="Блюда, цены и маржа"
            onClick={() => handleSectionClick("menu")}
          />
          <MenuCard
            icon="👨‍🍳"
            title="Персонал"
            description="Графики, мотивация, задачи"
            onClick={() => handleSectionClick("staff")}
          />
          <MenuCard
            icon="💰"
            title="Финансы & аналитика"
            description="Прибыль, отчёты, прогнозы"
            onClick={() => handleSectionClick("finance")}
          />
        </div>
      </div>
    </div>
  );
}
