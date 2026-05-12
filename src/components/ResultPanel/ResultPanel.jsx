import { fmt } from "../../utils/simplex";
import { CheckCircle2 } from "lucide-react";

export default function ResultPanel({ result }) {
  if (!result) return null;
  const { xSol, fval, objType, varNames, n } = result;

  return (
    <div className="result-container" style={{ marginTop: "40px", width: "100%", display: "flex", justifyContent: "center" }}>
      <div className="card result-section optimal-report" style={{ maxWidth: "900px", width: "100%", padding: "40px" }}>
        <div className="report-header" style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="report-icon" style={{ display: "inline-flex", marginBottom: "16px", color: "var(--aurora)" }}>
            <CheckCircle2 size={42} strokeWidth={1} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: "400", letterSpacing: "1px", marginBottom: "8px" }}>
            Оптимальний розв'язок знайдено
          </h2>
          <div className="opt-badge" style={{ display: "inline-flex" }}>✦ ОПТИМАЛЬНИЙ ПЛАН</div>
        </div>

        <div 
          className="optimal-explanation" 
          style={{ 
            fontFamily: "var(--font-mono)", 
            fontSize: "14px", 
            color: "var(--text-2)", 
            marginBottom: "40px",
            lineHeight: "1.8",
            textAlign: "center",
            padding: "20px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--glass-stroke)",
            borderRadius: "12px",
            letterSpacing: "0.5px"
          }}
        >
          В індексному рядку всі оцінки{" "}
          <span style={{ color: "var(--ice)" }}>
            Δ<sub>1</sub>…Δ<sub>{varNames.length}</sub> ≥ 0
          </span>
          . Це свідчить про те, що поточний план є оптимальним.
        </div>

        <div className="result-grid" style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="result-frame">
              <div className="result-frame__label">Змінна x<sub>{i + 1}</sub></div>
              <div className="result-frame__value">{fmt(xSol[i])}</div>
            </div>
          ))}
          <div className="result-frame result-frame--fval">
            <div className="result-frame__label">
              Цільова функція F<sub>{objType === "max" ? "max" : "min"}</sub>
            </div>
            <div className="result-frame__value">{fmt(fval)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
