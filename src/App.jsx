import { useState, useRef, useEffect } from "react";
import { useSimplex } from "./hooks/useSimplex";
import { Sigma, ArrowUp } from "lucide-react";
import { fmt } from "./utils/math";
import InputPanel from "./components/InputPanel/InputPanel";
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);

  const handleSolve = () => {
    setHasSolved(true);
    solve();
  };
  const handleReset = () => {
    setHasSolved(false);
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
          <InputPanel
            problem={problem}
            solving={solving}
            objPreview={objPreview}
            onObjTypeChange={setObjType}
            onNumVarsChange={setNumVars}
            onNumConsChange={setNumCons}
            onObjCoefChange={setObjCoef}
            onConstraintCoefChange={setConstraintCoef}
            onConstraintSignChange={setConstraintSign}
            onConstraintRhsChange={setConstraintRhs}
            onRemoveConstraint={removeConstraint}
            onAddConstraint={addConstraint}
            onSolve={handleSolve}
            onReset={handleReset}
          />

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
