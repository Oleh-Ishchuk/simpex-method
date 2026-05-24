export function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  return b === 0 ? a : gcd(b, a % b);
}

export function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

export function getDenominator(v) {
  const abs = Math.abs(v);
  for (let den = 1; den <= 9999; den++) {
    if (Math.abs(Math.round(abs * den) - abs * den) < 1e-9) return den;
  }
  return 1;
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

export function getRowScale(vals) {
  const nonZero = vals.filter((v) => Math.abs(v) > 1e-9);
  if (nonZero.length === 0) return 1;

  const allInteger = nonZero.every((v) => Math.abs(v - Math.round(v)) < 1e-9);
  if (allInteger) {
    let g = 0;
    for (const v of nonZero) g = gcd(g, Math.abs(Math.round(v)));
    return g > 1 ? 1 / g : 1;
  }

  let denominatorLcm = 1;
  for (const v of nonZero) {
    const den = getDenominator(v);
    denominatorLcm = lcm(denominatorLcm, den);
  }
  return denominatorLcm > 1 ? denominatorLcm : 1;
}

export function getRowScaleInfo(c) {
  const vals = [...c.coefs, c.rhs]
    .map(Number)
    .filter((v) => Math.abs(v) > 1e-9);
  if (vals.length === 0) return { factor: 1, op: null };

  const allInteger = vals.every((v) => Math.abs(v - Math.round(v)) < 1e-9);
  if (allInteger) {
    let g = 0;
    for (const v of vals) g = gcd(g, Math.abs(Math.round(v)));
    if (g > 1) return { factor: 1 / g, op: "div", by: g };
    return { factor: 1, op: null };
  }

  let denominatorLcm = 1;
  for (const v of vals) {
    const den = getDenominator(v);
    denominatorLcm = lcm(denominatorLcm, den);
  }
  if (denominatorLcm > 1)
    return { factor: denominatorLcm, op: "mul", by: denominatorLcm };
  return { factor: 1, op: null };
}
