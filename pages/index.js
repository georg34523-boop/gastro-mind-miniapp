import MenuCard from "../components/MenuCard";

export default function Home() {
  return (
    <div>
      <h1>GastroMind</h1>
      <h2>Выберите раздел</h2>

      <div className="menu-grid">

        <MenuCard
          icon="📣"
          title="Маркетинг"
          onClick={() => alert("Маркетинг")}
        />

        <MenuCard
          icon="📊"
          title="Меню & Себестоимость"
          onClick={() => alert("Меню")}
        />

        <MenuCard
          icon="👨‍🍳"
          title="Персонал"
          onClick={() => alert("Персонал")}
        />

        <MenuCard
          icon="💰"
          title="Финансы & Аналитика"
          onClick={() => alert("Финансы")}
        />

      </div>
    </div>
  );
}
