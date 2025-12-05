export default function MenuCard({ icon, title, onClick }) {
  return (
    <div className="menu-card" onClick={onClick}>
      <div className="menu-card-icon">{icon}</div>
      <div className="menu-card-title">{title}</div>
    </div>
  );
}
