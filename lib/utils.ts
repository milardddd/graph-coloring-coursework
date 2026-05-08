// utils.ts — допоміжні функції

import { Graph, ColorMap, AlgorithmType } from "./types";

// Палітра кольорів для вершин (максимум 20 кольорів під ліміт вершин)
export const COLOR_PALETTE: string[] = [
  "#abc730", // 1. кислотно-оливковий
  "#ebcb4d", // 2. гірчичний
  "#f44336", // 3. коралово-червоний
  "#3f51b5", // 4. королівський синій
  "#e91e63", // 5. насичена маджента
  "#00bcd4", // 6. ціан
  "#9c27b0", // 7. щільний фіолетовий
  "#ff9800", // 8. бурштиновий
  "#2196f3", // 9. небесно-синій
  "#4caf50", // 10. трав'янисто-зелений
  "#ff5722", // 11. глибокий помаранчевий
  "#cddc39", // 12. лаймовий
  "#795548", // 13. шоколадний
  "#009688", // 14. смарагдовий
  "#c2185b", // 15. темно-малиновий
  "#607d8b", // 16. сіро-блакитний
  "#8bc34a", // 17. яблучно-зелений
  "#512da8", // 18. індиго
  "#d32f2f", // 19. карміновий
  "#00796b", // 20. темно-бірюзовий
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

// Конвертація матриці суміжності ↔ Graph
export function matrixToGraph(
  matrix: number[][],
  existingVertices?: { id: number; x: number; y: number; label: string }[]
): Graph {
  const n = matrix.length;

  const vertices = Array.from({ length: n }, (_, i) => {
    if (existingVertices && existingVertices[i]) return existingVertices[i];
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    // ФІКС: Ідеальний центр для десктопного екрану
    const cx = 460, cy = 230, r = Math.min(150, 40 * n);
    return {
      id: i,
      x: Math.round(cx + r * Math.cos(angle)),
      y: Math.round(cy + r * Math.sin(angle)),
      label: `V${i + 1}`,
    };
  });

  const edges: { from: number; to: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (matrix[i][j] !== 0) {
        edges.push({ from: i, to: j });
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

// Збереження результатів у текстовий файл
export function generateResultText(
  graph: Graph,
  colorMap: ColorMap,
  algorithmName: string,
  numColors: number,
  executionTimeMs: number
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("uk-UA");
  const timeStr = now.toLocaleTimeString("uk-UA");

  const lines: string[] = [
    "=".repeat(60),
    "РЕЗУЛЬТАТИ РОЗФАРБОВУВАННЯ ГРАФА",
    "Курсова робота: Розфарбовування графів",
    "КПІ ім. І. Сікорського | Рибалко Т.С.",
    "=".repeat(60),
    "",
    `Дата: ${dateStr}  Час: ${timeStr}`,
    `Алгоритм: ${algorithmName}`,
    `Кількість кольорів: ${numColors}`,
    `Час виконання: ${executionTimeMs.toFixed(4)} мс`,
    "",
    "-".repeat(60),
    "ВЕРШИНИ ГРАФА:",
    "-".repeat(60),
  ];

  for (const v of graph.vertices) {
    const colorIdx = colorMap.get(v.id);
    const colorName =
      colorIdx !== undefined ? COLOR_NAMES_UA[colorIdx % COLOR_NAMES_UA.length] : "—";
    lines.push(`  ${v.label.padEnd(6)} → Колір ${(colorIdx ?? -1) + 1} (${colorName})`);
  }

  lines.push("");
  lines.push("-".repeat(60));
  lines.push("РЕБРА ГРАФА:");
  lines.push("-".repeat(60));

  if (graph.edges.length === 0) {
    lines.push("  (граф не має ребер)");
  } else {
    for (const e of graph.edges) {
      const vFrom = graph.vertices.find((v) => v.id === e.from);
      const vTo = graph.vertices.find((v) => v.id === e.to);
      lines.push(`  ${vFrom?.label ?? e.from} — ${vTo?.label ?? e.to}`);
    }
  }

  lines.push("");
  lines.push("-".repeat(60));
  lines.push("МАТРИЦЯ СУМІЖНОСТІ:");
  lines.push("-".repeat(60));

  const matrix = graphToMatrix(graph);
  const header = "     " + graph.vertices.map((v) => v.label.padStart(4)).join("");
  lines.push(header);
  for (let i = 0; i < matrix.length; i++) {
    const row = graph.vertices[i].label.padEnd(5) + matrix[i].map((v) => String(v).padStart(4)).join("");
    lines.push(row);
  }

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("СХЕМА РОЗФАРБУВАННЯ:");
  lines.push("=".repeat(60));

  const colorGroups = new Map<number, string[]>();
  for (const v of graph.vertices) {
    const c = colorMap.get(v.id) ?? -1;
    if (!colorGroups.has(c)) colorGroups.set(c, []);
    colorGroups.get(c)!.push(v.label);
  }

  for (const [colorIdx, verts] of [...colorGroups.entries()].sort((a, b) => a[0] - b[0])) {
    const colorName = colorIdx >= 0 ? COLOR_NAMES_UA[colorIdx % COLOR_NAMES_UA.length] : "—";
    lines.push(`  Колір ${colorIdx + 1} (${colorName}): ${verts.join(", ")}`);
  }

  lines.push("");
  lines.push("=".repeat(60));

  return lines.join("\n");
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

// Генерація прикладних графів
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