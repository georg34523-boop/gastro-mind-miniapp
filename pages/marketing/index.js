import MenuCard from "../../components/MenuCard";

export default function Marketing() {
  return (
    <div className="page">

      <h1 className="title">Маркетинг</h1>
      <p className="subtitle">Выберите раздел</p>

      <div className="grid">

        <MenuCard 
          title="Реклама"
          subtitle="Google, Meta, аналитика"
          icon="/icons/ads.svg"
          link="/marketing/ads"
        />

        <MenuCard 
          title="Социальные сети"
          subtitle="Контент-план, идеи, метрики"
          icon="/icons/social.svg"
          link="/marketing/social"
        />

        <MenuCard 
          title="Отзывы"
          subtitle="Мониторинг и ответы"
          icon="/icons/reviews.svg"
          link="/marketing/reviews"
        />

        <MenuCard 
          title="Стратегии"
          subtitle="Аналитика и рекомендации"
          icon="/icons/strategy.svg"
          link="/marketing/strategy"
        />

      </div>
    </div>
  );
}
