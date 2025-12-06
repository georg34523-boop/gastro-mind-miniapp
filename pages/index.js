import Head from "next/head";
import Link from "next/link";

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

      {/* КАРТОЧКИ */}
      <div className="menu-grid">

        {/* МАРКЕТИНГ */}
        <Link href="/marketing" className="menu-card">
          <div>
            <img src="/icons/marketing.svg" className="menu-icon" />
            <div className="menu-title">Маркетинг</div>
            <div className="menu-subtitle">Гости, трафик и акции</div>
          </div>
        </Link>

        {/* МЕНЮ */}
        <Link href="/menu" className="menu-card">
          <div>
            <img src="/icons/menu.svg" className="menu-icon" />
            <div className="menu-title">Меню & Себестоимость</div>
            <div className="menu-subtitle">Маржа, блюда, прайс</div>
          </div>
        </Link>

        {/* ПЕРСОНАЛ */}
        <Link href="/staff" className="menu-card">
          <div>
            <img src="/icons/staff.svg" className="menu-icon" />
            <div className="menu-title">Персонал</div>
            <div className="menu-subtitle">Команда и мотивация</div>
          </div>
        </Link>

        {/* ФИНАНСЫ */}
        <Link href="/finance" className="menu-card">
          <div>
            <img src="/icons/finance.svg" className="menu-icon" />
            <div className="menu-title">Финансы & Аналитика</div>
            <div className="menu-subtitle">Цифры и отчёты</div>
          </div>
        </Link>

      </div>
    </div>
  );
}
