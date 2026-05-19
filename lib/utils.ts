import { Graph, ColorMap, AlgorithmType, ComparisonResult } from "./types";

export const COLOR_PALETTE: string[] = [
  "#abc730",
  "#ebcb4d",
  "#f44336",
  "#3f51b5",
  "#e91e63",
  "#00bcd4",
  "#9c27b0",
  "#ff9800",
  "#2196f3",
  "#4caf50",
  "#ff5722",
  "#cddc39",
  "#795548",
  "#009688",
  "#c2185b",
  "#607d8b",
  "#8bc34a",
  "#512da8",
  "#d32f2f",
  "#00796b",
];

export const COLOR_NAMES_UA: string[] = [
  "Кислотно-оливковий",
  "Гірчичний",
  "Коралово-червоний",
  "Королівський синій",
  "Насичена маджента",
  "Ціан",
  "Щільний фіолетовий",
  "Бурштиновий",
  "Небесно-синій",
  "Трав'янисто-зелений",
  "Глибокий помаранчевий",
  "Лаймовий",
  "Шоколадний",
  "Смарагдовий",
  "Темно-малиновий",
  "Сіро-блакитний",
  "Яблучно-зелений",
  "Індиго",
  "Карміновий",
  "Темно-бірюзовий",
];

export function getVertexColor(colorIndex: number | undefined): string {
  if (colorIndex === undefined) return "#4b5563";
  return COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
}

export function getAlgorithmNameUA(type: AlgorithmType): string {
  switch (type) {
    case "greedy":
      return "Жадібний метод (Welsh-Powell)";
    case "backtracking-mrv":
      return "Backtracking + MRV евристика";
    case "backtracking-degree":
      return "Backtracking + степенева евристика";
  }
}

export function matrixToGraph(
  matrix: number[][],
  existingVertices?: { id: number; x: number; y: number; label: string }[]
): Graph {
  const n = matrix.length;

  const isSizeChanged = !existingVertices || existingVertices.length !== n;

  const r = Math.max(120, Math.min(250, 35 * n));
  const cx = 460, cy = 230;

  let maxId = -1;
  if (existingVertices) {
    existingVertices.forEach(v => {
      if (v.id > maxId) maxId = v.id;
    });
  }

  const vertices = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const targetX = Math.round(cx + r * Math.cos(angle));
    const targetY = Math.round(cy + r * Math.sin(angle));

    if (existingVertices && existingVertices[i]) {
      const v = existingVertices[i];
      return isSizeChanged ? { ...v, x: targetX, y: targetY } : v;
    }

    maxId++;
    return {
      id: maxId,
      x: targetX,
      y: targetY,
      label: `V${i + 1}`,
    };
  });

  const edges: { from: number; to: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (matrix[i][j] !== 0) {
        edges.push({ from: vertices[i].id, to: vertices[j].id });
      }
    }
  }

  return { vertices, edges };
}

export function graphToMatrix(graph: Graph): number[][] {
  const n = graph.vertices.length;
  const idToIndex = new Map(graph.vertices.map((v, i) => [v.id, i]));
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (const e of graph.edges) {
    const i = idToIndex.get(e.from);
    const j = idToIndex.get(e.to);
    if (i !== undefined && j !== undefined) {
      matrix[i][j] = 1;
      matrix[j][i] = 1;
    }
  }
  return matrix;
}

