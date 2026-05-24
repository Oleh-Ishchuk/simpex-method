import React from "react";
import { fmt, getRowScaleInfo } from "../../utils/math";
import {
  VarName,
  VarList,
  renderLHS,
  signLabel,
  ThinBrace,
} from "../../utils/renderMath";

function ConstraintBlock({ constraints, varNames, rowScales = [] }) {
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
          const scale = rowScales[i]?.factor ?? 1;
          const coefs = c.coefs.map((v) => Number(v) * scale);
          const rhs = Number(c.rhs) * scale;
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
  rowScales = [],
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
          const scale = rowScales[i]?.factor ?? 1;
          const slack = Array(m).fill(0);
          slack[i] = 1;
          const fullCoefs = [
            ...c.coefs.map((v) => Number(v) * scale),
            ...slack,
          ];
          return (
            <div key={i} style={monoStyle}>
              {renderLHS(fullCoefs, allNames, {
                showZeros: true,
                slackStartIdx: decisionNames.length,
              })}
              <span style={{ margin: "0 7px" }}>
                = {fmt(Number(c.rhs) * scale)}
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

  const rowScales = constraints.map(getRowScaleInfo);
  const simplifyInfo = rowScales
    .map((s, i) => (s.op ? { rowIdx: i + 1, op: s.op, by: s.by } : null))
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
            rowScales={[]}
          />
        </div>

        {canSimplify && (
          <div className="math-step">
            <div className="step-text">
              {simplifyInfo.map((info, i) => (
                <div key={i}>
                  {info.op === "mul"
                    ? `Домножимо ${info.rowIdx} нерівність на ${info.by}, щоб позбутися дробів.`
                    : `Поділимо ${info.rowIdx} нерівність на ${info.by}.`}
                </div>
              ))}
            </div>
            <ConstraintBlock
              constraints={constraints}
              varNames={decisionNames}
              rowScales={rowScales}
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
                rowScales={[]}
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
              rowScales={rowScales}
            />
          </div>
        )}
      </div>
    </div>
  );
}
