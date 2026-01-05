import React from 'react';
import HighlightLayer from './HighlightLayer';

const MIN_BRUSH_DIST = 2;

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function PdfPage({
  pageIndex,
  canvasRef,
  viewport,
  pageHighlights = [],   // rects (px)
  pageBrushes = [],      // brushes (px)
  onAddHighlight,
  onAddBrush,
  enabled = true,
  mode = 'rect',
  colorHex,
  alpha,
  brushSize = 12,
}) {
  const containerRef = React.useRef(null);

  // ----- RECT STATE -----
  const [draftRect, setDraftRect] = React.useState(null);
  const rectDrag = React.useRef({ dragging: false, start: null });
  const [cursor, setCursor] = React.useState({ x: 0, y: 0 });

  // ----- BRUSH STATE -----
  const brushRef = React.useRef({ drawing: false, points: [] });

  // ----- UTILS -----
  const toLocal = (evt) => {
    const b = containerRef.current.getBoundingClientRect();
    return {
      x: evt.clientX - b.left,
      y: evt.clientY - b.top,
    };
  };

  // ----- MOUSE DOWN -----
  const onMouseDown = (e) => {
    if (!enabled || e.button !== 0) return;
    const p = toLocal(e);

    if (mode === 'rect') {
      rectDrag.current.dragging = true;
      rectDrag.current.start = p;
      setDraftRect({ x: p.x, y: p.y, w: 0, h: 0 });
    }

    if (mode === 'brush') {
      brushRef.current.drawing = true;
      brushRef.current.points = [p];
    }
  };

  // ----- MOUSE MOVE -----
  const onMouseMove = (e) => {
    if (!enabled) return;
    const p = toLocal(e);

    // RECT update
    if (mode === 'rect' && rectDrag.current.dragging) {
      const s = rectDrag.current.start;
      setDraftRect({
        x: Math.min(s.x, p.x),
        y: Math.min(s.y, p.y),
        w: Math.abs(p.x - s.x),
        h: Math.abs(p.y - s.y),
      });
    }

    // BRUSH update (optimized)
    if (mode === 'brush' && brushRef.current.drawing) {
      const pts = brushRef.current.points;
      if (!pts.length || distance(pts[pts.length - 1], p) > MIN_BRUSH_DIST) {
        pts.push(p);
      }
    }

    setCursor(p);

  };

  // ----- MOUSE UP / LEAVE -----
  const finishInteraction = () => {
    // RECT commit
    if (mode === 'rect' && rectDrag.current.dragging) {
      rectDrag.current.dragging = false;
      if (draftRect && draftRect.w > 4 && draftRect.h > 4) {
        onAddHighlight(pageIndex, draftRect);
      }
      setDraftRect(null);
    }

    // BRUSH commit
    if (mode === 'brush' && brushRef.current.drawing) {
      onAddBrush(pageIndex, {
        points: brushRef.current.points,
        size: brushSize,
      });
      brushRef.current.drawing = false;
      brushRef.current.points = [];
    }
  };

  if (!viewport) return null;

  return (
    <div
      ref={containerRef}
      className="pdf-page"
      style={{
        width: viewport.width,
        height: viewport.height,
        cursor: enabled
          ? (mode === 'rect' ? 'crosshair' : 'none')
          : 'default',

      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={finishInteraction}
      onMouseLeave={finishInteraction}
    >
      <canvas ref={canvasRef} className="pdf-canvas" />

      {enabled && mode === 'brush' && (
        <div
          style={{
            position: 'absolute',
            left: cursor.x - brushSize / 2,
            top: cursor.y - brushSize / 2,
            width: brushSize,
            height: brushSize,
            borderRadius: '50%',
            border: `2px solid ${colorHex}`,
            background: `rgba(255,255,255,0.2)`,
            pointerEvents: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}


      {/* Existing rectangles */}
      <HighlightLayer
        key={`hl-${pageIndex}`}   
        pageWidth={viewport.width}
        pageHeight={viewport.height}
        highlights={pageHighlights}
        colorHex={colorHex}
        alpha={alpha}
      />

      {/* Draft rectangle */}
      {draftRect && (
        <div
          className="hl-draft"
          style={{
            left: draftRect.x,
            top: draftRect.y,
            width: draftRect.w,
            height: draftRect.h,
          }}
        />
      )}

      {/* Brush strokes */}
      <svg
        width={viewport.width}
        height={viewport.height}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {pageBrushes.map((s) => (
          <polyline
            key={s.id}
            points={s.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colorHex}
            strokeOpacity={alpha}
            strokeWidth={s.size}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </div>
  );
}