export function generateResultText(
  graph: Graph,
  colorMap: ColorMap,
  algorithm: AlgorithmType,
  numColors: number,
  executionTimeMs: number,
  iterations: number,
  comparison: ComparisonResult[]
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("uk-UA", { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString("uk-UA");

  const algoName = getAlgorithmNameUA(algorithm);
  const complexity = algorithm === "greedy" ? "O(V^2)" : "O(k^V)";

  const timeDisplay = executionTimeMs === -1 ? "Таймаут" : (executionTimeMs === 0 ? "<0.001 мс" : `${executionTimeMs.toFixed(3)} мс`);
  const iterDisplay = executionTimeMs === -1 ? "—" : iterations.toString();

  let text = `============================================================\n`;
  text += `РЕЗУЛЬТАТИ РОЗФАРБОВУВАННЯ ГРАФА\n`;
  text += `Курсова робота: Розфарбовування графів\n`;
  text += `КПІ ім. І. Сікорського | Рибалко Т.С.\n`;
  text += `============================================================\n\n`;

  text += `Дата: ${dateStr}  Час: ${timeStr}\n`;
  text += `Алгоритм: ${algoName}\n`;
  text += `Теоретична складність: ${complexity}\n`;
  text += `Кількість кольорів: ${executionTimeMs === -1 ? "—" : numColors}\n`;
  text += `Кількість ітерацій: ${iterDisplay}\n`;
  text += `Час виконання: ${timeDisplay}\n\n`;

  if (comparison && comparison.length > 0) {
    text += `------------------------------------------------------------\n`;
    text += `ПОРІВНЯЛЬНИЙ АНАЛІЗ СКЛАДНОСТІ ТА ШВИДКОДІЇ:\n`;
    text += `------------------------------------------------------------\n`;
    comparison.forEach(r => {
      const name = getAlgorithmNameUA(r.algorithm).padEnd(36, " ");
      const comp = (r.algorithm === "greedy" ? "O(V^2)" : "O(k^V)").padEnd(8, " ");
      const iters = r.executionTimeMs === -1 ? "Таймаут".padEnd(10, " ") : `${r.iterations} ітер.`.padEnd(10, " ");
      const time = r.executionTimeMs === -1 ? "Таймаут" : (r.executionTimeMs === 0 ? "<0.001 мс" : `${r.executionTimeMs.toFixed(3)} мс`);

      text += `${name} | ${comp} | ${iters} | ${time}\n`;
    });
    text += `\n`;
  }

  text += `------------------------------------------------------------\n`;
  text += `ВЕРШИНИ ГРАФА:\n`;
  text += `------------------------------------------------------------\n`;
  graph.vertices.forEach(v => {
    const c = colorMap.get(v.id) ?? -1;
    const cName = c !== -1 ? `${c + 1} (${COLOR_NAMES_UA[c % COLOR_NAMES_UA.length]})` : "Не розфарбовано";
    text += `  ${v.label.padEnd(6, " ")} → Колір ${cName}\n`;
  });
  text += `\n`;

  text += `------------------------------------------------------------\n`;
  text += `РЕБРА ГРАФА:\n`;
  text += `------------------------------------------------------------\n`;
  graph.edges.forEach(e => {
    const from = graph.vertices.find(v => v.id === e.from)?.label || String(e.from);
    const to = graph.vertices.find(v => v.id === e.to)?.label || String(e.to);
    text += `  ${from} — ${to}\n`;
  });
  text += `\n`;

  text += `------------------------------------------------------------\n`;
  text += `МАТРИЦЯ СУМІЖНОСТІ:\n`;
  text += `------------------------------------------------------------\n`;
  const size = graph.vertices.length;
  const m = Array(size).fill(0).map(() => Array(size).fill(0));
  graph.edges.forEach(e => {
    const i = graph.vertices.findIndex(v => v.id === e.from);
    const j = graph.vertices.findIndex(v => v.id === e.to);
    if (i !== -1 && j !== -1) { m[i][j] = 1; m[j][i] = 1; }
  });

  text += `       ` + graph.vertices.map(v => v.label.padStart(3, " ")).join(" ") + `\n`;
  for (let i = 0; i < size; i++) {
    text += `${graph.vertices[i].label.padEnd(7, " ")}` + m[i].map(val => String(val).padStart(3, " ")).join(" ") + `\n`;
  }
  text += `\n`;

  text += `============================================================\n`;
  text += `СХЕМА РОЗФАРБУВАННЯ:\n`;
  text += `============================================================\n`;
  const colorGroups = new Map<number, string[]>();
  graph.vertices.forEach(v => {
    const c = colorMap.get(v.id) ?? -1;
    if (!colorGroups.has(c)) colorGroups.set(c, []);
    colorGroups.get(c)!.push(v.label);
  });
  [...colorGroups.entries()].sort((a, b) => a[0] - b[0]).forEach(([c, verts]) => {
    const cName = c !== -1 ? `${c + 1} (${COLOR_NAMES_UA[c % COLOR_NAMES_UA.length]})` : "Не розфарбовано";
    text += `  Колір ${cName}: ${verts.join(", ")}\n`;
  });
  text += `\n============================================================\n`;

  return text;
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateExampleGraph(type: "petersen" | "cycle" | "complete" | "bipartite"): Graph {
  const cx = 460;
  const cy = 230;

  switch (type) {
    case "cycle": {
      const n = 6;
      const r = 140;
      const vertices = Array.from({ length: n }, (_, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return { id: i, x: Math.round(cx + r * Math.cos(angle)), y: Math.round(cy + r * Math.sin(angle)), label: `V${i + 1}` };
      });
      const edges = vertices.map((v, i) => ({ from: v.id, to: vertices[(i + 1) % n].id }));
      return { vertices, edges };
    }
    case "complete": {
      const n = 5;
      const r = 140;
      const vertices = Array.from({ length: n }, (_, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        return { id: i, x: Math.round(cx + r * Math.cos(angle)), y: Math.round(cy + r * Math.sin(angle)), label: `V${i + 1}` };
      });
      const edges: { from: number; to: number }[] = [];
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          edges.push({ from: i, to: j });
      return { vertices, edges };
    }
    case "bipartite": {
      const gapY = 90;
      const startY = cy - gapY;
      const vertices = [
        { id: 0, x: cx - 160, y: startY, label: "V1" },
        { id: 1, x: cx - 160, y: startY + gapY, label: "V2" },
        { id: 2, x: cx - 160, y: startY + gapY * 2, label: "V3" },
        { id: 3, x: cx + 160, y: startY, label: "V4" },
        { id: 4, x: cx + 160, y: startY + gapY, label: "V5" },
        { id: 5, x: cx + 160, y: startY + gapY * 2, label: "V6" },
      ];
      const edges = [
        { from: 0, to: 3 }, { from: 0, to: 4 },
        { from: 1, to: 3 }, { from: 1, to: 5 },
        { from: 2, to: 4 }, { from: 2, to: 5 },
      ];
      return { vertices, edges };
    }
    case "petersen":
    default: {
      const rOuter = 150;
      const rInner = 70;
      const outer = Array.from({ length: 5 }, (_, i) => {
        const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
        return { id: i, x: Math.round(cx + rOuter * Math.cos(angle)), y: Math.round(cy + rOuter * Math.sin(angle)), label: `V${i + 1}` };
      });
      const inner = Array.from({ length: 5 }, (_, i) => {
        const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
        return { id: i + 5, x: Math.round(cx + rInner * Math.cos(angle)), y: Math.round(cy + rInner * Math.sin(angle)), label: `V${i + 6}` };
      });
      const vertices = [...outer, ...inner];
      const edges: { from: number; to: number }[] = [];
      for (let i = 0; i < 5; i++) edges.push({ from: i, to: (i + 1) % 5 });
      for (let i = 0; i < 5; i++) edges.push({ from: i, to: i + 5 });
      for (let i = 0; i < 5; i++) edges.push({ from: i + 5, to: ((i + 2) % 5) + 5 });
      return { vertices, edges };
    }
  }
}