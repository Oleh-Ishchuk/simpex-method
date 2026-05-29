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
        objCoefs:
          delta > 0
            ? [...p.objCoefs, ...Array(delta).fill(0)]
            : p.objCoefs.slice(0, next),
        constraints: p.constraints.map((c) => ({
          ...c,
          coefs:
            delta > 0
              ? [...c.coefs, ...Array(delta).fill(0)]
              : c.coefs.slice(0, next),
        })),
      };
    });
  }, []);

  const setNumCons = useCallback((delta) => {
    setProblem((p) => {
      const nextLen = Math.min(6, Math.max(1, p.constraints.length + delta));
      if (nextLen === p.constraints.length) return p;

      if (nextLen > p.constraints.length) {
        const addCount = nextLen - p.constraints.length;
        return {
          ...p,
          constraints: [
            ...p.constraints,
            ...Array(addCount)
              .fill(null)
              .map(() => makeDefaultConstraint(p.numVars)),
          ],
        };
      } else {
        return { ...p, constraints: p.constraints.slice(0, nextLen) };
      }
    });
  }, []);

  const setConstraintCoef = useCallback((cIdx, vIdx, val) => {
    setProblem((p) => {
      const constraints = [...p.constraints];
      const coefs = [...constraints[cIdx].coefs];
      coefs[vIdx] = val;
      constraints[cIdx] = { ...constraints[cIdx], coefs };
      return { ...p, constraints };
    });
  }, []);

  const setConstraintSign = useCallback((cIdx, sign) => {
    setProblem((p) => {
      const constraints = [...p.constraints];
      constraints[cIdx] = { ...constraints[cIdx], sign };
      return { ...p, constraints };
    });
  }, []);

  const setConstraintRhs = useCallback((cIdx, val) => {
    setProblem((p) => {
      const constraints = [...p.constraints];
      constraints[cIdx] = { ...constraints[cIdx], rhs: val };
      return { ...p, constraints };
    });
  }, []);

  const removeConstraint = useCallback((idx) => {
    setProblem((p) => {
      if (p.constraints.length <= 1) return p;
      return {
        ...p,
        constraints: p.constraints.filter((_, i) => i !== idx),
      };
    });
  }, []);

  const addConstraint = useCallback(() => {
    setProblem((p) => {
      if (p.constraints.length >= 6) return p;
      return {
        ...p,
        constraints: [...p.constraints, makeDefaultConstraint(p.numVars)],
      };
    });
  }, []);

  const solve = useCallback(() => {
    setSolving(true);
    setError(null);
    setResult(null);

    const isInvalid = (val) =>
      val === "" ||
      val === null ||
      val === undefined ||
      String(val).trim() === "" ||
      isNaN(Number(val));

    if (problem.objCoefs.some(isInvalid)) {
      setError("Введено некоректні дані");
      setSolving(false);
      return;
    }

    let hasInvalid = false;
    const cleanConstraints = problem.constraints.map((c) => {
      if (isInvalid(c.rhs)) hasInvalid = true;
      const coefs = c.coefs.map((v) => {
        if (isInvalid(v)) hasInvalid = true;
        return Number(v);
      });
      return {
        ...c,
        coefs,
        rhs: Number(c.rhs),
      };
    });

    if (hasInvalid) {
      setError("Введено некоректні дані");
      setSolving(false);
      return;
    }

    setTimeout(() => {
      try {
        const res = solveSimplex(
          problem.objCoefs.map((v) => Number(v)),
          cleanConstraints,
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
    return `F = ${parts}`;
  }, [problem.objCoefs]);

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
