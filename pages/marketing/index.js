import Head from "next/head";
import Link from "next/link";

export default function Marketing() {
  return (
    <div className="app-container">
      <Head>
        <title>Маркетинг — GastroMind</title>
      </Head>

      <h1 className="title">Маркетинг</h1>
      <p className="subtitle">Выберите раздел</p>

      <div className="menu-grid">

        {/* РЕКЛАМА */}
        <Link href="/marketing/ads" className="menu-card">
          <img src="/icons/ads.svg" className="menu-icon" />
          <div className="menu-title">Реклама</div>
          <div className="menu-subtitle">Google / Meta / Яндекс</div>
        </Link>

        {/* СОЦСЕТИ */}
        <Link href="/marketing/social" className="menu-card">
          <img src="/icons/social.svg" className="menu-icon" />
          <div className="menu-title">Социальные сети</div>
          <div className="menu-subtitle">Контент, трафик, охваты</div>
        </Link>

        {/* ОТЗЫВЫ */}
        <Link href="/marketing/reviews" className="menu-card">
          <img src="/icons/reviews.svg" className="menu-icon" />
          <div className="menu-title">Отзывы</div>
          <div className="menu-subtitle">Мониторинг и ответы</div>
        </Link>

        {/* СТРАТЕГИИ */}
        <Link href="/marketing/strategy" className="menu-card">
          <img src="/icons/strategy.svg" className="menu-icon" />
          <div className="menu-title">Стратегии</div>
          <div className="menu-subtitle">Рост, гости, трафик</div>
        </Link>

      </div>
    </div>
  );
}
