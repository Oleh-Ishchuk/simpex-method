import React from "react";
import { fmt } from "../../utils/simplex";

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

const VarList = ({ names }) => {
  return (
    <>
      {names.map((name, i) => (
        <React.Fragment key={name}>
          <VarName name={name} />
          {i < names.length - 1 ? ", " : ""}
        </React.Fragment>
      ))}
    </>
  );
};

function getGCD(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  return b === 0 ? a : getGCD(b, a % b);
}

function getRowGCD(c) {
  let g = 0;
  for (const v of [...c.coefs, c.rhs]) {
    const n = Math.abs(Number(v));
    if (n > 1e-9) g = getGCD(g, n);
  }
  return g || 1;
}

function renderLHS(coefs, names, options = {}) {
  const { showZeros = false, slackStartIdx = 999 } = options;

  const parts = coefs.map((cRaw, i) => {
    const c = Number(cRaw);
    if (!showZeros && Math.abs(c) < 1e-9) return null;
    return { val: c, name: names[i], isSlack: i >= slackStartIdx };
  });

  const visible = parts.filter((p) => p !== null);
  if (visible.length === 0) return <span>0</span>;

  return (
    <>
      {visible.map((p, idx) => {
        const isFirst = idx === 0;
        const abs = Math.abs(p.val);
        const sign = p.val < 0 ? "−" : "+";

        let coefStr = "";
        if (abs === 0) {
          coefStr = "0";
        } else if (abs === 1) {
          coefStr = p.isSlack ? "1" : "";
        } else {
          coefStr = fmt(abs);
        }

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

function signLabel(s) {
  return s === "<=" ? "≤" : s === ">=" ? "≥" : "=";
}

function ThinBrace({ numRows }) {
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

function ConstraintBlock({ constraints, varNames, rowGcds = [] }) {
  const numRows = constraints.length + 1;
  const monoStyle = {
    fontSize: 18,
    lineHeight: "34px",
    whiteSpace: "nowrap",
    color: "var(--text-1)",
    fontFamily: "'Cambria Math','Times New Roman',serif",
  };

  return (
    <div
      style={{ display: "flex", alignItems: "center", margin: "6px 0 6px 4px" }}
    >
      <ThinBrace numRows={numRows} />
      <div style={{ display: "flex", flexDirection: "column", paddingLeft: 8 }}>
        {constraints.map((c, i) => {
          const divBy = rowGcds[i] || 1;
          const coefs = c.coefs.map((v) => Number(v) / divBy);
          const rhs = Number(c.rhs) / divBy;
          return (
            <div key={i} style={monoStyle}>
              {renderLHS(coefs, varNames)}
              <span style={{ margin: "0 7px" }}>
                {signLabel(c.sign)} {fmt(rhs)}
              </span>
            </div>
          );
        })}
        <div style={monoStyle}>
          <VarList names={varNames} /> ≥ 0
        </div>
      </div>
    </div>
  );
}

function CanonicalBlock({
  constraints,
  decisionNames,
  slackNames,
  rowGcds = [],
}) {
  const allNames = [...decisionNames, ...slackNames];
  const m = constraints.length;
  const numRows = m + 1;
  const monoStyle = {
    fontSize: 18,
    lineHeight: "34px",
    whiteSpace: "nowrap",
    color: "var(--text-1)",
    fontFamily: "'Cambria Math','Times New Roman',serif",
  };

  return (
    <div
      style={{ display: "flex", alignItems: "center", margin: "6px 0 6px 4px" }}
    >
      <ThinBrace numRows={numRows} />
      <div style={{ display: "flex", flexDirection: "column", paddingLeft: 8 }}>
        {constraints.map((c, i) => {
          const divBy = rowGcds[i] || 1;
          const slackVal = c.sign === ">=" ? -1 : 1;
          const slack = Array(m).fill(0);
          slack[i] = slackVal;
          const fullCoefs = [
            ...c.coefs.map((v) => Number(v) / divBy),
            ...slack,
          ];

          return (
            <div key={i} style={monoStyle}>
              {renderLHS(fullCoefs, allNames, {
                showZeros: true,
                slackStartIdx: decisionNames.length,
              })}
              <span style={{ margin: "0 7px" }}>
                = {fmt(Number(c.rhs) / divBy)}
              </span>
            </div>
          );
        })}
        <div style={monoStyle}>
          <VarList names={allNames} /> ≥ 0
        </div>
      </div>
    </div>
  );
}

export default function ProblemDisplay({ problem, result, hasSolved }) {
  if (!problem) return null;

  const { objCoefs, constraints, objType, numVars } = problem;

  const decisionNames = Array.from({ length: numVars }, (_, i) => `x${i + 1}`);
  const slackNames = Array.from(
    { length: constraints.length },
    (_, i) => `x${numVars + i + 1}`,
  );
  const allNames = [...decisionNames, ...slackNames];

  const rowGcds = constraints.map(getRowGCD);
  const simplifyInfo = rowGcds
    .map((g, i) => (g > 1 ? { rowIdx: i + 1, g } : null))
    .filter(Boolean);
  const canSimplify = simplifyInfo.length > 0;

  const needsNormalization = constraints.some((c) => Number(c.rhs) < 0);
  const normalizationInfo = constraints
    .map((c, i) => (Number(c.rhs) < 0 ? i + 1 : null))
    .filter(Boolean);

  const extObjCoefs = [
    ...objCoefs.map(Number),
    ...Array(constraints.length).fill(0),
  ];

  const monoStyle = {
    fontSize: 18,
    color: "var(--text-1)",
    fontFamily: "'Cambria Math','Times New Roman',serif",
  };

  return (
    <div className="problem-display problem-card">
      <div className="problem-card__header">
        <h2 className="problem-card__title">Постановка задачі</h2>
        <div className="problem-card__divider" />
      </div>

      <div className="problem-card__content">
        <div className="math-formulation">
          <div className="math-formulation__objective">
            <span className="math-label">
              F(
              <VarList names={decisionNames} />) =
            </span>{" "}
            {renderLHS(objCoefs.map(Number), decisionNames)} →{" "}
            <em className="math-type">{objType}</em>
          </div>
          <ConstraintBlock
            constraints={constraints}
            varNames={decisionNames}
            rowGcds={[]}
          />
        </div>

        {canSimplify && (
          <div className="math-step">
            <div className="step-text">
              {simplifyInfo.map((info, i) => (
                <div key={i}>
                  Спростимо систему обмежень, поділивши {info.rowIdx} нерівність
                  на {info.g}.
                </div>
              ))}
            </div>
            <ConstraintBlock
              constraints={constraints}
              varNames={decisionNames}
              rowGcds={rowGcds}
            />
          </div>
        )}

        {hasSolved && (
          <div className="math-step">
            <div className="step-text" style={{ marginBottom: 24 }}>
              Математичну модель задачі приведемо до канонічного вигляду.
            </div>
          </div>
        )}

        {hasSolved && needsNormalization && (
          <div
            className="math-step"
            style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}
          >
            <div className="step-text">
              Оскільки вільні члени не можуть бути від'ємними, помножимо
              нерівність {normalizationInfo.join(", ")} на −1 (змінивши знаки
              нерівностей):
            </div>
            <ConstraintBlock
              constraints={constraints.map((c) =>
                Number(c.rhs) < 0
                  ? {
                      ...c,
                      coefs: c.coefs.map((v) => -v),
                      rhs: -c.rhs,
                      sign:
                        c.sign === "<=" ? ">=" : c.sign === ">=" ? "<=" : "=",
                    }
                  : c,
              )}
              varNames={decisionNames}
              rowGcds={rowGcds}
            />
          </div>
        )}

        {hasSolved && (
          <div className="math-step">
            <div className="step-text">
              Введемо вільні змінні (<VarList names={slackNames} />
              ):
            </div>

            <div
              style={{ ...monoStyle, fontSize: 18, marginBottom: 16 }}
              className="math-formulation__objective"
            >
              <span className="math-label">
                F(
                <VarList names={allNames} />) =
              </span>{" "}
              {renderLHS(extObjCoefs, allNames, {
                showZeros: true,
                slackStartIdx: decisionNames.length,
              })}{" "}
              → <em className="math-type">{objType}</em>
            </div>

            <CanonicalBlock
              constraints={constraints.map((c) =>
                Number(c.rhs) < 0
                  ? {
                      ...c,
                      coefs: c.coefs.map((v) => -v),
                      rhs: -c.rhs,
                      sign:
                        c.sign === "<=" ? ">=" : c.sign === ">=" ? "<=" : "=",
                    }
                  : c,
              )}
              decisionNames={decisionNames}
              slackNames={slackNames}
              rowGcds={rowGcds}
            />

            <div className="step-text" style={{ marginTop: 24 }}>
              Початковий допустимий базисний розв'язок:
            </div>

            <div className="bfs-row">
              {allNames.map((v, i) => {
                const isDecision = i < numVars;
                let val = 0;
                if (!isDecision) {
                  const slackIdx = i - numVars;
                  const c = constraints[slackIdx];
                  const divBy = rowGcds[slackIdx] || 1;
                  // Start with simplified RHS
                  val = Number(c.rhs) / divBy;
                  // If RHS was negative, we normalized (multiplied by -1)
                  if (Number(c.rhs) < 0) val = -val;
                  // If original sign was >=, we have a surplus variable (-x_s)
                  // Equation: ... - x_s = rhs => x_s = -rhs
                  // HOWEVER, if we also normalized (multiplied by -1), 
                  // the sign of x_s flipped to +x_s.
                  // Let's check the actual sign used in the solver/CanonicalBlock.
                  const slackCoef = c.sign === ">=" ? -1 : 1;
                  const normalizedSlackCoef = Number(c.rhs) < 0 ? -slackCoef : slackCoef;
                  // Equation: ... + normalizedSlackCoef * x_s = normalizedRHS
                  // x_s = normalizedRHS / normalizedSlackCoef
                  val = val / normalizedSlackCoef;
                }
                return (
                  <span key={v} className="bfs-item">
                    <VarName name={v} /> = {fmt(val)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
