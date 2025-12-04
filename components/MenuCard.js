// components/MenuCard.js

export default function MenuCard({ icon, title, description, onClick }) {
  return (
    <div className="menu-card" onClick={onClick}>
      <div className="menu-card__icon">{icon}</div>
      <div>
        <div className="menu-card__title">{title}</div>
        {description && (
          <div className="menu-card__desc">{description}</div>
        )}
      </div>
    </div>
  );
}
