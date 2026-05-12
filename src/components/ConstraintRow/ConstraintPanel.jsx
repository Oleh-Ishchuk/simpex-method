import ConstraintRow from "./ConstraintRow";

export default function ConstraintPanel({
  constraints,
  numVars,
  onCoefChange,
  onSignChange,
  onRhsChange,
  onDelete,
  onAdd,
}) {
  return (
    <div>
      {constraints.map((c, i) => (
        <ConstraintRow
          key={i}
          index={i}
          numVars={numVars}
          coefs={c.coefs}
          sign={c.sign}
          rhs={c.rhs}
          onCoefChange={(col, val) => onCoefChange(i, col, val)}
          onSignChange={(sign) => onSignChange(i, sign)}
          onRhsChange={(val) => onRhsChange(i, val)}
          onDelete={() => onDelete(i)}
          canDelete={constraints.length > 1}
        />
      ))}
      <div
        style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}
      >
        <button className="btn-add-con" onClick={onAdd}>
          + Додати
        </button>
      </div>
      <div className="nonneg-hint">
        x<sub style={{ fontSize: "0.75em" }}>1</sub>, x
        <sub style={{ fontSize: "0.75em" }}>2</sub>, … ≥ 0
      </div>
    </div>
  );
}
