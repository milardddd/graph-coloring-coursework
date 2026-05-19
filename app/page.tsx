"use client";
import React, { useState, useCallback, useRef } from "react";
import GraphCanvas from "@/components/GraphCanvas";
import AdjacencyMatrix from "@/components/AdjacencyMatrix";
import ResultsPanel from "@/components/ResultsPanel";

import { Graph, ColorMap, AlgorithmType, ComparisonResult, InputMode } from "@/lib/types";
import { createAlgorithm, validateColoring } from "@/lib/algorithms";
import { getAlgorithmNameUA, generateExampleGraph } from "@/lib/utils";

const ALGORITHMS: { id: AlgorithmType; short: string; desc: string }[] = [
  {
    id: "greedy",
    short: "Жадібний",
    desc: "Welsh-Powell: сортуємо вершини за спаданням степеня, жадібно призначаємо найменший доступний колір.",
  },
  {
    id: "backtracking-mrv",
    short: "BT + MRV",
    desc: "Backtracking з евристикою MRV: обираємо вершину з найменшою кількістю допустимих кольорів.",
  },
  {
    id: "backtracking-degree",
    short: "BT + Степінь",
    desc: "Backtracking зі степеневою евристикою: обираємо вершину з найбільшим динамічним степенем.",
  },
];

