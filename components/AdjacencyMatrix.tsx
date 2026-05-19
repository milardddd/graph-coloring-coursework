"use client";
import React, { useState, useEffect } from "react";
import { Graph } from "@/lib/types";
import { matrixToGraph, graphToMatrix } from "@/lib/utils";

interface Props {
  graph: Graph;
  onGraphChange: (g: Graph) => void;
}

export default function AdjacencyMatrix({ graph, onGraphChange }: Props) {
  const [size, setSize] = useState<number>(() => Math.max(1, Math.min(graph.vertices.length, 20)));

  const [matrix, setMatrix] = useState<number[][]>(() => {
    if (graph.vertices.length === 0) return [[0]];
    return graphToMatrix(graph);
  });

  const [error, setError] = useState<string>("");

  const applyMatrix = (m: number[][], s: number) => {
    onGraphChange(matrixToGraph(m, graph.vertices.slice(0, s)));
  };

  useEffect(() => {
    if (graph.vertices.length > 20) {
      setError("Увага: Граф обрізано до 20 вершин (максимальний ліміт).");
      const m = graphToMatrix(graph);
      const truncatedM = Array.from({ length: 20 }, (_, i) =>
        Array.from({ length: 20 }, (_, j) => m[i]?.[j] ?? 0)
      );
      setMatrix(truncatedM);
      setSize(20);
      onGraphChange(matrixToGraph(truncatedM, graph.vertices.slice(0, 20)));
      return;
    }

    setError("");

    const displaySize = Math.max(1, graph.vertices.length);
    setSize(displaySize);

    if (graph.vertices.length === 0) {
      setMatrix([[0]]);
    } else {
      setMatrix(graphToMatrix(graph));
    }
  }, [graph, onGraphChange]);

  const resizeMatrix = (newSize: number) => {
    if (newSize < 2 || newSize > 20) return setError("Розмір від 2 до 20");

    setError("");
    setSize(newSize);
    const newM = Array.from({ length: newSize }, (_, i) =>
      Array.from({ length: newSize }, (_, j) => matrix[i]?.[j] ?? 0)
    );
    setMatrix(newM);
    applyMatrix(newM, newSize);
  };

  const handleCellChange = (row: number, col: number) => {
    if (row === col) return setError("Діагональ повинна бути 0");
    setError("");
    const val = matrix[row][col] === 1 ? 0 : 1;
    const newM = matrix.map((r, i) => r.map((c, j) => (i === row && j === col) || (i === col && j === row) ? val : c));
    setMatrix(newM);
    applyMatrix(newM, size);
  };

  const fillRandom = () => {
    const m = Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => i === j ? 0 : Math.random() > 0.6 ? 1 : 0));
    for (let i = 0; i < size; i++) for (let j = i + 1; j < size; j++) m[j][i] = m[i][j];
    setMatrix(m);
    applyMatrix(m, size);
  };

  const getStyles = () => {
    if (size >= 16) return { btn: "w-6 h-6 text-[10px] rounded", head: "px-1 min-w-[24px] h-6 text-[10px]" };
    if (size >= 12) return { btn: "w-7 h-7 text-[11px] rounded-md", head: "px-1 min-w-[28px] h-7 text-[11px]" };
    if (size >= 8) return { btn: "w-8 h-8 text-xs rounded-lg", head: "px-1 min-w-[32px] h-8 text-xs" };
    return { btn: "w-10 h-10 text-sm rounded-xl", head: "px-2 min-w-[40px] h-10 text-sm" };
  };

  const { btn: cellCls, head: headerCls } = getStyles();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 bg-background border border-border px-4 py-2 rounded-xl shadow-sm">
          <label className="text-sm text-foreground/70 font-mono">Розмір n =</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => resizeMatrix(size - 1)}
              disabled={size <= 2}
              className={`w-8 h-8 rounded-lg border font-mono transition-colors ${size <= 2
                ? "bg-foreground/5 border-border/50 text-foreground/30 cursor-not-allowed"
                : "bg-card border-border text-foreground hover:bg-foreground/10"
                }`}
            >
              −
            </button>
            <span className="w-6 text-center font-mono text-foreground font-medium">{size}</span>
            <button
              onClick={() => resizeMatrix(size + 1)}
              disabled={size >= 20}
              className={`w-8 h-8 rounded-lg border font-mono transition-colors ${size >= 20
                ? "bg-foreground/5 border-border/50 text-foreground/30 cursor-not-allowed"
                : "bg-card border-border text-foreground hover:bg-foreground/10"
                }`}
            >
              +
            </button>
          </div>
        </div>

        <button onClick={fillRandom} className="px-4 py-2 rounded-xl bg-card border border-border text-foreground text-sm font-mono hover:bg-foreground/5 shadow-sm">⚡ Випадковий</button>
        <button onClick={() => { const e = Array(size).fill(Array(size).fill(0)); setMatrix(e); applyMatrix(e, size); }} className="px-4 py-2 rounded-xl border border-border text-foreground/70 text-sm font-mono hover:bg-foreground/5">✕ Очистити</button>
      </div>

      {error && <div className="text-primary text-sm font-mono bg-primary/10 rounded-xl px-4 py-3">⚠ {error}</div>}

      <div className="w-full flex justify-center pb-4">
        <table className="border-collapse font-mono mx-auto">
          <thead>
            <tr>
              <th className={headerCls} />
              {Array.from({ length: size }).map((_, j) => (
                <th key={j} className={`${headerCls} text-center text-foreground font-medium bg-background rounded-t-lg transition-all duration-300`}>
                  {graph.vertices[j]?.label ?? `V${j + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className={`${headerCls} text-center text-foreground font-medium bg-background rounded-l-lg transition-all duration-300`}>
                  {graph.vertices[i]?.label ?? `V${i + 1}`}
                </td>
                {row.map((cell, j) => (
                  <td key={j} className="p-[2px] sm:p-[3px]">
                    {i === j ? (
                      <div className={`${cellCls} mx-auto bg-background border border-border/50 flex items-center justify-center text-foreground/30 shadow-inner transition-all duration-300`}>0</div>
                    ) : (
                      <button
                        onClick={() => handleCellChange(i, j)}
                        className={`${cellCls} mx-auto transition-all duration-300 font-medium shadow-sm ${cell === 1 ? "bg-primary text-white border-b-2 border-black/40" : "bg-card text-foreground/50 border border-border hover:bg-foreground/10"
                          }`}
                      >
                        {cell}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}