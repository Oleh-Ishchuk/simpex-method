import { TrendingUp } from "lucide-react";

export default function Header({ solving }) {
  return (
    <header className="header">
      <div className="header__logo">
        <div className="header__icon">
          <TrendingUp size={18} strokeWidth={1.5} />
        </div>
        <div>
          <div className="header__title">Simplex Solver</div>
          <div className="header__subtitle">LINEAR PROGRAMMING ENGINE</div>
        </div>
      </div>
      {solving && (
        <div className="header__status">
          <span className="status-dot status-dot--solving" aria-hidden="true" />
          <span>SOLVING</span>
        </div>
      )}
    </header>
  );
}
