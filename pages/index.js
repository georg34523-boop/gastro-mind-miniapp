import Head from "next/head";

const sections = [
  {
    id: "marketing",
    title: "Маркетинг",
    subtitle: "Гости, трафик и акции",
    icon: "/icons/marketing.svg",
  },
  {
    id: "menu",
    title: "Меню & Себестоимость",
    subtitle: "Маржа, блюда, прайс",
    icon: "/icons/menu.svg",
  },
  {
    id: "staff",
    title: "Персонал",
    subtitle: "Команда и мотивация",
    icon: "/icons/staff.svg",
  },
  {
    id: "finance",
    title: "Финансы & Аналитика",
    subtitle: "Цифры и отчёты",
    icon: "/icons/finance.svg",
  },
];

export default function Home() {
  // Здесь потом повесим логику открытия разделов / переходов
  const handleSectionClick = (sectionId) => {
    // Пока просто лог:
    console.log("Section click:", sectionId);
    // дальше сюда добавим навигацию или вызов бота/AI
  };

  return (
    <>
      <Head>
        <title>GastroMind — AI-ассистент ресторатора</title>
        <meta
          name="description"
          content="GastroMind — AI-ассистент для владельцев ресторанов и кафе."
        />
      </Head>

      <main className="gm-page">
        {/* Фоновое большое лого */}
        <div className="gm-background-logo" />

        <div className="gm-content">
          {/* Верхний блок с круглым лого и текстом */}
          <header className="gm-header">
            <div className="gm-logo-circle">
              <img src="/logo-gm.png" alt="GastroMind" />
            </div>
            <h1 className="gm-title">GastroMind</h1>
            <p className="gm-subtitle">AI-ассистент для ресторатора</p>
          </header>

          {/* Раздел выбора секции */}
          <section>
            <h2 className="gm-section-title">Выберите раздел</h2>

            <div className="gm-card-grid">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className="gm-card"
                  onClick={() => handleSectionClick(section.id)}
                >
                  <div
                    className={`gm-card-icon gm-card-icon--${section.id}`}
                  >
                    <img src={section.icon} alt="" aria-hidden="true" />
                  </div>

                  <div className="gm-card-text">
                    <h3>{section.title}</h3>
                    <p>{section.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
