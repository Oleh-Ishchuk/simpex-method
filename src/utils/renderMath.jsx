import React from "react";
import { fmt } from "./math";

export const VarName = ({ name }) => {
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

export const VarList = ({ names }) => (
  <>
    {names.map((name, i) => (
      <React.Fragment key={name}>
        <VarName name={name} />
        {i < names.length - 1 ? ", " : ""}
      </React.Fragment>
    ))}
  </>
);

export function signLabel(s) {
  return s === "<=" ? "≤" : s === ">=" ? "≥" : "=";
}

export function renderLHS(coefs, names, options = {}) {
  const { showZeros = false, slackStartIdx = 999 } = options;
  const parts = coefs
    .map((cRaw, i) => {
      const c = Number(cRaw);
      if (!showZeros && Math.abs(c) < 1e-9) return null;
      return { val: c, name: names[i], isSlack: i >= slackStartIdx };
    })
    .filter(Boolean);

  if (parts.length === 0) return <span>0</span>;

  return (
    <>
      {parts.map((p, idx) => {
        const isFirst = idx === 0;
        const abs = Math.abs(p.val);
        const sign = p.val < 0 ? "−" : "+";
        const coefStr =
          abs === 0 ? "0" : abs === 1 && !p.isSlack ? "" : fmt(abs);
        return (
          <span key={idx}>
            {isFirst ? (
              p.val < 0 ? (
                "−"
              ) : (
                ""
              )
            ) : (
              <span style={{ margin: "0 5px" }}>{sign}</span>
            )}
            {coefStr}
            <VarName name={p.name} />
          </span>
        );
      })}
    </>
  );
}

export function ThinBrace({ numRows }) {
  const ROW_H = 34;
  const h = Math.max(numRows * ROW_H, ROW_H);
  const mid = h / 2;
  return (
    <svg
      width="18"
      height={h}
      viewBox={`0 0 18 ${h}`}
      fill="none"
      style={{ flexShrink: 0, alignSelf: "stretch", display: "block" }}
    >
      <path
        d={`M13,4 Q5,4 5,${mid - 5} Q5,${mid} 2,${mid} Q5,${mid} 5,${mid + 5} Q5,${h - 4} 13,${h - 4}`}
        stroke="var(--text-2)"
        strokeWidth="1"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}
