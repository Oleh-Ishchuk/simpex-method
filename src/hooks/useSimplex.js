import { useState, useCallback, useMemo } from "react";
import { solveSimplex } from "../utils/simplex";

const makeDefaultConstraint = (numVars) => ({
  coefs: Array(numVars).fill(0),
  sign: "<=",
  rhs: 0,
});

const makeDefaultState = () => ({
  numVars: 2,
  objType: "max",
  objCoefs: Array(2).fill(0),
  constraints: Array(2)
    .fill(null)
    .map(() => makeDefaultConstraint(2)),
});

export function useSimplex() {
  const [problem, setProblem] = useState(makeDefaultState);
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const setObjType = useCallback(
    (val) => setProblem((p) => ({ ...p, objType: val })),
    [],
  );

  const setObjCoef = useCallback((idx, val) => {
    setProblem((p) => {
      const objCoefs = [...p.objCoefs];
      objCoefs[idx] = val;
      return { ...p, objCoefs };
    });
  }, []);

  const setNumVars = useCallback((delta) => {
    setProblem((p) => {
      const next = Math.min(6, Math.max(1, p.numVars + delta));
      if (next === p.numVars) return p;
      return {
        ...p,
        numVars: next,
        objCoefs: Array(next)
          .fill(0)
          .map((_, i) => p.objCoefs[i] ?? 0),
        constraints: p.constraints.map((c) => ({
          ...c,
          coefs: Array(next)
            .fill(0)
            .map((_, i) => c.coefs[i] ?? 0),
        })),
      };
    });
  }, []);

  const setNumCons = useCallback((delta) => {
    setProblem((p) => {
      const next = Math.min(6, Math.max(1, p.constraints.length + delta));
      if (next === p.constraints.length) return p;
      let cons = [...p.constraints];
      while (cons.length < next) cons.push(makeDefaultConstraint(p.numVars));
      return { ...p, constraints: cons.slice(0, next) };
    });
  }, []);

  const setConstraintCoef = useCallback((ri, ci, val) => {
    setProblem((p) => ({
      ...p,
      constraints: p.constraints.map((c, i) => {
        if (i !== ri) return c;
        const coefs = [...c.coefs];
        coefs[ci] = val;
        return { ...c, coefs };
      }),
    }));
  }, []);

  const setConstraintSign = useCallback((ri, sign) => {
    setProblem((p) => ({
      ...p,
      constraints: p.constraints.map((c, i) => (i === ri ? { ...c, sign } : c)),
    }));
  }, []);

  const setConstraintRhs = useCallback((ri, val) => {
    setProblem((p) => ({
      ...p,
      constraints: p.constraints.map((c, i) =>
        i === ri ? { ...c, rhs: val } : c,
      ),
    }));
  }, []);

  const removeConstraint = useCallback((ri) => {
    setProblem((p) =>
      p.constraints.length <= 1
        ? p
        : {
            ...p,
            constraints: p.constraints.filter((_, i) => i !== ri),
          },
    );
  }, []);

  const addConstraint = useCallback(() => {
    setProblem((p) =>
      p.constraints.length >= 6
        ? p
        : {
            ...p,
            constraints: [...p.constraints, makeDefaultConstraint(p.numVars)],
          },
    );
  }, []);

  const solve = useCallback(() => {
    setError(null);
    setResult(null);
    setSolving(true);

    const getGCD = (a, b) => {
      a = Math.abs(Math.round(a));
      b = Math.abs(Math.round(b));
      return b === 0 ? a : getGCD(b, a % b);
    };

    const simplifiedConstraints = problem.constraints.map((c) => {
      let g = 0;
      const allVals = [...c.coefs, c.rhs];
      for (const v of allVals) {
        const n = Math.abs(Number(v));
        if (n > 1e-9) g = getGCD(g, n);
      }
      const divBy = g || 1;
      return {
        ...c,
        coefs: c.coefs.map((v) => Number(v) / divBy),
        rhs: Number(c.rhs) / divBy,
      };
    });

    setTimeout(() => {
      try {
        const res = solveSimplex(
          problem.objCoefs,
          simplifiedConstraints,
          problem.objType,
        );
        setResult(res);
      } catch (e) {
        setError(e.message);
      } finally {
        setSolving(false);
      }
    }, 350);
  }, [problem]);

  const reset = useCallback(() => {
    setProblem(makeDefaultState());
    setResult(null);
    setError(null);
    setSolving(false);
  }, []);

  const objPreview = useMemo(() => {
    const parts = problem.objCoefs.map((c, i) => `${c}x${i + 1}`).join(" + ");
    return `F = ${parts} → ${problem.objType === "max" ? "МАКС" : "МІН"}`;
  }, [problem.objCoefs, problem.objType]);

  return {
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
  };
}
