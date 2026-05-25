import React from "react";
import { fmt } from "../../utils/math";
import { VarName, cx } from "../../utils/renderMath";

export default function AllIterations({ result, error, solving }) {
  if (error)
    return (
      <div className="iter-card">
        <div className="error-msg">⚠ {error}</div>
      </div>
    );
  if (solving)
    return (
      <div className="iter-card solving-card">
        <div className="solving-loader">
          <div className="solving-loader__bar" />
          <div className="solving-loader__text">
            Обчислення оптимального плану…
          </div>
        </div>
      </div>
    );
  if (!result)
    return (
      <div className="iter-card">
        <div className="empty-hint">
          Введіть задачу та натисніть Розв'язати →
        </div>
      </div>
    );

  const { steps, xSol, fval, objType, varNames, n } = result;
  return (
    <div className="all-iterations">
      {steps.map((step, idx) => (
        <IterationBlock key={idx} step={step} idx={idx} varNames={varNames} />
      ))}
    </div>
  );
}

function colCx(j, entCol, extra = "") {
  return cx(
    extra,
    j === entCol && "tc-col-ent tc-pivot-col",
    j === entCol - 1 && entCol > 0 && "tc-pivot-col-prev",
  );
}

function IterationBlock({ step, idx, varNames }) {
  const {
    tableau,
    basis,
    delta,
    z0,
    cjDisplay,
    deltaCalcs,
    enteringCol,
    pivotRow,
    ratios,
    varNames: stepVarNames,
  } = step;
  const names = stepVarNames || varNames;
  const total = tableau[0].length - 1;
  const isOptimal = delta.every((d) => d >= -1e-9);
  const entCol = !isOptimal && enteringCol !== null ? enteringCol : -1;
  const pivEl = pivotRow >= 0 && entCol >= 0 ? tableau[pivotRow][entCol] : null;

  const fmtCj = (j) =>
    typeof cjDisplay[j] === "string" ? cjDisplay[j] : fmt(cjDisplay[j] ?? 0);

  return (
    <div className="iter-card">
      <div className="iter-header">
        <span className="iter-tag">Таблиця {idx + 1}</span>
        {entCol >= 0 && (
          <span className="iter-pivot-col">
            Напрямний стовпець — A
            <sub style={{ fontSize: "0.75em" }}>{entCol + 1}</sub>
          </span>
        )}
      </div>

      <div className="table-scroll">
        <table className="simplex-table">
          <thead>
            <tr className="tr-cj">
              <td className="tc-blank" />
              <td className="tc-head">C</td>
              <td className="tc-head tc-dash">–</td>
              {names.map((_, j) => (
                <td key={j} className={colCx(j, entCol, "tc-cj")}>
                  {fmtCj(j)}
                </td>
              ))}
            </tr>
            <tr className="tr-names">
              <td className="tc-blank" />
              <td className="tc-head">B</td>
              <td className="tc-head">A₀</td>
              {names.map((_, j) => (
                <td key={j} className={colCx(j, entCol, "tc-aname")}>
                  A<sub style={{ fontSize: "0.75em" }}>{j + 1}</sub>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableau.map((row, i) => {
              const bIdx = basis[i];
              const isLeaving = i === pivotRow && !isOptimal;
              return (
                <tr
                  key={i}
                  className={cx(
                    isLeaving && "tr-leaving tr-pivot-row",
                    i === pivotRow - 1 && !isOptimal && "tr-pivot-row-prev",
                  )}
                >
                  <td className="tc-cb">{fmtCj(bIdx)}</td>
                  <td className={cx("tc-basis", isLeaving && "tc-basis-leave")}>
                    <VarName name={names[bIdx]} />
                    {isLeaving && <span className="leave-arrow"> ←</span>}
                  </td>
                  <td className="tc-rhs">{fmt(row[total])}</td>
                  {Array.from({ length: total }, (_, j) => {
                    const isPivot =
                      i === pivotRow && j === entCol && !isOptimal;
                    return (
                      <td
                        key={j}
                        className={cx(
                          isPivot
                            ? "tc-pivot tc-pivot-col"
                            : j === entCol && "tc-col-ent tc-pivot-col",
                          j === entCol - 1 &&
                            entCol > 0 &&
                            !isOptimal &&
                            "tc-pivot-col-prev",
                        )}
                      >
                        {isPivot ? (
                          <span className="pivot-inner">{fmt(row[j])}</span>
                        ) : (
                          fmt(row[j])
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr className="tr-delta">
              <td className="tc-blank" />
              <td className="tc-delta-label">Δ</td>
              <td className="tc-delta-z">{fmt(z0)}</td>
              {delta.map((d, j) => (
                <td
                  key={j}
                  className={cx(
                    d < -1e-9 ? "tc-neg" : d > 1e-9 ? "tc-pos" : "",
                    j === entCol ? "tc-col-ent-delta tc-pivot-col" : "",
                    j === entCol - 1 && entCol > 0 && "tc-pivot-col-prev",
                  )}
                >
                  {fmt(d)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="delta-calcs">
        <div className="delta-calcs__title">Оцінки індексного рядка:</div>
        <div className="delta-calcs__list">
          {deltaCalcs.map((calc, i) => (
            <div key={i} className="delta-row">
              <span className="delta-lbl">
                Δ<sub style={{ fontSize: "0.75em" }}>{i === 0 ? 0 : i}</sub> =
              </span>
              <span className="delta-val">{calc.expr}</span>
            </div>
          ))}
        </div>
      </div>

      {!isOptimal && pivotRow >= 0 && pivEl !== null && (
        <div className="pivot-summary">
          <div>
            Напрямний стовпець —{" "}
            <strong>
              A<sub style={{ fontSize: "0.7em" }}>{entCol + 1}</sub>
            </strong>{" "}
            (за найвід'ємнішою оцінкою Δ
            <sub style={{ fontSize: "0.7em" }}>{entCol + 1}</sub> ={" "}
            {fmt(delta[entCol])}), змінна що входить у базис —{" "}
            <strong>
              <VarName name={names[entCol]} />
            </strong>
            .
          </div>
          <div>
            Напрямний рядок —{" "}
            <strong>
              <VarName name={names[basis[pivotRow]]} />
            </strong>{" "}
            (за найменшим з відношень — min(
            {ratios
              ?.map((r, i) =>
                r !== null
                  ? `${fmt(tableau[i][total])}/${fmt(tableau[i][entCol])}`
                  : null,
              )
              .filter(Boolean)
              .join("; ")}
            ) = {fmt(tableau[pivotRow][total] / pivEl)}). Змінна{" "}
            <strong>
              <VarName name={names[basis[pivotRow]]} />
            </strong>{" "}
            виводиться з базису.
          </div>
          <div>
            Напрямний елемент —{" "}
            <span className="pivot-el-badge">{fmt(pivEl)}</span> (на перетині
            напрямного стовпця та напрямного рядка).
          </div>
        </div>
      )}
    </div>
  );
}
