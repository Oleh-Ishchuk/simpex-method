import { useState, useEffect } from "react";

export default function NumInput({
  value,
  onChange,
  className = "",
  step = 1,
}) {
  const [raw, setRaw] = useState(String(value ?? 0));

  useEffect(() => {
    setRaw(String(value ?? 0));
  }, [value]);

  const handleChange = (e) => {
    const str = e.target.value;
    setRaw(str);
    onChange(str);
  };

  const handleBlur = () => {
    if (raw !== "" && !isNaN(Number(raw))) {
      const parsed = Number(raw);
      setRaw(String(parsed));
      onChange(parsed);
    }
  };

  const inc = () => {
    const next = (Number(raw) || 0) + step;
    setRaw(String(next));
    onChange(next);
  };

  const dec = () => {
    const next = (Number(raw) || 0) - step;
    setRaw(String(next));
    onChange(next);
  };

  return (
    <div className="num-input-wrap">
      <button className="num-btn" onClick={dec} tabIndex={-1}>
        −
      </button>
      <input
        className={`num-input ${className}`}
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <button className="num-btn" onClick={inc} tabIndex={-1}>
        +
      </button>
    </div>
  );
}
