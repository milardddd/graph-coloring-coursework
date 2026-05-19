"use client";
import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from "react";
import { Graph, ColorMap, Vertex } from "@/lib/types";
import { getVertexColor } from "@/lib/utils";
import { GraphRenderer } from "@/lib/renderer";

const VERTEX_RADIUS = 24;

interface Props {
  graph: Graph;
  colorMap?: ColorMap;
  onGraphChange: (g: Graph) => void;
}

export default function GraphCanvas({ graph, colorMap, onGraphChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredVertex, setHoveredVertex] = useState<number | null>(null);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hasPanned, setHasPanned] = useState(false);

  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const neededWidth = Math.floor(rect.width * dpr);
    const neededHeight = Math.floor(rect.height * dpr);

    if (canvas.width !== neededWidth || canvas.height !== neededHeight) {
      canvas.width = neededWidth;
      canvas.height = neededHeight;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    const renderer = new GraphRenderer(ctx);
    renderer.render(
      graph,
      colorMap ?? undefined,
      selectedId,
      hoveredVertex,
      scale
    );

  }, [graph, colorMap, selectedId, hoveredVertex, pan, scale]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const handleWheelEvent = (e: WheelEvent) => {
      if (graph.vertices.length === 0) return;

      e.preventDefault();
      const zoomSensitivity = 0.002;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.2, scale * (1 + delta)), 3);

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const graphX = (screenX - pan.x) / scale;
      const graphY = (screenY - pan.y) / scale;

      setPan({
        x: screenX - graphX * newScale,
        y: screenY - graphY * newScale,
      });
      setScale(newScale);
    };

    if (canvas) canvas.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => { if (canvas) canvas.removeEventListener('wheel', handleWheelEvent); };

  }, [pan, scale, graph.vertices.length]);

  const getScreenPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getGraphPos = (screenX: number, screenY: number) => {
    return { x: (screenX - pan.x) / scale, y: (screenY - pan.y) / scale };
  };

  const getVertexAt = (x: number, y: number): Vertex | null => {
    for (let i = graph.vertices.length - 1; i >= 0; i--) {
      const v = graph.vertices[i];
      if (Math.sqrt((v.x - x) ** 2 + (v.y - y) ** 2) <= VERTEX_RADIUS + 4 / scale) return v;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: screenX, y: screenY } = getScreenPos(e);
    const { x: graphX, y: graphY } = getGraphPos(screenX, screenY);
    const hit = getVertexAt(graphX, graphY);

    if (e.button === 2) {
      if (hit) deleteVertex(hit.id);
      return;
    }

    if (hit) {
      setDragging(hit.id);
      setDragOffset({ x: graphX - hit.x, y: graphY - hit.y });
      if (selectedId !== null && selectedId !== hit.id) {
        addEdge(selectedId, hit.id);
        setSelectedId(null);
      } else setSelectedId(hit.id);
    } else {
      if (selectedId !== null) {
        setSelectedId(null);
      }
      setIsPanning(true);
      setPanStart({ x: screenX, y: screenY });
      setHasPanned(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: screenX, y: screenY } = getScreenPos(e);
    const { x: graphX, y: graphY } = getGraphPos(screenX, screenY);

    if (isPanning) {
      const dx = screenX - panStart.x;
      const dy = screenY - panStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setHasPanned(true);

      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: screenX, y: screenY });
      return;
    }

    if (dragging !== null) {
      const newVertices = graph.vertices.map((v) =>
        v.id === dragging ? { ...v, x: graphX - dragOffset.x, y: graphY - dragOffset.y } : v
      );
      onGraphChange({ ...graph, vertices: newVertices });
      return;
    }

    setHoveredVertex(getVertexAt(graphX, graphY)?.id ?? null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      if (!hasPanned && e.button === 0) {
        const { x: screenX, y: screenY } = getScreenPos(e);
        const { x: graphX, y: graphY } = getGraphPos(screenX, screenY);
        addVertex(graphX, graphY);
      }
    }
    setDragging(null);
  };

  const addVertex = (x: number, y: number) => {
    if (graph.vertices.length >= 20) {
      alert("Досягнуто ліміт: максимальна кількість вершин — 20.");
      return;
    }

    const nextId = graph.vertices.length > 0
      ? Math.max(...graph.vertices.map((v) => v.id)) + 1
      : 0;

    const existingNumbers = graph.vertices
      .map(v => parseInt(v.label.replace(/\D/g, '')))
      .filter(n => !isNaN(n));
    const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    onGraphChange({
      ...graph,
      vertices: [...graph.vertices, { id: nextId, x, y, label: `V${nextNum}` }]
    });
  };

  const deleteVertex = (id: number) => {
    setSelectedId(null);
    onGraphChange({ vertices: graph.vertices.filter((v) => v.id !== id), edges: graph.edges.filter((e) => e.from !== id && e.to !== id) });
  };

  const addEdge = (fromId: number, toId: number) => {
    if (!graph.edges.some((e) => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId))) {
      onGraphChange({ ...graph, edges: [...graph.edges, { from: fromId, to: toId }] });
    }
  };

  const handleRecenter = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || graph.vertices.length === 0) {
      setPan({ x: 0, y: 0 });
      setScale(1);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const v of graph.vertices) {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    }

    const padding = 60;
    const graphWidth = Math.max(maxX - minX, 1);
    const graphHeight = Math.max(maxY - minY, 1);

    const scaleX = rect.width / (graphWidth + padding * 2);
    const scaleY = rect.height / (graphHeight + padding * 2);
    const newScale = Math.min(scaleX, scaleY, 1.5);

    const graphCx = (minX + maxX) / 2;
    const graphCy = (minY + maxY) / 2;

    setPan({
      x: rect.width / 2 - graphCx * newScale,
      y: rect.height / 2 - graphCy * newScale
    });
    setScale(newScale);
  }, [graph.vertices]);

  const prevVertsCount = useRef(-1);

  useLayoutEffect(() => {
    const currentCount = graph.vertices.length;
    const prevCount = prevVertsCount.current;

    if (currentCount > 0 && (prevCount === -1 || Math.abs(currentCount - prevCount) > 1)) {
      handleRecenter();

      requestAnimationFrame(() => {
        handleRecenter();
      });
    }

    prevVertsCount.current = currentCount;
  }, [graph.vertices.length, handleRecenter]);

  return (
    <div className="relative w-full rounded-2xl border border-border bg-background shadow-sm overflow-hidden animate-fade-in group">
      <canvas
        ref={canvasRef}
        className={`relative z-10 w-full h-auto aspect-[2/1] ${isPanning ? 'cursor-grabbing' : dragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />

      {(pan.x !== 0 || pan.y !== 0 || scale !== 1) && (
        <button
          onClick={handleRecenter}
          className="absolute top-3 right-3 z-20 px-3 py-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-lg text-xs font-mono font-bold text-foreground hover:bg-foreground/5 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
        >
          ⌂ Центрувати
        </button>
      )}

      {graph.vertices.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-background/90 backdrop-blur-md px-8 py-5 rounded-xl border border-border shadow-sm text-center font-mono text-sm space-y-4">
            <p className="text-foreground font-bold text-base uppercase tracking-wider">
              Клікніть на полотно, щоб додати вершину
            </p>
            <div className="space-y-2 text-foreground/60 text-xs sm:text-sm">
              <p>
                <span className="text-foreground/80 font-bold">Затиснути порожнє місце</span> → переміщення полотна
              </p>
              <p>
                <span className="text-foreground/80 font-bold">Коліщатко миші</span> → масштабування
              </p>
              <p>
                <span className="text-foreground/80 font-bold">Клік по двох вершинах</span> → додати ребро
              </p>
              <p>
                <span className="text-foreground/80 font-bold">Правий клік по вершині</span> → видалити
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}