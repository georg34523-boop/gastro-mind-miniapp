export default function MenuCard({ title, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={styles.card}
    >
      <div style={styles.icon}>{icon}</div>
      <div style={styles.title}>{title}</div>
    </div>
  );
}

const styles = {
  card: {
    width: "45%",
    height: 120,
    background: "var(--tg-theme-bg-color)",
    borderRadius: 16,
    border: "1px solid var(--tg-theme-button-color)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "0.2s",
  },
  icon: {
    fontSize: 28,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
  },
};
