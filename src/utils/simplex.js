import { gcd, fmt, getRowScale } from "./math";

function buildDeltaCalcs(tableau, basis, cjComp, delta, z0, total) {
  const calcs = [];
  const terms0 = basis.map(
    (bIdx, i) => `${fmt(cjComp[bIdx])} · ${fmt(tableau[i][total])}`,
  );
  calcs.push({ label: "Δ₀", expr: terms0.join(" + ") + " = " + fmt(z0) });
  for (let j = 0; j < total; j++) {
    const terms = basis.map(
      (bIdx, i) => `${fmt(cjComp[bIdx])} · ${fmt(tableau[i][j])}`,
    );
    const cVal = cjComp[j];
    let expr = terms.join(" + ");
    expr +=
      Math.abs(cVal) > 1e-9
        ? ` - (${fmt(cVal)}) = ${fmt(delta[j])}`
        : ` = ${fmt(delta[j])}`;
    calcs.push({ label: `Δ${j + 1}`, expr });
  }
  return calcs;
}

function computeDelta(currTableau, currBasis, cjComp, varsCount) {
  let z0 = 0;
  const zj = new Array(varsCount).fill(0);
  for (let i = 0; i < currTableau.length; i++) {
    const cb = cjComp[currBasis[i]] ?? 0;
    z0 += cb * currTableau[i][varsCount];
    for (let j = 0; j < varsCount; j++) zj[j] += cb * currTableau[i][j];
  }
  return { delta: zj.map((z, j) => z - cjComp[j]), z0 };
}

function chooseEnteringCol(delta, basis, varsCount) {
  let enteringCol = null;
  let mostNeg = -1e-9;
  for (let j = 0; j < varsCount; j++) {
    if (!basis.includes(j) && delta[j] < mostNeg) {
      mostNeg = delta[j];
      enteringCol = j;
    }
  }
  return enteringCol;
}

function choosePivotRow(currTableau, currBasis, enteringCol, varsCount) {
  const ratios = currTableau.map((row) =>
    row[enteringCol] > 1e-9 ? row[varsCount] / row[enteringCol] : null,
  );
  let pivotRow = -1;
  let minR = Infinity;
  for (let i = 0; i < currTableau.length; i++) {
    if (currTableau[i][enteringCol] > 1e-9) {
      const r = currTableau[i][varsCount] / currTableau[i][enteringCol];
      if (r < minR - 1e-9) {
        minR = r;
        pivotRow = i;
      } else if (Math.abs(r - minR) < 1e-9) {
        if (currBasis[i] < currBasis[pivotRow]) pivotRow = i;
      }
    }
  }
  return { pivotRow, ratios };
}

function normalizeConstraints(constraints) {
  return constraints.map((c, idx) => {
    let coefs = c.coefs.map(Number);
    let rhs = Number(c.rhs);
    let sign = c.sign;

    if (sign === "=") {
      throw new Error(
        `Обмеження ${idx + 1}: знак "=" не підтримується. Використовуйте лише ≤.`,
      );
    }
    if (sign === ">=") {
      if (rhs <= 0) {
        coefs = coefs.map((v) => -v);
        rhs = -rhs;
        sign = "<=";
      } else {
        throw new Error(
          `Обмеження ${idx + 1}: знак "≥" з додатньою правою частиною не підтримується. Використовуйте лише ≤.`,
        );
      }
    }
    if (rhs < 0) {
      throw new Error(
        `Обмеження ${idx + 1}: права частина має бути невід'ємною після нормалізації.`,
      );
    }

    const scale = getRowScale([...coefs, rhs]);
    coefs = coefs.map((v) => v * scale);
    rhs = rhs * scale;

    return { coefs, sign, rhs, scale };
  });
}

