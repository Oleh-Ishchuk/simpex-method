import { fmt, getRowScaleInfo } from "../../utils/math";
import {
  VarName,
  VarList,
  renderLHS,
  signLabel,
  BraceBlock,
  ConstraintRows,
} from "../../utils/renderMath";

const MONO = {
  fontSize: 18,
  color: "var(--text-1)",
  fontFamily: "'Cambria Math','Times New Roman',serif",
};

function ConstraintBlock({
  constraints,
  varNames,
  rowScales = [],
  canonical = false,
  slackCount = 0,
}) {
  const m = constraints.length;
  const allNames = canonical
    ? [
        ...varNames,
        ...Array.from(
          { length: slackCount },
          (_, i) => `x${varNames.length + i + 1}`,
        ),
      ]
    : varNames;

  const rows = constraints.map((c, i) => {
    const scale = rowScales[i]?.factor ?? 1;
    let coefs, rhs;

    if (canonical) {
      const slack = Array(m).fill(0);
      slack[i] = 1;
      coefs = [...c.coefs.map((v) => Number(v) * scale), ...slack];
      rhs = Number(c.rhs) * scale;
      return (
        <>
          {renderLHS(coefs, allNames, {
            showZeros: true,
            slackStartIdx: varNames.length,
          })}
          <span style={{ margin: "0 7px" }}>= {fmt(rhs)}</span>
        </>
      );
    }

    coefs = c.coefs.map((v) => Number(v) * scale);
    rhs = Number(c.rhs) * scale;
    return (
      <>
        {renderLHS(coefs, varNames)}
        <span style={{ margin: "0 7px" }}>
          {signLabel(c.sign)} {fmt(rhs)}
        </span>
      </>
    );
  });

  return (
    <BraceBlock numRows={m + 1}>
      <ConstraintRows
        rows={rows}
        footer={
          <>
            <VarList names={allNames} /> ≥ 0
          </>
        }
      />
    </BraceBlock>
  );
}

export default function ProblemDisplay({ problem, result, hasSolved }) {
  if (!problem) return null;

  const { objCoefs, constraints, objType, numVars } = problem;
  const m = constraints.length;

  const decisionNames = Array.from({ length: numVars }, (_, i) => `x${i + 1}`);
  const slackNames = Array.from({ length: m }, (_, i) => `x${numVars + i + 1}`);

  const rowScales = constraints.map(getRowScaleInfo);
  const simplifyInfo = rowScales
    .map((s, i) => (s.op ? { rowIdx: i + 1, op: s.op, by: s.by } : null))
    .filter(Boolean);

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
          <ConstraintBlock constraints={constraints} varNames={decisionNames} />
        </div>

        {simplifyInfo.length > 0 && (
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

        {hasSolved && result?.canonicalInfo && (
          <div className="math-step">
            <div className="step-text">
              Введемо вільні змінні (
              <VarList names={result.canonicalInfo.slackNames} />
              ):
            </div>

            <div
              style={{ ...MONO, fontSize: 18, marginBottom: 16 }}
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

            <BraceBlock numRows={result.canonicalInfo.constraints.length + 1}>
              <ConstraintRows
                rows={result.canonicalInfo.constraints.map((c) => (
                  <>
                    {renderLHS(c.coefs, result.canonicalInfo.allNames, {
                      showZeros: true,
                      slackStartIdx: result.canonicalInfo.decisionNames.length,
                    })}
                    <span style={{ margin: "0 7px" }}>= {fmt(c.rhs)}</span>
                  </>
                ))}
                footer={
                  <>
                    <VarList names={result.canonicalInfo.allNames} /> ≥ 0
                  </>
                }
              />
            </BraceBlock>

            <div className="step-text" style={{ marginTop: 24 }}>
              Початковий допустимий базисний розв'язок задачі:
            </div>
            <div className="bfs-row">
              {result.canonicalInfo.allNames.map((v, i, arr) => (
                <span key={v} className="bfs-item">
                  <VarName name={v} /> ={" "}
                  {fmt(result.canonicalInfo.initialBFS[v] ?? 0)}
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasSolved && !result?.canonicalInfo && (
          <div className="math-step">
            <div className="step-text">
              Введемо вільні змінні (<VarList names={slackNames} />
              ):
            </div>
            <div
              style={{ ...MONO, fontSize: 18, marginBottom: 16 }}
              className="math-formulation__objective"
            >
              <span className="math-label">
                F(
                <VarList names={[...decisionNames, ...slackNames]} />) =
              </span>{" "}
              {renderLHS(
                [...objCoefs.map(Number), ...Array(m).fill(0)],
                [...decisionNames, ...slackNames],
                { showZeros: true, slackStartIdx: numVars },
              )}{" "}
              → <em className="math-type">{objType}</em>
            </div>
            <ConstraintBlock
              constraints={constraints}
              varNames={decisionNames}
              rowScales={rowScales}
              canonical
              slackCount={m}
            />
          </div>
        )}
      </div>
    </div>
  );
}
