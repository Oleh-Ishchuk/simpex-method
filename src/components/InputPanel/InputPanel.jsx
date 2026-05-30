import { useState } from "react";
import { Sigma, ChevronDown, ChevronUp } from "lucide-react";
import ObjectiveInput from "../ObjectiveInput/ObjectiveInput";
import ConstraintPanel from "../ConstraintRow/ConstraintPanel";

export default function InputPanel({
  problem,
  solving,
  objPreview,
  onObjTypeChange,
  onNumVarsChange,
  onNumConsChange,
  onObjCoefChange,
  onConstraintCoefChange,
  onConstraintSignChange,
  onConstraintRhsChange,
  onRemoveConstraint,
  onAddConstraint,
  onSolve,
  onReset
}) {
  const [inputOpen, setInputOpen] = useState(true);
  const numCons = problem.constraints.length;

  return (
    <div className="input-card">
      <div
        className="input-card-header"
        onClick={() => setInputOpen((o) => !o)}
      >
        <div className="input-card-title">
          <span className="title-pill">Задача</span>
          <span className="title-text">Налаштування</span>
        </div>
        <div className="input-card-meta">
          <span className="meta-chip">
            {problem.objType === "max" ? "MAX" : "MIN"}
          </span>
          <span className="meta-chip">{problem.numVars} змін.</span>
          <span className="meta-chip">{numCons} обм.</span>
          <button className="collapse-btn">
            {inputOpen ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        </div>
      </div>

      <div
        className={`input-card-body${inputOpen ? " input-card-body--open" : ""}`}
      >
        <div className="input-card-inner">
          <div className="obj-section">
            <div className="section-label">
              <span className="section-dot" />
              Цільова функція
            </div>
            <div className="obj-controls">
              <select
                className="type-select"
                value={problem.objType}
                onChange={(e) => onObjTypeChange(e.target.value)}
              >
                <option value="max">MAXIMIZE</option>
                <option value="min">MINIMIZE</option>
              </select>
              <div className="vars-control">
                <span className="vars-label">Змінних</span>
                <button
                  className="ctrl-btn"
                  onClick={() => onNumVarsChange(-1)}
                >
                  −
                </button>
                <span className="ctrl-val">{problem.numVars}</span>
                <button
                  className="ctrl-btn"
                  onClick={() => onNumVarsChange(+1)}
                >
                  +
                </button>
              </div>
              <div className="vars-control">
                <span className="vars-label">Обмежень</span>
                <button
                  className="ctrl-btn"
                  onClick={() => onNumConsChange(-1)}
                >
                  −
                </button>
                <span className="ctrl-val">{numCons}</span>
                <button
                  className="ctrl-btn"
                  onClick={() => onNumConsChange(+1)}
                >
                  +
                </button>
              </div>
            </div>
            <ObjectiveInput
              numVars={problem.numVars}
              objCoefs={problem.objCoefs}
              objType={problem.objType}
              objPreview={objPreview}
              onCoefChange={onObjCoefChange}
            />
          </div>

          <div className="section-divider" />

          <div className="con-section">
            <div className="section-label">
              <span className="section-dot section-dot--blue" />
              Система обмежень
            </div>
            <ConstraintPanel
              constraints={problem.constraints}
              numVars={problem.numVars}
              onCoefChange={onConstraintCoefChange}
              onSignChange={onConstraintSignChange}
              onRhsChange={onConstraintRhsChange}
              onDelete={onRemoveConstraint}
              onAdd={onAddConstraint}
            />
          </div>

          <div className="section-divider" />

          <div className="action-row">
            <button
              className={`btn-solve${solving ? " btn-solve--busy" : ""}`}
              onClick={onSolve}
              disabled={solving}
            >
              {solving ? (
                <>
                  <span className="btn-spinner" /> Розв'язую…
                </>
              ) : (
                <>
                  <Sigma size={15} /> Розв'язати
                </>
              )}
            </button>
            <button className="btn-reset" onClick={onReset}>
              ↺ Скинути
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
