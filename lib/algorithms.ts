// algorithms.ts — алгоритми розфарбовування графів
// ОО-підхід: кожен алгоритм — клас з методом solve()

import { Graph, ColorMap, ColoringResult, AdjacencyList } from "./types";
import { AlgorithmTimeoutException } from "./exceptions"
import { AlgorithmType } from "./types";

// Базовий абстрактний клас GraphColoringAlgorithm
abstract class GraphColoringAlgorithm {
  protected graph: Graph;
  protected adjacency: AdjacencyList;

  protected iterations = 0;
  protected startTime = 0;
  protected readonly TIME_LIMIT_MS = 1500; // 1.5 секунди максимум на виконання

  constructor(graph: Graph) {
    this.graph = graph;
    this.adjacency = this.buildAdjacencyList();
  }

  protected buildAdjacencyList(): AdjacencyList {
    const adj: AdjacencyList = new Map();
    for (const v of this.graph.vertices) {
      adj.set(v.id, new Set());
    }
    for (const e of this.graph.edges) {
      adj.get(e.from)?.add(e.to);
      adj.get(e.to)?.add(e.from);
    }
    return adj;
  }

  protected getNeighbors(vertexId: number): Set<number> {
    return this.adjacency.get(vertexId) ?? new Set();
  }

  protected getUsedColors(vertexId: number, colorMap: ColorMap): Set<number> {
    const used = new Set<number>();
    for (const neighborId of this.getNeighbors(vertexId)) {
      const c = colorMap.get(neighborId);
      if (c !== undefined) used.add(c);
    }
    return used;
  }

  protected getSmallestAvailableColor(usedColors: Set<number>): number {
    let color = 0;
    while (usedColors.has(color)) color++;
    return color;
  }


  protected checkTimeout() {
    this.iterations++;
    if (this.iterations % 1000 === 0) {
      if (performance.now() - this.startTime > this.TIME_LIMIT_MS) {
        throw new AlgorithmTimeoutException(
          `Перевищено ліміт часу (${this.TIME_LIMIT_MS / 1000}с)`,
          this.TIME_LIMIT_MS
        );
      }
    }
  }

  abstract solve(): ColoringResult;
}

// 1. Жадібний алгоритм (Greedy)
export class GreedyColoringAlgorithm extends GraphColoringAlgorithm {
  solve(): ColoringResult {
    const start = performance.now();
    const colorMap: ColorMap = new Map();

    const sorted = [...this.graph.vertices].sort(
      (a, b) =>
        (this.getNeighbors(b.id).size) - (this.getNeighbors(a.id).size)
    );

    for (const vertex of sorted) {
      const usedColors = this.getUsedColors(vertex.id, colorMap);
      const color = this.getSmallestAvailableColor(usedColors);
      colorMap.set(vertex.id, color);
    }

    const numColors = new Set(colorMap.values()).size;
    return {
      colorMap,
      numColors,
      executionTimeMs: performance.now() - start,
    };
  }
}

// 2. Backtracking з евристикою MRV
export class BacktrackingMRVAlgorithm extends GraphColoringAlgorithm {
  private maxColors: number;

  constructor(graph: Graph) {
    super(graph);
    this.maxColors = graph.vertices.length || 1;
  }

  private selectUncoloredMRV(uncolored: Set<number>, colorMap: ColorMap): number {
    let bestVertex = -1;
    let minRemaining = Infinity;

    for (const vid of uncolored) {
      const used = this.getUsedColors(vid, colorMap);
      let available = 0;
      for (let c = 0; c < this.maxColors; c++) {
        if (!used.has(c)) available++;
      }
      if (available < minRemaining) {
        minRemaining = available;
        bestVertex = vid;
      }
    }
    return bestVertex;
  }

  private backtrack(uncolored: Set<number>, colorMap: ColorMap): boolean {
    this.checkTimeout(); // 🔥 ВИКЛИК ЗАПОБІЖНИКА

    if (uncolored.size === 0) return true;

    const vid = this.selectUncoloredMRV(uncolored, colorMap);
    if (vid === -1) return false;

    uncolored.delete(vid);
    const usedColors = this.getUsedColors(vid, colorMap);

    for (let color = 0; color < this.maxColors; color++) {
      if (!usedColors.has(color)) {
        colorMap.set(vid, color);
        if (this.backtrack(uncolored, colorMap)) return true;
        colorMap.delete(vid);
      }
    }

    uncolored.add(vid);
    return false;
  }