export function solveSimplex(objCoefs, constraints, objType) {
  const n = objCoefs.length;
  const m = constraints.length;

  const normConstraints = normalizeConstraints(constraints);

  const numSlack = m;
  const totalVars = n + numSlack;
  const varNames = Array.from({ length: totalVars }, (_, j) => `x${j + 1}`);

  const tableau = [];
  const basis = [];
  for (let i = 0; i < m; i++) {
    const row = new Array(totalVars + 1).fill(0);
    for (let j = 0; j < n; j++) row[j] = normConstraints[i].coefs[j];
    row[n + i] = 1;
    row[totalVars] = normConstraints[i].rhs;
    tableau.push(row);
    basis.push(n + i);
  }

  const initialBFS = Object.fromEntries(varNames.map((name) => [name, 0]));
  for (let i = 0; i < m; i++)
    initialBFS[varNames[basis[i]]] = tableau[i][totalVars];

  const canonicalInfo = {
    decisionNames: varNames.slice(0, n),
    slackNames: varNames.slice(n),
    allNames: [...varNames],
    cjDisplay: [...objCoefs.map(Number), ...Array(numSlack).fill(0)],
    constraints: tableau.map((row) => ({
      coefs: row.slice(0, totalVars),
      rhs: row[totalVars],
    })),
    initialBFS,
    normConstraints,
  };

  const cjComp = new Array(totalVars).fill(0);
  for (let j = 0; j < n; j++) {
    cjComp[j] = objType === "max" ? Number(objCoefs[j]) : -Number(objCoefs[j]);
  }
  const cjDisplay = varNames.map((_, j) => (j < n ? Number(objCoefs[j]) : 0));

  const steps = [];

  const takeSnapshot = (currTableau, currBasis) => {
    const varsCount = currTableau[0].length - 1;
    const { delta, z0 } = computeDelta(
      currTableau,
      currBasis,
      cjComp,
      varsCount,
    );
    const deltaCalcs = buildDeltaCalcs(
      currTableau,
      currBasis,
      cjComp,
      delta,
      z0,
      varsCount,
    );

    const enteringCol = chooseEnteringCol(delta, currBasis, varsCount);
    let pivotRow = -1;
    let ratios = null;

    if (enteringCol !== null) {
      ({ pivotRow, ratios } = choosePivotRow(
        currTableau,
        currBasis,
        enteringCol,
        varsCount,
      ));
    }

    steps.push({
      tableau: currTableau.map((r) => [...r]),
      basis: [...currBasis],
      delta: [...delta],
      z0,
      varNames: varNames.slice(0, varsCount),
      cjDisplay: cjDisplay.slice(0, varsCount),
      cjComp: cjComp.slice(0, varsCount),
      deltaCalcs,
      enteringCol,
      pivotRow,
      ratios,
    });
  };

  takeSnapshot(tableau, basis);

  for (let iter = 0; iter < 200; iter++) {
    const { delta } = computeDelta(tableau, basis, cjComp, totalVars);
    const pivCol = chooseEnteringCol(delta, basis, totalVars);
    if (pivCol === null) break;

    const { pivotRow: pivRow } = choosePivotRow(
      tableau,
      basis,
      pivCol,
      totalVars,
    );
    if (pivRow === -1)
      throw new Error(
        "Цільова функція не обмежена на множині допустимих розв'язків (Unbounded).",
      );

    const pivEl = tableau[pivRow][pivCol];
    for (let j = 0; j <= totalVars; j++) tableau[pivRow][j] /= pivEl;
    for (let i = 0; i < m; i++) {
      if (i === pivRow) continue;
      const factor = tableau[i][pivCol];
      if (Math.abs(factor) < 1e-12) continue;
      for (let j = 0; j <= totalVars; j++)
        tableau[i][j] -= factor * tableau[pivRow][j];
    }
    basis[pivRow] = pivCol;
    takeSnapshot(tableau, basis);
  }

  const { z0 } = computeDelta(tableau, basis, cjComp, totalVars);
  const xSol = new Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    if (basis[i] < n) xSol[basis[i]] = tableau[i][totalVars];
  }

  return {
    steps,
    xSol,
    fval: objType === "max" ? z0 : -z0,
    objType,
    varNames: varNames.slice(0, totalVars),
    n,
    canonicalInfo,
  };
}
