import { fmt } from "../../utils/math";
import { CheckCircle2 } from "lucide-react";

export default function ResultPanel({ result }) {
  if (!result) return null;
  const { xSol, fval, objType, varNames, n } = result;

  return (
    <div className="result-container">
      <div className="result-section optimal-report">
        <div className="result-header">
          <div className="result-icon">
            <CheckCircle2 size={36} strokeWidth={1.5} />
          </div>
          <h2 className="result-title">Оптимальний розв'язок знайдено</h2>
          <div className="opt-badge">✦ ОПТИМАЛЬНИЙ ПЛАН</div>
        </div>

        <div className="result-explanation">
          В індексному рядку всі оцінки{" "}
          <span style={{ color: "var(--blue)", fontWeight: 600 }}>
            Δ<sub>1</sub>…Δ<sub>{varNames.length}</sub> ≥ 0
          </span>
          . Це свідчить про те, що поточний план є оптимальним.
        </div>

        <div className="result-grid">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="result-frame">
              <div className="result-frame__label">
                Змінна x<sub>{i + 1}</sub>
              </div>
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
