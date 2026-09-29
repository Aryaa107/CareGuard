import { TrendingDown, TrendingUp } from "lucide-react";
import { Sparkline } from "./Charts";

export default function StatCard({
  icon,
  label,
  value,
  unit,
  status,
  trend = 0,
  tone = "good",
  series,
  onClick,
}) {
  const Trend = trend >= 0 ? TrendingUp : TrendingDown;

  return (
    <div
      className={`stat-card tone-${tone} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === "Enter" && onClick()}
    >
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        {series && <Sparkline data={series} tone={tone === "info" ? "info" : tone} />}
      </div>

      <span className="stat-label">{label}</span>

      <div className="stat-value">
        <strong>{value}</strong>
        {unit && <small>{unit}</small>}
      </div>

      <div className="stat-foot">
        {status && <span className="stat-status">{status}</span>}
        {trend !== 0 && (
          <span className={`stat-trend ${trend > 0 ? "up" : "down"}`}>
            <Trend size={13} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
