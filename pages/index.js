import Head from "next/head";

export default function Home() {
  return (
    <div className="app-container">
      <Head>
        <title>GastroMind</title>
      </Head>

      {/* ЛОГО */}
      <div className="logo-wrapper">
        <img src="/logo.svg" alt="GastroMind Logo" className="logo" />
      </div>

      {/* ТЕКСТ */}
      <h1 className="title">GastroMind</h1>
      <p className="subtitle">AI-ассистент для ресторатора</p>

      <h2 className="section-title">Выберите раздел</h2>

      {/* КАРТОЧКИ МЕНЮ */}
      <div className="menu-grid">
        
        <div className="menu-card">
          <img src="/icons/marketing.svg" className="menu-icon" />
          <div className="menu-title">Маркетинг</div>
          <div className="menu-subtitle">Гости, трафик и акции</div>
        </div>

        <div className="menu-card">
          <img src="/icons/menu.svg" className="menu-icon" />
          <div className="menu-title">Меню & Себестоимость</div>
          <div className="menu-subtitle">Маржа, блюда, прайс</div>
        </div>

        <div className="menu-card">
          <img src="/icons/staff.svg" className="menu-icon" />
          <div className="menu-title">Персонал</div>
          <div className="menu-subtitle">Команда и мотивация</div>
        </div>

        <div className="menu-card">
          <img src="/icons/finance.svg" className="menu-icon" />
          <div className="menu-title">Финансы & Аналитика</div>
          <div className="menu-subtitle">Цифры и отчёты</div>
        </div>

      </div>
    </div>
  );
}
