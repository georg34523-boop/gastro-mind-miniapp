import { useEffect, useState } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();

    const initDataUnsafe = tg.initDataUnsafe;
    if (initDataUnsafe && initDataUnsafe.user) {
      setUser(initDataUnsafe.user);
    }
  }, []);

  return (
    <main className="gm-root">
      <header className="gm-header">
        <div className="gm-logo">GM</div>
        <div className="gm-title-block">
          <h1>GastroMind</h1>
          <p>AI-ассистент ресторатора</p>
        </div>
      </header>

      <section className="gm-card">
        <p className="gm-hello">
          {user ? (
            <>Привет, <span className="gm-accent">{user.first_name}</span> 👋</>
          ) : (
            'Загрузка данных из Telegram...'
          )}
        </p>
        <p className="gm-text">
          Это мини-приложение GastroMind. Скоро здесь будет панель,
          которая поможет тебе управлять маркетингом, закупками,
          персоналом и прибылью — прямо из Telegram.
        </p>
        <button
          className="gm-button"
          onClick={() => {
            const tg = window.Telegram?.WebApp;
            if (tg) {
              tg.HapticFeedback?.impactOccurred('medium');
            }
          }}
        >
          Продолжить
        </button>
      </section>

      <footer className="gm-footer">
        <span>v0.1 · MVP</span>
      </footer>
    </main>
  );
}
