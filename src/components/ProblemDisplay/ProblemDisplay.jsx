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

const VarList = ({ names }) => (
  <>
    {names.map((name, i) => (
      <React.Fragment key={name}>
        <VarName name={name} />
        {i < names.length - 1 ? ", " : ""}
      </React.Fragment>
    ))}
  </>
);

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
      <ThinBrace numRows={constraints.length + 1} />
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
      <ThinBrace numRows={m + 1} />
      <div style={{ display: "flex", flexDirection: "column", paddingLeft: 8 }}>
        {constraints.map((c, i) => {
          const divBy = rowGcds[i] || 1;
          const slack = Array(m).fill(0);
          slack[i] = 1;
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

  const rowGcds = constraints.map(getRowGCD);
  const simplifyInfo = rowGcds
    .map((g, i) => (g > 1 ? { rowIdx: i + 1, g } : null))
    .filter(Boolean);
  const canSimplify = simplifyInfo.length > 0;

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

        {hasSolved &&
          constraints.some((c) => c.sign === ">=" && Number(c.rhs) <= 0) && (
            <div className="math-step">
              <div className="step-text">
                Оскільки є обмеження зі знаком "≥" та від'ємною правою частиною,
                помножимо їх на −1 (змінивши знак нерівності):
              </div>
              <ConstraintBlock
                constraints={constraints.map((c) =>
                  c.sign === ">=" && Number(c.rhs) <= 0
                    ? {
                        ...c,
                        coefs: c.coefs.map((v) => -v),
                        rhs: -c.rhs,
                        sign: "<=",
                      }
                    : c,
                )}
                varNames={decisionNames}
                rowGcds={[]}
              />
            </div>
          )}

        {hasSolved && (
          <div className="math-step">
            <div className="step-text" style={{ marginBottom: 24 }}>
              Математичну модель задачі приведено до канонічного вигляду.
            </div>
          </div>
        )}

        {hasSolved && result && result.canonicalInfo && (
          <div className="math-step">
            <div className="step-text">
              Введемо вільні змінні (
              <VarList names={result.canonicalInfo.slackNames} />
              ):
            </div>

            <div
              style={{ ...monoStyle, fontSize: 18, marginBottom: 16 }}
              className="math-formulation__objective"
            >
              <span className="math-label">
                F(
                <VarList names={result.canonicalInfo.allNames} />) =
              </span>{" "}
              {renderLHS(
                result.canonicalInfo.cjDisplay,
                result.canonicalInfo.allNames,
                {
                  showZeros: true,
                  slackStartIdx: result.canonicalInfo.decisionNames.length,
                },
              )}{" "}
              → <em className="math-type">{objType}</em>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "6px 0 6px 4px",
              }}
            >
              <ThinBrace
                numRows={result.canonicalInfo.constraints.length + 1}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingLeft: 8,
                }}
              >
                {result.canonicalInfo.constraints.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      ...monoStyle,
                      fontSize: 18,
                      lineHeight: "34px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {renderLHS(c.coefs, result.canonicalInfo.allNames, {
                      showZeros: true,
                      slackStartIdx: result.canonicalInfo.decisionNames.length,
                    })}
                    <span style={{ margin: "0 7px" }}>= {fmt(c.rhs)}</span>
                  </div>
                ))}
                <div
                  style={{
                    ...monoStyle,
                    fontSize: 18,
                    lineHeight: "34px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <VarList names={result.canonicalInfo.allNames} /> ≥ 0
                </div>
              </div>
            </div>

            <div className="step-text" style={{ marginTop: 24 }}>
              Початковий допустимий базисний розв'язок задачі:
            </div>

            <div className="bfs-row">
              {result.canonicalInfo.allNames.map((v, i) => {
                const val = result.canonicalInfo.initialBFS[v] ?? 0;
                return (
                  <span key={v} className="bfs-item">
                    <VarName name={v} /> = {fmt(val)}
                    {i < result.canonicalInfo.allNames.length - 1 ? ", " : ""}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {hasSolved && (!result || !result.canonicalInfo) && (
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
                <VarList names={[...decisionNames, ...slackNames]} />) =
              </span>{" "}
              {renderLHS(extObjCoefs, [...decisionNames, ...slackNames], {
                showZeros: true,
                slackStartIdx: decisionNames.length,
              })}{" "}
              → <em className="math-type">{objType}</em>
            </div>
            <CanonicalBlock
              constraints={constraints}
              decisionNames={decisionNames}
              slackNames={slackNames}
              rowGcds={rowGcds}
            />
          </div>
        )}
      </div>
    </div>
  );
}
