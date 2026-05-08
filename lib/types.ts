// types.ts — основні типи для задачі розфарбовування графів

export interface Vertex {
  id: number;
  x: number;
  y: number;
  label: string;
}

export interface Edge {
  from: number;
  to: number;
}

export interface Graph {
  vertices: Vertex[];
  edges: Edge[];
}

export type ColorMap = Map<number, number>;

export interface ColoringResult {
  colorMap: ColorMap;
  numColors: number;
  executionTimeMs: number;
  steps?: ColoringStep[];
}

export interface ColoringStep {
  vertexId: number;
  color: number;
  description: string;
}

export type AlgorithmType =
  | "greedy"
  | "backtracking-mrv"
  | "backtracking-degree";

export interface AlgorithmInfo {
  id: AlgorithmType;
  name: string;
  nameUA: string;
  description: string;
  complexity: string;
}

export interface ComparisonResult {
  algorithm: AlgorithmType;
  numColors: number;
  executionTimeMs: number;
}

export type InputMode = "canvas" | "matrix";

export type AdjacencyList = Map<number, Set<number>>;
