"use client";
import React from "react";
import { Graph, ColorMap, AlgorithmType, ComparisonResult } from "@/lib/types";
import { COLOR_PALETTE, COLOR_NAMES_UA, getAlgorithmNameUA, generateResultText, downloadTextFile } from "@/lib/utils";

interface Props {
  graph: Graph;
  colorMap: ColorMap | null;
  algorithm: AlgorithmType;
  numColors: number;
  executionTimeMs: number;
  iterations: number;
  comparison: ComparisonResult[];
  isValid: boolean;
}

export default function ResultsPanel({ graph, colorMap, algorithm, numColors, executionTimeMs, iterations, comparison, isValid }: Props) {
  if (!colorMap || colorMap.size === 0) {
    return (
      <div className="text-center py-16 text-foreground/50 font-serif h-full flex flex-col justify-center items-center">
        <div className="text-5xl mb-4 opacity-20">◬</div>
        <p className="text-lg">Запустіть алгоритм, щоб побачити результати</p>
      </div>
    );
  }

  const colorGroups = new Map<number, typeof graph.vertices>();
  for (const v of graph.vertices) {
    const c = colorMap.get(v.id) ?? -1;
    if (!colorGroups.has(c)) colorGroups.set(c, []);
    colorGroups.get(c)!.push(v);
  }
  const sortedGroups = [...colorGroups.entries()].sort((a, b) => a[0] - b[0]);

  const maxTime = Math.max(
    ...comparison.filter(r => r.executionTimeMs !== -1).map((r) => r.executionTimeMs),
    0.001
  );

  const maxIterations = Math.max(
    ...comparison.filter(r => r.executionTimeMs !== -1 && r.iterations !== undefined).map((r) => r.iterations),
    1
  );

  const currentAlgoData = comparison.find(c => c.algorithm === algorithm);
  const isTimeout = currentAlgoData?.executionTimeMs === -1;

  const displayTimeMs = currentAlgoData && !isTimeout
    ? currentAlgoData.executionTimeMs
    : executionTimeMs;

  const displayIterations = currentAlgoData && !isTimeout && currentAlgoData.iterations !== undefined
    ? currentAlgoData.iterations
    : (iterations || 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-sm font-serif font-bold text-foreground uppercase tracking-widest mb-2">
          Результати
        </h2>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-lg leading-tight">{getAlgorithmNameUA(algorithm)}</h3>
            <div className="mt-2">
              {isTimeout ? (
                <span className="inline-block text-xs font-mono px-3 py-1 rounded-full border text-red-500 bg-red-500/10 border-red-500/20 shadow-sm">
                  ⚠ Таймаут алгоритму
                </span>
              ) : (
                <span className={`inline-block text-xs font-mono px-3 py-1 rounded-full border shadow-sm ${isValid ? "text-foreground bg-green-500/10 border-green-500/20" : "text-primary bg-primary/10 border-primary/20"}`}>
                  {isValid ? "✓ Коректне розфарбування" : "✗ Помилка валідації"}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => downloadTextFile(
              generateResultText(graph, colorMap, algorithm, numColors, displayTimeMs, displayIterations, comparison),
              `results.txt`
            )}
            className="flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-xl bg-card border border-border text-foreground text-xs font-mono hover:bg-foreground/5 transition-colors shadow-sm"
          >
            ↓ Зберегти .txt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Кольорів", value: isTimeout ? "—" : numColors },
          { label: "Вершин", value: graph.vertices.length },
          { label: "Ітер.", value: isTimeout ? "—" : displayIterations },
          { label: "Час (мс)", value: isTimeout ? "Таймаут" : (displayTimeMs === 0 ? "<0.001" : displayTimeMs.toFixed(3)) },
        ].map(({ label, value }) => {
          const isLongValue = String(value).length >= 5;

          return (
            <div
              key={label}
              className="bg-background rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center border border-border shadow-sm min-w-0"
            >
              <div
                className={`font-display font-bold text-foreground tracking-tighter whitespace-nowrap transition-all ${isLongValue ? 'text-sm sm:text-base lg:text-lg' : 'text-lg sm:text-xl lg:text-2xl'
                  }`}
              >
                {value}
              </div>
              <div className="text-[10px] sm:text-[11px] lg:text-xs text-foreground/70 font-mono mt-1 text-center leading-tight tracking-tight">
                {label}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h4 className="text-xs font-mono text-foreground/60 mb-3 uppercase tracking-wider">Схема розфарбування</h4>
        <div className="space-y-2">
          {sortedGroups.map(([colorIdx, verts]) => (
            <div key={colorIdx} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3 w-40 flex-shrink-0">
                <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: COLOR_PALETTE[colorIdx % COLOR_PALETTE.length] }} />
                <span className="text-xs font-mono text-foreground font-bold">
                  {COLOR_NAMES_UA[colorIdx % COLOR_NAMES_UA.length]}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {verts.map((v) => (
                  <span key={v.id} className="text-xs font-mono px-2 py-1 rounded-md bg-card border border-border text-foreground shadow-sm">
                    {v.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {comparison.length > 1 && (
        <>
          <div className="pt-4 border-t border-border mt-2">
            <h4 className="text-xs font-mono text-foreground/60 mb-4 uppercase tracking-wider">Аналіз практичної складності</h4>
            <div className="space-y-3">
              {comparison.map((r) => (
                <div key={`iter-${r.algorithm}`} className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center text-xs font-mono">

                    {/* min-w-0 необхідний, щоб truncate спрацював всередині flex/grid */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`truncate ${r.algorithm === algorithm ? "text-foreground font-bold" : "text-foreground/70"}`}
                        title={getAlgorithmNameUA(r.algorithm)}
                      >
                        {getAlgorithmNameUA(r.algorithm)}
                      </span>
                      <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 border border-border/50 text-foreground/50 tracking-wider">
                        {r.algorithm === "greedy" ? <>O(V<sup>2</sup>)</> : <>O(k<sup>V</sup>)</>}
                      </span>
                    </div>

                    {r.executionTimeMs === -1 ? (
                      <span className="text-red-500 font-bold text-right flex-shrink-0">Таймаут</span>
                    ) : (
                      <span className="text-foreground text-right whitespace-nowrap flex-shrink-0">
                        {r.iterations} ітер.
                      </span>
                    )}
                  </div>

                  <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: r.executionTimeMs === -1 ? "0%" : `${(r.iterations / maxIterations) * 100}%`,
                        backgroundColor: r.algorithm === algorithm ? "var(--primary)" : "var(--foreground)"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border mt-6">
            <h4 className="text-xs font-mono text-foreground/60 mb-4 uppercase tracking-wider">Порівняння швидкодії</h4>
            <div className="space-y-3">
              {comparison.map((r) => (
                <div key={`time-${r.algorithm}`} className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center text-xs font-mono">

                    <span
                      className={`truncate min-w-0 ${r.algorithm === algorithm ? "text-foreground font-bold" : "text-foreground/70"}`}
                      title={getAlgorithmNameUA(r.algorithm)}
                    >
                      {getAlgorithmNameUA(r.algorithm)}
                    </span>

                    {r.executionTimeMs === -1 ? (
                      <span className="text-red-500 font-bold text-right flex-shrink-0">Таймаут</span>
                    ) : (
                      <span className="text-foreground text-right whitespace-nowrap flex-shrink-0">
                        {r.executionTimeMs === 0 ? "<0.001" : r.executionTimeMs.toFixed(3)} мс
                      </span>
                    )}
                  </div>

                  <div className="h-2 bg-border/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: r.executionTimeMs === -1 ? "0%" : `${(r.executionTimeMs / maxTime) * 100}%`,
                        backgroundColor: r.algorithm === algorithm ? "var(--primary)" : "var(--foreground)"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}