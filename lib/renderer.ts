import { Graph, ColorMap, Vertex } from "./types";
import { getVertexColor } from "./utils";

const VERTEX_RADIUS = 24;
const EDGE_COLOR = "rgba(171, 199, 48, 0.3)";

export class GraphRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public render(
        graph: Graph,
        colorMap: ColorMap | undefined,
        selectedId: number | null,
        hoveredId: number | null,
        scale: number
    ) {
        this.drawEdges(graph, scale);
        this.drawVertices(graph, colorMap, selectedId, hoveredId, scale);
    }

    private drawEdges(graph: Graph, scale: number) {
        const ctx = this.ctx;
        for (const edge of graph.edges) {
            const v1 = graph.vertices.find((v) => v.id === edge.from);
            const v2 = graph.vertices.find((v) => v.id === edge.to);
            if (!v1 || !v2) continue;

            ctx.beginPath();
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
            ctx.strokeStyle = EDGE_COLOR;
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
        }
    }

    private drawVertices(
        graph: Graph,
        colorMap: ColorMap | undefined,
        selectedId: number | null,
        hoveredId: number | null,
        scale: number
    ) {
        const ctx = this.ctx;
        for (const vertex of graph.vertices) {
            const isSelected = selectedId === vertex.id;
            const isHovered = hoveredId === vertex.id;
            const hasColor = colorMap && colorMap.has(vertex.id);

            const fillColor = hasColor ? getVertexColor(colorMap.get(vertex.id)) : "#FFFFFF";

            ctx.beginPath();
            ctx.arc(vertex.x, vertex.y, VERTEX_RADIUS, 0, Math.PI * 2);

            if (isSelected) {
                ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
                ctx.shadowBlur = 24 / scale;
                ctx.shadowOffsetY = 12 / scale;
            } else if (isHovered) {
                ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
                ctx.shadowBlur = 16 / scale;
                ctx.shadowOffsetY = 6 / scale;
            } else {
                ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
                ctx.shadowBlur = 6 / scale;
                ctx.shadowOffsetY = 2 / scale;
            }

            ctx.fillStyle = fillColor;
            ctx.fill();

            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            ctx.beginPath();
            ctx.arc(vertex.x, vertex.y, VERTEX_RADIUS, 0, Math.PI * 2);
            if (isSelected) {
                ctx.strokeStyle = "rgba(53, 94, 59, 0.9)";
                ctx.lineWidth = 3 / scale;
            } else if (isHovered) {
                ctx.strokeStyle = "rgba(53, 94, 59, 0.6)";
                ctx.lineWidth = 2 / scale;
            } else {
                ctx.strokeStyle = "rgba(53, 94, 59, 0.3)";
                ctx.lineWidth = 1.5 / scale;
            }
            ctx.stroke();

            ctx.fillStyle = hasColor ? "#FFFFFF" : "#1B2B1B";
            ctx.font = `bold 13px 'JetBrains Mono', monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(vertex.label, vertex.x, vertex.y);
        }
    }
}