import { useState } from "react";
import { useSimplex } from "./hooks/useSimplex";
import { TrendingUp } from "lucide-react";
import ObjectiveInput from "./components/ObjectiveInput/ObjectiveInput";
import ConstraintPanel from "./components/ConstraintRow/ConstraintPanel";
import AllIterations from "./components/SimplexTable/SimplexTable";
import ResultPanel from "./components/ResultPanel/ResultPanel";
import ProblemDisplay from "./components/ProblemDisplay/ProblemDisplay";

export default function App() {
  const {
    problem,
    solving,
    result,
    error,
    objPreview,
    setObjType,
    setObjCoef,
    setNumVars,
    setNumCons,
    setConstraintCoef,
    setConstraintSign,
    setConstraintRhs,
    removeConstraint,
    addConstraint,
    solve,
    reset,
  } = useSimplex();

  const [hasSolved, setHasSolved] = useState(false);

  const handleSolve = () => {
    setHasSolved(true);
    solve();
  };

  const handleReset = () => {
    setHasSolved(false);
    reset();
  };

  const numCons = problem.constraints.length;

  return (
    <div className="app">
      <div className="app__grid-bg" aria-hidden="true" />
      <div className="app__scanline" aria-hidden="true" />

      <header className="header">
        <div className="header__logo">
          <div className="header__icon">
            <TrendingUp size={16} strokeWidth={1.5} />
          </div>
          <div>
            <div className="header__title">Симплекс-метод</div>
            <div className="header__subtitle">
              Програма для лінійного програмування
            </div>
          </div>
        </div>

        <div className="header__controls">
          <div className="header__ctrl-group">
            <span className="header__ctrl-label">Ціль</span>
            <select
              className="field__input"
              style={{ width: 130, padding: "6px 28px 6px 10px", fontSize: 11 }}
              value={problem.objType}
              onChange={(e) => setObjType(e.target.value)}
            >
              <option value="max">МАКСИМІЗАЦІЯ</option>
              <option value="min">МІНІМІЗАЦІЯ</option>
            </select>
          </div>

          <div className="header__ctrl-group">
            <span className="header__ctrl-label">Змінних</span>
            <div className="dim-row">
              <button className="dim-btn" onClick={() => setNumVars(-1)}>
                −
              </button>
              <span className="dim-val">{problem.numVars}</span>
              <button className="dim-btn" onClick={() => setNumVars(+1)}>
                +
              </button>
            </div>
          </div>

          <div className="header__ctrl-group">
            <span className="header__ctrl-label">Обмежень</span>
            <div className="dim-row">
              <button className="dim-btn" onClick={() => setNumCons(-1)}>
                −
              </button>
              <span className="dim-val">{numCons}</span>
              <button className="dim-btn" onClick={() => setNumCons(+1)}>
                +
              </button>
            </div>
          </div>

          {solving && (
            <div className="header__status">
              <span
                className="status-dot status-dot--solving"
                aria-hidden="true"
              />
              <span>Розв'язую…</span>
            </div>
          )}
        </div>
      </header>

      <div className="app__layout">
        <aside className="sidebar">
          <div className="sidebar-section-label">Цільова функція</div>
          <ObjectiveInput
            numVars={problem.numVars}
            objCoefs={problem.objCoefs}
            objType={problem.objType}
            objPreview={objPreview}
            onCoefChange={setObjCoef}
          />

          <div className="sidebar-section-label" style={{ marginTop: 20 }}>
            Обмеження
          </div>
          <ConstraintPanel
            constraints={problem.constraints}
            numVars={problem.numVars}
            onCoefChange={setConstraintCoef}
            onSignChange={setConstraintSign}
            onRhsChange={setConstraintRhs}
            onDelete={removeConstraint}
            onAdd={addConstraint}
          />

          {result && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 20 }}>
                Лог
              </div>
              <div className="log-entry">
                <div>
                  <span className="log-entry__key">▸ вхідні дані</span>
                </div>
                <div>
                  змінних:{" "}
                  <span className="log-entry__value">{problem.numVars}</span>
                </div>
                <div>
                  обмежень: <span className="log-entry__value">{numCons}</span>
                </div>
                <div>
                  додаткових:{" "}
                  <span className="log-entry__value">{numCons}</span>
                </div>
                <br />
                <div>
                  <span className="log-entry__key">▸ ітерації</span>
                </div>
                <div>
                  кроків:{" "}
                  <span className="log-entry__value">
                    {result.steps.length - 1}
                  </span>
                </div>
                <br />
                <div>
                  <span className="log-entry__success">▸ оптимально ✓</span>
                </div>
              </div>
            </>
          )}

          <div className="sidebar__actions">
            <button
              className={`btn-solve${solving ? " btn-solve--solving" : ""}`}
              onClick={handleSolve}
              disabled={solving}
            >
              {solving ? "⟳ Розв'язую…" : "Розв'язати"}
            </button>
            <button className="btn-reset" onClick={handleReset}>
              ↺ Скинути
            </button>
          </div>
        </aside>

        <main className="main">
          <ProblemDisplay
            problem={problem}
            result={result}
            hasSolved={hasSolved}
          />
          <AllIterations result={result} error={error} solving={solving} />
          <ResultPanel result={result} />
        </main>
      </div>
    </div>
  );
}
