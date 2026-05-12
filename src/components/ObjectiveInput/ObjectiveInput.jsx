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

function renderPreview(text) {
  if (!text) return null;
  const parts = text.split(/(x\d+)/g);
  return parts.map((part, i) => {
    if (part.match(/^x\d+$/)) {
      return <VarName key={i} name={part} />;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ObjectiveInput({
  numVars,
  objCoefs,
  objType,
  objPreview,
  onCoefChange,
}) {
  return (
    <div>
      <div className="coefs-row">
        {Array.from({ length: numVars }, (_, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <span className="coef-sep">+</span>}
            <div className="coef-wrap">
              <NumInput
                value={objCoefs[i] ?? 0}
                onChange={(val) => onCoefChange(i, val)}
              />
              <span className="coef-wrap__label">
                <VarName name={`x${i + 1}`} />
              </span>
            </div>
          </span>
        ))}
        <span className="arrow-sep">→ {objType === "max" ? "МАКС" : "МІН"}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <span className="obj-preview">{renderPreview(objPreview)}</span>
      </div>
    </div>
  );
}
