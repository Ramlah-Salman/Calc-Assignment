import React, { useState, useEffect } from "react";

const LS_KEY = "aurora_calc_history";

const buttons = [
  { label: "DEL", type: "fn" },
  { label: "LOG", type: "fn" },
  { label: "(", type: "num" },
  { label: ")", type: "num" },
  { label: "7", type: "num" },
  { label: "8", type: "num" },
  { label: "9", type: "num" },
  { label: "÷", type: "op" },
  { label: "4", type: "num" },
  { label: "5", type: "num" },
  { label: "6", type: "num" },
  { label: "×", type: "op" },
  { label: "1", type: "num" },
  { label: "2", type: "num" },
  { label: "3", type: "num" },
  { label: "-", type: "op" },
  { label: ".", type: "num" },
  { label: "0", type: "num" },
  { label: "+", type: "op" },
  { label: "%", type: "op" },
  { label: "RESULT", type: "equal" },
];

function sanitize(expr) {
  return expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/[^0-9+\-*/().%]/g, "");
}

function evaluate(expr) {
  const safe = sanitize(expr);
  try {
    const converted = safe.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
    const res = Function(`return (${converted})`)();
    if (!isFinite(res)) throw new Error();
    return Math.round((res + Number.EPSILON) * 1e12) / 1e12;
  } catch {
    return "Error";
  }
}

export default function App() {
  const [expr, setExpr] = useState("");
  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) setHistory(JSON.parse(raw));
  }, []);

  useEffect(() => setDisplay(expr || "0"), [expr]);

  const saveHistory = (entry) => {
    const list = [entry, ...history].slice(0, 50);
    setHistory(list);
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  };

  const handlePress = (b) => {
    if (b.type === "num") setExpr(expr + b.label);
    else if (b.type === "op") {
      if (expr === "" && b.label !== "-") return;
      if (/[\+\-×÷]$/.test(expr)) setExpr(expr.slice(0, -1) + b.label);
      else setExpr(expr + b.label);
    } else if (b.label === "DEL") setExpr(expr.slice(0, -1));
    else if (b.label === "LOG") {
      const m = expr.match(/([0-9.]+)$/);
      const num = m ? parseFloat(m[1]) : 0;
      if (num <= 0) return;
      const res = Math.log10(num);
      const trimmed = String(Math.round(res * 1e12) / 1e12);
      setExpr(expr.replace(/([0-9.]+)$/, trimmed));
      saveHistory({ expr: `log(${num})`, result: trimmed });
    } else if (b.label === "%") {
      const m = expr.match(/([0-9.]+)$/);
      if (!m) return;
      const val = parseFloat(m[1]) / 100;
      setExpr(expr.replace(/([0-9.]+)$/, val));
    } else if (b.type === "equal") {
      const res = evaluate(expr);
      saveHistory({ expr: expr || "0", result: res });
      setExpr(String(res === "Error" ? "" : res));
      setDisplay(String(res));
    }
  };

  const clearAll = () => {
    setExpr("");
    setDisplay("0");
  };

  const clearHistory = () => {
    localStorage.removeItem(LS_KEY);
    setHistory([]);
  };

  return (
    <>
      <div className="aurora-bg" />
      <div className="app-wrap">
        <div className="w-full max-w-sm md:max-w-md bg-[#0f172a]/80 backdrop-blur-md rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.2)] p-5 text-white border border-slate-700/50 flex flex-col justify-between">
          {/* Header */}
          <div className="flex justify-between mb-4">
            <h1 className="font-bold text-lg tracking-wide text-cyan-400">Calc</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
              >
                History
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Display */}
          <div className="bg-slate-900/70 rounded-2xl p-5 mb-3 border border-slate-700/60 shadow-inner min-h-[100px] flex flex-col justify-center">
            <div className="text-right text-4xl md:text-5xl font-extrabold tracking-tight text-cyan-300 leading-none">
              {display}
            </div>
            <div className="text-right text-sm text-slate-400 mt-1">{expr}</div>
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-4 gap-1 flex-grow">
            {buttons.map((b) => (
              <button
                key={b.label}
                onClick={() => handlePress(b)}
                className={`h-16 flex items-center justify-center font-semibold text-lg md:text-xl rounded-xl transition-all 
                ${
                  b.type === "equal"
                    ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-white shadow-md hover:from-cyan-400 hover:to-teal-300 col-span-4"
                    : b.type === "op"
                    ? "bg-slate-800/90 text-cyan-300 hover:bg-slate-700/80"
                    : b.type === "fn"
                    ? "bg-slate-700/90 text-pink-400 hover:bg-slate-600/80"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* History Drawer */}
          {showHistory && (
            <div className="fixed inset-0 z-40">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowHistory(false)}
              />
              <div className="absolute right-0 top-0 h-full w-full md:w-96 bg-slate-900/95 text-white p-4 shadow-2xl border-l border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-cyan-300">History</h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-3 overflow-auto max-h-[70vh] pr-2">
                  {history.length === 0 && (
                    <div className="text-sm text-slate-400">No history yet</div>
                  )}
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-800/80 flex justify-between items-start border border-slate-700/70"
                    >
                      <div>
                        <div className="text-sm text-slate-400">{h.expr}</div>
                        <div className="text-xl font-bold text-cyan-400">
                          {String(h.result)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setExpr(String(h.result));
                          setShowHistory(false);
                        }}
                        className="px-2 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={clearHistory}
                  className="mt-4 w-full py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-400 font-semibold"
                >
                  Clear History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
