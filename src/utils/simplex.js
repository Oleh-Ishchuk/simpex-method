function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  return b === 0 ? a : gcd(b, a % b);
}

export function fmt(n) {
  if (Math.abs(n) < 1e-9) return "0";
  const neg = n < 0;
  const abs = Math.abs(n);
  for (let den = 1; den <= 9999; den++) {
    const num = Math.round(abs * den);
    if (Math.abs(num / den - abs) < 1e-9) {
      const g = gcd(num, den);
      const sNum = num / g;
      const sDen = den / g;
      const core = sDen === 1 ? `${sNum}` : `${sNum}/${sDen}`;
      return neg ? `-${core}` : core;
    }
  }
  return n.toFixed(4).replace(/\.?0+$/, "");
}

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
    const suffix =
      Math.abs(cVal) > 1e-9
        ? ` - (${fmt(cVal)}) = ${fmt(delta[j])}`
        : ` = ${fmt(delta[j])}`;
    calcs.push({ label: `Δ${j + 1}`, expr: terms.join(" + ") + suffix });
  }
  return calcs;
}

export function solveSimplex(objCoefs, constraints, objType) {
  const n = objCoefs.length;
  const m = constraints.length;

  // Нормалізація: >= з від'ємним RHS → множимо на -1 → стає <=
  // >= з додатнім RHS → помилка (потрібен штучний базис)
  const normConstraints = constraints.map((c, idx) => {
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
        // множимо на -1: >= від'ємного → <= додатнього
        coefs = coefs.map((v) => -v);
        rhs = -rhs;
        sign = "<=";
      } else {
        throw new Error(
          `Обмеження ${idx + 1}: знак "≥" з додатньою правою частиною не підтримується методом симплекс-таблиць. Використовуйте лише ≤.`,
        );
      }
    }

    if (rhs < 0) {
      throw new Error(
        `Обмеження ${idx + 1}: права частина має бути невід'ємною після нормалізації.`,
      );
    }

    return { coefs, sign, rhs };
  });

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

  const initialBFS = {};
  varNames.forEach((name) => {
    initialBFS[name] = 0;
  });
  for (let i = 0; i < m; i++)
    initialBFS[varNames[basis[i]]] = tableau[i][totalVars];

  const canonicalInfo = {
    decisionNames: varNames.slice(0, n),
    slackNames: varNames.slice(n),
    artNames: [],
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

  const computeDelta = (currTableau, currBasis, varsCount) => {
    let z0 = 0;
    const zj = new Array(varsCount).fill(0);
    for (let i = 0; i < currTableau.length; i++) {
      const cb = cjComp[currBasis[i]] ?? 0;
      z0 += cb * currTableau[i][varsCount];
      for (let j = 0; j < varsCount; j++) zj[j] += cb * currTableau[i][j];
    }
    return { delta: zj.map((z, j) => z - cjComp[j]), z0 };
  };

  const steps = [];

  const takeSnapshot = (currTableau, currBasis) => {
    const varsCount = currTableau[0].length - 1;
    const { delta, z0 } = computeDelta(currTableau, currBasis, varsCount);
    const deltaCalcs = buildDeltaCalcs(
      currTableau,
      currBasis,
      cjComp,
      delta,
      z0,
      varsCount,
    );

    let enteringCol = null;
    let pivotRow = -1;
    let ratios = null;

    for (let j = 0; j < varsCount; j++) {
      if (!currBasis.includes(j) && delta[j] < -1e-9) {
        enteringCol = j;
        break;
      }
    }

    if (enteringCol !== null) {
      ratios = currTableau.map((row) =>
        row[enteringCol] > 1e-9 ? row[varsCount] / row[enteringCol] : null,
      );
      let minR = Infinity;
      for (let i = 0; i < currTableau.length; i++) {
        if (currTableau[i][enteringCol] > 1e-9) {
          const r = currTableau[i][varsCount] / currTableau[i][enteringCol];
          if (r < minR - 1e-9) {
            minR = r;
            pivotRow = i;
          }
        }
      }
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
    const { delta } = computeDelta(tableau, basis, totalVars);

    let pivCol = -1;
    for (let j = 0; j < totalVars; j++) {
      if (!basis.includes(j) && delta[j] < -1e-9) {
        pivCol = j;
        break;
      }
    }
    if (pivCol === -1) break;

    let pivRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < m; i++) {
      if (tableau[i][pivCol] > 1e-9) {
        const r = tableau[i][totalVars] / tableau[i][pivCol];
        if (Math.abs(r - minRatio) < 1e-9) {
          if (pivRow === -1 || basis[i] < basis[pivRow]) pivRow = i;
        } else if (r < minRatio - 1e-9) {
          minRatio = r;
          pivRow = i;
        }
      }
    }

    if (pivRow === -1)
      throw new Error(
        "Цільова функція не обмежена на множині допустимих розв'язків (Unbounded).",
      );

    const pivEl = tableau[pivRow][pivCol];
    for (let j = 0; j <= totalVars; j++) tableau[pivRow][j] /= pivEl;
    for (let i = 0; i < m; i++) {
      if (i === pivRow) continue;
      const factor = tableau[i][pivCol];
      for (let j = 0; j <= totalVars; j++)
        tableau[i][j] -= factor * tableau[pivRow][j];
    }
    basis[pivRow] = pivCol;

    takeSnapshot(tableau, basis);
  }

  const { z0 } = computeDelta(tableau, basis, totalVars);

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