const EXAMPLES: { id: "petersen" | "cycle" | "complete" | "bipartite"; label: string }[] = [
  { id: "petersen", label: "Граф Петерсена" },
  { id: "cycle", label: "Цикл C₆" },
  { id: "complete", label: "Повний K₅" },
  { id: "bipartite", label: "Дводольний" },
];

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("canvas");
  const [graph, setGraph] = useState<Graph>({ vertices: [], edges: [] });
  const [algorithm, setAlgorithm] = useState<AlgorithmType>("greedy");
  const [colorMap, setColorMap] = useState<ColorMap | null>(null);
  const [numColors, setNumColors] = useState(0);
  const [execTime, setExecTime] = useState(0);
  const [comparison, setComparison] = useState<ComparisonResult[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [iterations, setIterations] = useState(0);

  const lastCalculatedGraphRef = useRef<string>("");
  const lastAlgorithmRef = useRef<AlgorithmType | null>(null);

  const handleGraphChange = useCallback((g: Graph) => {
    setGraph(g);
    setColorMap(null);
    setComparison([]);
  }, []);

  const handleRun = async () => {
    if (graph.vertices.length < 2) {
      alert("Додайте мінімум 2 вершини до графа перед запуском розрахунку.");
      return;
    }

    const currentGraphStr = JSON.stringify(graph);

    if (
      currentGraphStr === lastCalculatedGraphRef.current &&
      algorithm === lastAlgorithmRef.current &&
      colorMap !== null
    ) {
      return;
    }

    setIsRunning(true);
    await new Promise((r) => setTimeout(r, 50));

    try {
      const algo = createAlgorithm(algorithm, graph);
      const result = algo.solve();

      setColorMap(result.colorMap);
      setNumColors(result.numColors);
      setExecTime(result.executionTimeMs);
      setIterations(result.iterations);
      setIsValid(validateColoring(graph, result.colorMap));

      if (currentGraphStr !== lastCalculatedGraphRef.current || comparison.length === 0) {
        const comp: ComparisonResult[] = ALGORITHMS.map(({ id }) => {
          try {
            const a = createAlgorithm(id, graph);
            const r = a.solve();
            return { algorithm: id, numColors: r.numColors, executionTimeMs: r.executionTimeMs, iterations: r.iterations };
          } catch (e) {
            return { algorithm: id, numColors: 0, executionTimeMs: -1, iterations: -1 };
          }
        });
        setComparison(comp);
      }

      lastCalculatedGraphRef.current = currentGraphStr;
      lastAlgorithmRef.current = algorithm;

    } catch (e: any) {
      alert(e.message || "Сталася помилка під час виконання алгоритму.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setGraph({ vertices: [], edges: [] });
    setColorMap(null);
    setComparison([]);
  };

  const loadExample = (type: "petersen" | "cycle" | "complete" | "bipartite") => {
    setGraph(generateExampleGraph(type));
    setColorMap(null);
    setComparison([]);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background">
      <header className="bg-black border-b-2 border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">

          <div className="flex items-baseline gap-4">
            <h1 className="font-display font-bold uppercase text-white text-xl sm:text-2xl tracking-tight">
              Розфарбовування графів
            </h1>
            <p className="font-mono font-bold text-white/40 text-xs sm:text-sm uppercase tracking-widest hidden md:block">
              Рибалко Тимофій
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#DDFB56] shadow-[0_0_8px_#DDFB56] animate-pulse-slow" />
            <span className="font-mono text-[10px] sm:text-xs text-white/70 font-bold uppercase tracking-[0.2em]">
              курсова робота
            </span>
          </div>

        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 mt-4 mb-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex bg-card p-1 rounded-xl border border-border shadow-sm">
                {([
                  { id: "canvas" as InputMode, label: "🖊 Малювання" },
                  { id: "matrix" as InputMode, label: "⊞ Матриця" },
                ] as const).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setInputMode(id)}
                    className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${inputMode === id
                      ? "bg-foreground text-card shadow-sm"
                      : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative group z-40">
                  <button className="text-sm font-mono px-4 py-1.5 rounded-xl bg-card border border-border text-foreground hover:bg-foreground/5 transition-colors shadow-sm font-bold">
                    Приклади ▾
                  </button>

                  <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-40 min-w-[180px]">
                    <div className="paper-card py-2 shadow-xl">
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => loadExample(ex.id)}
                          className="w-full text-left px-4 py-2 text-sm font-mono font-bold text-foreground hover:bg-foreground/5 transition-colors"
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClear}
                  className="text-sm font-mono font-bold px-4 py-1.5 rounded-xl bg-card border border-border text-foreground hover:bg-foreground/5 transition-colors shadow-sm"
                >
                  Очистити
                </button>
              </div>
            </div>

            <div className="paper-card p-5">
              {inputMode === "canvas" ? (
                <GraphCanvas graph={graph} colorMap={colorMap ?? undefined} onGraphChange={handleGraphChange} />
              ) : (
                <AdjacencyMatrix graph={graph} onGraphChange={handleGraphChange} />
              )}
            </div>

            <div className="paper-card p-5">
              <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-widest mb-3">
                Метод розв'язання
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                {ALGORITHMS.map(({ id, short, desc }) => (
                  <button
                    key={id}
                    onClick={() => setAlgorithm(id)}
                    className={`text-left p-3 rounded-xl border transition-all ${algorithm === id
                      ? "border-foreground bg-foreground/5 ring-1 ring-foreground"
                      : "border-border bg-card hover:border-foreground/40 hover:bg-foreground/5"
                      }`}
                  >
                    <div className="text-sm font-bold text-foreground mb-1">{short}</div>
                    <div className="text-xs text-foreground/70 leading-relaxed font-medium">{desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleRun}
                disabled={isRunning || graph.vertices.length < 2}
                className={`w-full py-3 rounded-xl font-bold text-base transition-all ${isRunning || graph.vertices.length < 2
                  ? "bg-foreground/5 text-foreground/40 cursor-not-allowed border border-border/20"
                  : "bg-[#ebcb4d] text-black hover:opacity-90 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
                  }`}
              >
                {isRunning ? "Виконується..." : `▶ Запустити розрахунок`}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="paper-card p-5 min-h-[300px]">
              <ResultsPanel
                graph={graph}
                colorMap={colorMap}
                algorithm={algorithm}
                numColors={numColors}
                executionTimeMs={execTime}
                iterations={iterations}
                comparison={comparison}
                isValid={isValid}
              />
            </div>

            <div className="paper-card p-5">
              <h2 className="text-sm font-display font-bold text-foreground uppercase tracking-widest mb-3">
                Інформація про граф
              </h2>
              <dl className="space-y-2 text-sm font-mono font-bold">
                {[
                  { label: "Вершини (|V|)", value: graph.vertices.length },
                  { label: "Ребра (|E|)", value: graph.edges.length },
                  { label: "Макс. степінь", value: graph.vertices.length > 0 ? Math.max(...graph.vertices.map((v) => graph.edges.filter((e) => e.from === v.id || e.to === v.id).length)) : 0 },
                  { label: "Щільність", value: graph.vertices.length > 1 ? ((2 * graph.edges.length) / (graph.vertices.length * (graph.vertices.length - 1))).toFixed(3) : "—" },
                  { label: "Хроматичне число χ", value: colorMap ? numColors : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center border-b border-border/50 pb-1">
                    <dt className="text-foreground/70">{label}</dt>
                    <dd className="text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full bg-black border-t-2 border-[#abc730] mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              © 2026 • КИЇВ
            </span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/milardddd"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-white/50 hover:text-[#abc730] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] transition-colors"
            >
              GITHUB
            </a>
            <a
              href="https://www.linkedin.com/in/timofii-rybalko/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-white/50 hover:text-[#abc730] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] transition-colors"
            >
              LINKEDIN
            </a>
          </div>

        </div>
      </footer>
    </div>
  );
}