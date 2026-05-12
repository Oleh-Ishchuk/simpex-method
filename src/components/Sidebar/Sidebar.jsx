export default function Sidebar({
  problem,
  solving,
  result,
  onObjTypeChange,
  onNumVarsChange,
  onNumConsChange,
  onSolve,
  onReset,
}) {
  const numCons = problem.constraints.length;

  return (
    <aside className="sidebar">
      <div className="card">
        <div className="card__title">Конфігурація</div>

        <div className="field">
          <label className="field__label">Ціль</label>
          <select
            className="field__input"
            value={problem.objType}
            onChange={(e) => onObjTypeChange(e.target.value)}
          >
            <option value="max">MAXIMIZE</option>
            <option value="min">MINIMIZE</option>
          </select>
        </div>

        <div className="field">
          <div className="field__label">Змінних</div>
          <div className="dim-row">
            <button className="dim-btn" onClick={() => onNumVarsChange(-1)}>
              −
            </button>
            <span className="dim-val">{problem.numVars}</span>
            <button className="dim-btn" onClick={() => onNumVarsChange(+1)}>
              +
            </button>
            <span className="dim-label">x vars</span>
          </div>
        </div>

        <div className="field">
          <div className="field__label">Обмежень</div>
          <div className="dim-row">
            <button className="dim-btn" onClick={() => onNumConsChange(-1)}>
              −
            </button>
            <span className="dim-val">{numCons}</span>
            <button className="dim-btn" onClick={() => onNumConsChange(+1)}>
              +
            </button>
            <span className="dim-label">рядків</span>
          </div>
        </div>

        <div className="card__divider" />

        <button
          className={`btn-solve${solving ? " btn-solve--solving" : ""}`}
          onClick={onSolve}
          disabled={solving}
        >
          {solving ? "⟳ РОЗВЯЗУЮ..." : "▶ SOLVE"}
        </button>
        <button className="btn-reset" onClick={onReset}>
          ↺ RESET
        </button>
      </div>

      <div className="card">
        <div className="card__title">Лог</div>
        {result ? (
          <div className="log-entry">
            <div>
              <span className="log-entry__key">▸ ВХІД</span>
            </div>
            <div>
              Змінних:{" "}
              <span className="log-entry__value">{problem.numVars}</span>
            </div>
            <div>
              Обмежень: <span className="log-entry__value">{numCons}</span>
            </div>
            <div>
              Slack: <span className="log-entry__value">{numCons}</span>
            </div>
            <br />
            <div>
              <span className="log-entry__key">▸ ІТЕРАЦІЇ</span>
            </div>
            <div>
              Pivot кроків:{" "}
              <span className="log-entry__value">
                {result.steps.length - 1}
              </span>
            </div>
            <br />
            <div>
              <span className="log-entry__success">▸ ОПТИМУМ ✓</span>
            </div>
          </div>
        ) : (
          <div
            className="empty-hint"
            style={{ padding: "8px 0", fontSize: 11 }}
          >
            Очікування...
          </div>
        )}
      </div>
    </aside>
  );
}
