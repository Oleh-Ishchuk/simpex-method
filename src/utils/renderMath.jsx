import React from "react";
import { fmt } from "./math";

export const cx = (...args) => args.filter(Boolean).join(" ");

export const MONO_STYLE = {
  fontSize: 18,
  lineHeight: "34px",
  whiteSpace: "nowrap",
  color: "var(--text-1)",
  fontFamily: "'Cambria Math','Times New Roman',serif",
};

export const VarName = ({ name }) => {
  if (typeof name !== "string") return name;
  const match = name.match(/^([a-zA-Z]+)(\d+)$/);
  if (!match) return <span>{name}</span>;
  return (
    <span>
      {match[1]}
      <sub style={{ fontSize: "0.75em" }}>{match[2]}</sub>
    </span>
  );
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

export const signLabel = (s) => (s === "<=" ? "≤" : s === ">=" ? "≥" : "=");

export function renderLHS(
  coefs,
  names,
  { showZeros = false, slackStartIdx = 999 } = {},
) {
  const parts = coefs
    .map((cRaw, i) => {
      const c = Number(cRaw);
      if (!showZeros && Math.abs(c) < 1e-9) return null;
      return { val: c, name: names[i], isSlack: i >= slackStartIdx };
    })
    .filter(Boolean);

  if (!parts.length) return <span>0</span>;

  return (
    <>
      {parts.map((p, idx) => {
        const abs = Math.abs(p.val);
        const sign = p.val < 0 ? "−" : "+";
        const coefStr = abs === 1 && !p.isSlack ? "" : fmt(abs);
        return (
          <span key={idx}>
            {idx === 0 ? (
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
  const h = Math.max(numRows * 34, 34);
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

export function ConstraintRows({ rows, footer }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", paddingLeft: 8 }}>
      {rows.map((content, i) => (
        <div key={i} style={MONO_STYLE}>
          {content}
        </div>
      ))}
      {footer && <div style={MONO_STYLE}>{footer}</div>}
    </div>
  );
}

export function BraceBlock({ numRows, children }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", margin: "6px 0 6px 4px" }}
    >
      <ThinBrace numRows={numRows} />
      {children}
    </div>
  );
}
