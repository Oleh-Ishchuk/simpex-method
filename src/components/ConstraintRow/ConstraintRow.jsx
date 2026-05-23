import NumInput from "../common/NumInput";
import React from "react";

const VarName = ({ name }) => {
  if (typeof name !== "string") return name;
  const match = name.match(/^([a-zA-Z]+)(\d+)$/);
  if (match) {
    return (
      <span>
        {match[1]}
        <sub style={{ fontSize: "0.75em" }}>{match[2]}</sub>
      </span>
    );
  }
  return <span>{name}</span>;
};

const SIGNS = ["<=", ">="];
const SIGN_LABELS = { "<=": "≤", ">=": "≥" };

export default function ConstraintRow({
  index,
  numVars,
  coefs,
  sign,
  rhs,
  onCoefChange,
  onSignChange,
  onRhsChange,
  onDelete,
  canDelete,
}) {
  const cycleSign = () => {
    const idx = SIGNS.indexOf(sign);
    onSignChange(SIGNS[(idx + 1) % SIGNS.length]);
  };

  const signInvalid = sign === ">=" && Number(rhs) > 0;

  return (
    <>
      <div className="constraint-row">
        <span className="constraint-row__idx">{index + 1}.</span>
        {Array.from({ length: numVars }, (_, j) => (
          <span key={j} style={{ display: "contents" }}>
            {j > 0 && <span className="con-sep">+</span>}
            <div className="con-input-wrap">
              <NumInput
                value={coefs[j] ?? 0}
                onChange={(val) => onCoefChange(j, val)}
                className="con-num"
              />
              <span className="con-var-label">
                <VarName name={`x${j + 1}`} />
              </span>
            </div>
          </span>
        ))}
        <button
          className="con-sign-btn"
          onClick={cycleSign}
          style={
            signInvalid
              ? { color: "var(--danger)", borderColor: "var(--danger)" }
              : {}
          }
        >
          {SIGN_LABELS[sign] ?? sign}
        </button>
        <NumInput
          value={rhs}
          onChange={(val) => onRhsChange(val)}
          className="con-num"
        />
        <button
          className="con-del-btn"
          onClick={onDelete}
          disabled={!canDelete}
        >
          ×
        </button>
      </div>
      {signInvalid && (
        <div
          style={{
            fontSize: 10,
            color: "var(--danger)",
            paddingLeft: 16,
            marginTop: -4,
            marginBottom: 4,
          }}
        >
          ≥ з додатнім значенням не підтримується. Введіть від'ємне значення.
        </div>
      )}
    </>
  );
}