  solve(): ColoringResult {
    this.startTime = performance.now();
    this.iterations = 0;

    const colorMap: ColorMap = new Map();
    const uncolored = new Set(this.graph.vertices.map((v) => v.id));

    let found = false;
    for (let k = 1; k <= this.graph.vertices.length; k++) {
      this.maxColors = k;
      colorMap.clear();
      const unc = new Set(uncolored);
      if (this.backtrack(unc, colorMap)) {
        found = true;
        break;
      }
    }

    if (!found) {
      for (const v of this.graph.vertices) {
        const used = this.getUsedColors(v.id, colorMap);
        colorMap.set(v.id, this.getSmallestAvailableColor(used));
      }
    }

    return {
      colorMap,
      numColors: new Set(colorMap.values()).size,
      executionTimeMs: performance.now() - this.startTime,
    };
  }
}

// 3. Backtracking зі степеневою евристикою
export class BacktrackingDegreeAlgorithm extends GraphColoringAlgorithm {
  private maxColors: number;

  constructor(graph: Graph) {
    super(graph);
    this.maxColors = graph.vertices.length || 1;
  }

  private selectHighestDegreeUncolored(uncolored: Set<number>): number {
    let bestVertex = -1;
    let maxDeg = -1;

    for (const vid of uncolored) {
      let deg = 0;
      for (const neighbor of this.getNeighbors(vid)) {
        if (uncolored.has(neighbor)) deg++;
      }
      if (deg > maxDeg) {
        maxDeg = deg;
        bestVertex = vid;
      }
    }
    return bestVertex;
  }

  private backtrack(uncolored: Set<number>, colorMap: ColorMap): boolean {
    this.checkTimeout();

    if (uncolored.size === 0) return true;

    const vid = this.selectHighestDegreeUncolored(uncolored);
    if (vid === -1) return false;

    uncolored.delete(vid);
    const usedColors = this.getUsedColors(vid, colorMap);

    for (let color = 0; color < this.maxColors; color++) {
      if (!usedColors.has(color)) {
        colorMap.set(vid, color);
        if (this.backtrack(new Set(uncolored), colorMap)) return true;
        colorMap.delete(vid);
      }
    }

    uncolored.add(vid);
    return false;
  }

  solve(): ColoringResult {
    this.startTime = performance.now();
    this.iterations = 0;

    const colorMap: ColorMap = new Map();
    let found = false;

    for (let k = 1; k <= this.graph.vertices.length; k++) {
      this.maxColors = k;
      colorMap.clear();
      const uncolored = new Set(this.graph.vertices.map((v) => v.id));
      if (this.backtrack(uncolored, colorMap)) {
        found = true;
        break;
      }
    }

    if (!found) {
      for (const v of this.graph.vertices) {
        const used = this.getUsedColors(v.id, colorMap);
        colorMap.set(v.id, this.getSmallestAvailableColor(used));
      }
    }

    return {
      colorMap,
      numColors: new Set(colorMap.values()).size,
      executionTimeMs: performance.now() - this.startTime,
    };
  }
}

// Фабричний метод
export function createAlgorithm(
  type: AlgorithmType,
  graph: Graph
): GraphColoringAlgorithm {
  switch (type) {
    case "greedy":
      return new GreedyColoringAlgorithm(graph);
    case "backtracking-mrv":
      return new BacktrackingMRVAlgorithm(graph);
    case "backtracking-degree":
      return new BacktrackingDegreeAlgorithm(graph);
  }
}

// Валідація правильності розфарбування
export function validateColoring(graph: Graph, colorMap: ColorMap): boolean {
  for (const edge of graph.edges) {
    const c1 = colorMap.get(edge.from);
    const c2 = colorMap.get(edge.to);
    if (c1 === undefined || c2 === undefined || c1 === c2) return false;
  }
  return true;
}