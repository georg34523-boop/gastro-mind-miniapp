import Head from "next/head";

export default function Home() {
  return (
    <div className="app-root">
      <Head>
        <title>GastroMind — мини-приложение</title>
        <meta
          name="description"
          content="GastroMind — AI-ассистент для ресторатора"
        />
      </Head>

      <main className="gm-wrapper">
        {/* Шапка */}
        <header className="gm-header">
          <div className="gm-logo-mark">
            {/* сюда можно положить круглую вырезку из лого, пока используем общий файл */}
            <img src="/logo-bg.png" alt="GastroMind" />
          </div>
          <h1 className="gm-title">GastroMind</h1>
          <p className="gm-subtitle">AI-ассистент для ресторатора</p>
        </header>

        {/* Подзаголовок */}
        <div className="gm-section-caption">Выберите раздел</div>

        {/* Карточки */}
        <section className="gm-grid">
          {/* Маркетинг */}
          <button className="gm-card gm-card--marketing">
            <div className="gm-card-icon">
              {/* пока emoji, позже заменим на свою SVG/анимацию */}
              <span role="img" aria-label="Маркетинг">
                📣
              </span>
            </div>
            <div className="gm-card-title">Маркетинг</div>
            <div className="gm-card-sub">Гости, трафик и акции</div>
          </button>

          {/* Меню & Себестоимость */}
          <button className="gm-card gm-card--menu">
            <div className="gm-card-icon">
              <span role="img" aria-label="Меню и себестоимость">
                📊
              </span>
            </div>
            <div className="gm-card-title">Меню &amp; Себестоимость</div>
            <div className="gm-card-sub">Маржа, блюда, прайс</div>
          </button>

          {/* Персонал */}
          <button className="gm-card gm-card--staff">
            <div className="gm-card-icon">
              <span role="img" aria-label="Персонал">
                👨‍🍳
              </span>
            </div>
            <div className="gm-card-title">Персонал</div>
            <div className="gm-card-sub">Команда и мотивация</div>
          </button>

          {/* Финансы & Аналитика */}
          <button className="gm-card gm-card--finance">
            <div className="gm-card-icon">
              <span role="img" aria-label="Финансы">
                💰
              </span>
            </div>
            <div className="gm-card-title">Финансы &amp; Аналитика</div>
            <div className="gm-card-sub">Цифры и отчёты</div>
          </button>
        </section>
      </main>
    </div>
  );
}
