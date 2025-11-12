import React from 'react';
import './highlight.css';

export default function FreehandOverlay({
  pageNumber,
  strokes = [],
  onAddStroke,
  color = '#FFEB3B',
  alpha = 0.35,
  brushSize = 12,
  enabled = true,
}) {
  const hostRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const drawingRef = React.useRef({ isDown: false, points: [] });

  const hexToRGBA = (hex, a) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n>>16)&255}, ${(n>>8)&255}, ${n&255}, ${a})`;
  };
  const getCtx = () => canvasRef.current?.getContext('2d') || null;

  const drawStroke = (ctx, stroke) => {
    if (!stroke?.points || stroke.points.length < 2) return;
    const c = canvasRef.current; if (!c) return;
    const px = Math.max(1, stroke.size * c.clientWidth);
    ctx.lineWidth = px; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = hexToRGBA(stroke.color || '#FFEB3B', stroke.alpha ?? 0.35);
    ctx.beginPath();
    stroke.points.forEach((p, i) => {
      const x = p.x * c.clientWidth, y = p.y * c.clientHeight;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  const redrawAll = React.useCallback(() => {
    const ctx = getCtx(); const c = canvasRef.current; if (!ctx || !c) return;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of strokes) drawStroke(ctx, s);
    const pts = drawingRef.current.points;
    if (pts && pts.length > 1) {
      drawStroke(ctx, { points: pts, size: brushSize / Math.max(1, c.clientWidth), color, alpha });
    }
  }, [strokes, color, alpha, brushSize]);

  const sizeCanvasToHost = React.useCallback(() => {
    const host = hostRef.current, c = canvasRef.current; if (!host || !c) return;
    const dpr = window.devicePixelRatio || 1, w = host.clientWidth || 1, h = host.clientHeight || 1;
    c.style.width = `${w}px`; c.style.height = `${h}px`;
    c.width = Math.max(1, Math.floor(w * dpr)); c.height = Math.max(1, Math.floor(h * dpr));
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawAll();
  }, [redrawAll]);

  React.useEffect(() => {
    sizeCanvasToHost();
    const ro = new ResizeObserver(sizeCanvasToHost);
    if (hostRef.current) ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, [sizeCanvasToHost]);

  React.useEffect(() => { redrawAll(); }, [redrawAll]);

  const eventToNorm = (e) => {
    const c = canvasRef.current, r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  };

  const onPointerDown = (e) => {
    if (!enabled) return;
    if (e.button != null && e.button !== 0) return;
    const pt = eventToNorm(e);
    drawingRef.current.isDown = true;
    drawingRef.current.points = [pt];
    e.currentTarget.setPointerCapture?.(e.pointerId);
    redrawAll();
  };
  const onPointerMove = (e) => {
    if (!enabled || !drawingRef.current.isDown) return;
    const pt = eventToNorm(e);
    const arr = drawingRef.current.points;
    const last = arr[arr.length - 1];
    if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) > 0.002) {
      arr.push(pt); redrawAll();
    }
  };
  const onPointerUp = () => {
    if (!enabled || !drawingRef.current.isDown) return;
    drawingRef.current.isDown = false;
    const pts = drawingRef.current.points || []; drawingRef.current.points = [];
    if (pts.length > 1) {
      const c = canvasRef.current;
      onAddStroke?.(pageNumber, {
        points: pts,
        size: brushSize / Math.max(1, c.clientWidth),
        color, alpha,
      });
    }
    redrawAll();
  };

  return (
    <div ref={hostRef} style={{ position: 'absolute', inset: 0, zIndex: 9999,
                                pointerEvents: enabled ? 'auto' : 'none',
                                cursor: enabled ? 'crosshair' : 'default' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
