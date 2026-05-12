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

function buildDeltaCalcs(
  tableau,
  basis,
  cjComp,
  varNames,
  delta,
  z0,
  m,
  total,
) {
  const calcs = [];
  const terms0 = basis.map(
    (bIdx, i) => `${fmt(cjComp[bIdx])} · ${fmt(tableau[i][total])}`,
  );
  calcs.push({ label: "Δ₀", expr: terms0.join(" + ") + " = " + fmt(z0) });
  for (let j = 0; j < total; j++) {
    const terms = basis.map(
      (bIdx, i) => `${fmt(cjComp[bIdx])} · ${fmt(tableau[i][j])}`,
    );
    const sub = terms.join(" + ");
    const cVal = cjComp[j];
    const suffix =
      Math.abs(cVal) > 1e-9
        ? ` - ${fmt(cVal)} = ${fmt(delta[j])}`
        : ` = ${fmt(delta[j])}`;
    calcs.push({ label: `Δ${j + 1}`, expr: sub + suffix });
  }
  return calcs;
}

export function solveSimplex(objCoefs, constraints, objType) {
  const n = objCoefs.length;
  const m = constraints.length;
  const total = n + m;
  const varNames = Array.from({ length: total }, (_, i) => `x${i + 1}`);
  const cjDisplay = [...objCoefs, ...Array(m).fill(0)];
  const cjComp = [
    ...objCoefs.map((c) => (objType === "max" ? c : -c)),
    ...Array(m).fill(0),
  ];

  let tableau = [];
  let basis = [];

  for (let i = 0; i < m; i++) {
    const row = new Array(total + 1).fill(0);
    const { coefs, sign, rhs } = constraints[i];
    const mult = sign === ">=" ? -1 : 1;
    for (let j = 0; j < n; j++) row[j] = coefs[j] * mult;
    row[n + i] = mult;
    row[total] = rhs * mult;
    if (row[total] < 0) for (let k = 0; k <= total; k++) row[k] *= -1;
    tableau.push(row);
    basis.push(n + i);
  }

  const computeDelta = (currTableau, currBasis) => {
    let z0 = 0;
    const zj = new Array(total).fill(0);
    for (let i = 0; i < m; i++) {
      const cb = cjComp[currBasis[i]];
      z0 += cb * currTableau[i][total];
      for (let j = 0; j < total; j++) zj[j] += cb * currTableau[i][j];
    }
    const delta = zj.map((z, j) => z - cjComp[j]);
    return { delta, z0 };
  };

  const steps = [];

  const snapshot = (
    pivEnt = null,
    pivLev = null,
    pRow = -1,
    pCol = -1,
    pEl = null,
  ) => {
    const { delta, z0 } = computeDelta(tableau, basis);
    const deltaCalcs = buildDeltaCalcs(
      tableau,
      basis,
      cjComp,
      varNames,
      delta,
      z0,
      m,
      total,
    );

    let enteringCol = null;
    let displayPivRow = -1;
    let ratios = null;

    let minD = -1e-9;
    for (let j = 0; j < total; j++) {
      if (!basis.includes(j) && delta[j] < minD) {
        minD = delta[j];
        enteringCol = j;
      }
    }

    if (enteringCol !== null) {
      ratios = tableau.map((row) =>
        row[enteringCol] > 1e-9 ? row[total] / row[enteringCol] : null,
      );
      let minR = Infinity;
      for (let i = 0; i < m; i++) {
        if (tableau[i][enteringCol] > 1e-9) {
          const r = tableau[i][total] / tableau[i][enteringCol];
          if (r < minR - 1e-9) {
            minR = r;
            displayPivRow = i;
          }
        }
      }
    }

    steps.push({
      tableau: tableau.map((r) => [...r]),
      basis: [...basis],
      delta: [...delta],
      z0,
      varNames: [...varNames],
      cjDisplay: [...cjDisplay],
      cjComp: [...cjComp],
      deltaCalcs,
      enteringCol,
      pivotRow: displayPivRow,
      ratios,
      pivEntering: pivEnt,
      pivLeaving: pivLev,
      pivEl: pEl,
    });
  };

  snapshot();

  for (let iter = 0; iter < 50; iter++) {
    const { delta } = computeDelta(tableau, basis);
    let pivCol = -1;
    let minD = -1e-9;

    for (let j = 0; j < total; j++) {
      if (!basis.includes(j) && delta[j] < minD) {
        minD = delta[j];
        pivCol = j;
      }
    }

    if (pivCol === -1) break;

    let pivRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < m; i++) {
      if (tableau[i][pivCol] > 1e-9) {
        const r = tableau[i][total] / tableau[i][pivCol];
        if (r < minRatio - 1e-9) {
          minRatio = r;
          pivRow = i;
        }
      }
    }

    if (pivRow === -1) throw new Error("Задача НЕОБМЕЖЕНА.");

    const leavingVar = basis[pivRow];
    const pivEl = tableau[pivRow][pivCol];

    for (let j = 0; j <= total; j++) tableau[pivRow][j] /= pivEl;
    for (let i = 0; i < m; i++) {
      if (i === pivRow) continue;
      const f = tableau[i][pivCol];
      for (let j = 0; j <= total; j++) tableau[i][j] -= f * tableau[pivRow][j];
    }

    basis[pivRow] = pivCol;
    snapshot(pivCol, leavingVar, pivRow, pivCol, pivEl);
  }

  const { delta: fd, z0 } = computeDelta(tableau, basis);
  const isOptimal = fd.every((d, j) => basis.includes(j) || d >= -1e-7);
  if (!isOptimal) throw new Error("Розв'язок не збігся. Перевірте задачу.");

  const xSol = new Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    if (basis[i] < n) xSol[basis[i]] = tableau[i][total];
  }

  return {
    steps,
    xSol,
    fval: objType === "max" ? z0 : -z0,
    objType,
    varNames,
    n,
  };
}
