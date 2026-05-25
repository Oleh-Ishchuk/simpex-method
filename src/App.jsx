import { useState, useRef, useEffect } from "react";
import { useSimplex } from "./hooks/useSimplex";
import { Sigma, ChevronDown, ChevronUp, ArrowUp } from "lucide-react";
import { fmt } from "./utils/math";
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
  const [inputOpen, setInputOpen] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);

  const handleSolve = () => {
    setHasSolved(true);
    solve();
  };
  const handleReset = () => {
    setHasSolved(false);
    setInputOpen(true);
    reset();
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 200);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const numCons = problem.constraints.length;

  return (
    <div className="app">
      <div className="app-bg" aria-hidden="true" />
      <div className="app-noise" aria-hidden="true" />

      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">
            <Sigma size={16} strokeWidth={2} />
          </div>
          <div>
            <div className="brand-title">SimplexPro</div>
            <div className="brand-sub">Linear Programming Solver</div>
          </div>
        </div>
        <div className="header-right">
          {result && (
            <div className="header-stats">
              <div className="hstat">
                <span className="hstat-label">Ітерацій</span>
                <span className="hstat-value">{result.steps.length - 1}</span>
              </div>
              <div className="hstat">
                <span className="hstat-label">Змінних</span>
                <span className="hstat-value">{problem.numVars}</span>
              </div>
              <div className="hstat">
                <span className="hstat-label">Обмежень</span>
                <span className="hstat-value">{numCons}</span>
              </div>
              <div className="hstat hstat--result">
                <span className="hstat-label">
                  F {result.objType === "max" ? "max" : "min"}
                </span>
                <span className="hstat-value hstat-value--accent">
                  {fmt(result.fval ?? 0)}
                </span>
              </div>
            </div>
          )}
          {solving && (
            <div className="solving-badge">
              <span className="solving-dot" />
              Розв'язую…
            </div>
          )}
        </div>
      </header>

      <div className="page-scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="page-content">
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
                      onChange={(e) => setObjType(e.target.value)}
                    >
                      <option value="max">MAXIMIZE</option>
                      <option value="min">MINIMIZE</option>
                    </select>
                    <div className="vars-control">
                      <span className="vars-label">Змінних</span>
                      <button
                        className="ctrl-btn"
                        onClick={() => setNumVars(-1)}
                      >
                        −
                      </button>
                      <span className="ctrl-val">{problem.numVars}</span>
                      <button
                        className="ctrl-btn"
                        onClick={() => setNumVars(+1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="vars-control">
                      <span className="vars-label">Обмежень</span>
                      <button
                        className="ctrl-btn"
                        onClick={() => setNumCons(-1)}
                      >
                        −
                      </button>
                      <span className="ctrl-val">{numCons}</span>
                      <button
                        className="ctrl-btn"
                        onClick={() => setNumCons(+1)}
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
                    onCoefChange={setObjCoef}
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
                    onCoefChange={setConstraintCoef}
                    onSignChange={setConstraintSign}
                    onRhsChange={setConstraintRhs}
                    onDelete={removeConstraint}
                    onAdd={addConstraint}
                  />
                </div>

                <div className="section-divider" />

                <div className="action-row">
                  <button
                    className={`btn-solve${solving ? " btn-solve--busy" : ""}`}
                    onClick={handleSolve}
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
                  <button className="btn-reset" onClick={handleReset}>
                    ↺ Скинути
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!error && hasSolved && (
            <ProblemDisplay
              problem={problem}
              result={result}
              hasSolved={hasSolved}
            />
          )}

          {hasSolved && (
            <AllIterations result={result} error={error} solving={solving} />
          )}

          {hasSolved && <ResultPanel result={result} />}
        </div>
      </div>

      <button
        className={`scroll-top-btn${showScrollTop ? " scroll-top-btn--visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Прокрутити вгору"
      >
        <ArrowUp size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
