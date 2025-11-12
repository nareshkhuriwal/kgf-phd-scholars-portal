// src/components/pdf/HighlightOverlay.jsx
import React from 'react';
import './highlight.css';

/**
 * Props:
 * - pageNumber (1-based)
 * - pageRef: ref to the page container (must have bounding box)
 * - scale: current zoom scale used by PDF.js (for visual only; we normalize anyway)
 * - highlights: array of rects for this page [{x,y,w,h}] normalized 0..1
 * - onAddRect(page, rect) -> void
 */

export default function HighlightOverlay({ pageNumber, highlights, onAddRect }) {
  const rootRef = React.useRef(null);
  const [drag, setDrag] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const getXY = (e) => {
    const el = rootRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
    };
  };

  const onDown = (e) => {
    const { x, y } = getXY(e);
    setDrag({ startX: x, startY: y, x, y });
    setIsDragging(true);
  };
  const onMove = (e) => {
    if (!isDragging) return;
    const { x, y } = getXY(e);
    setDrag((d) => ({ ...d, x, y }));
  };
  const onUp = () => {
    if (!isDragging || !drag) return;
    setIsDragging(false);
    const x0 = Math.min(drag.startX, drag.x);
    const y0 = Math.min(drag.startY, drag.y);
    const x1 = Math.max(drag.startX, drag.x);
    const y1 = Math.max(drag.startY, drag.y);
    const r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    if (r.w > 0.002 && r.h > 0.002) onAddRect(pageNumber, r);
    setDrag(null);
  };

  return (
    <div
      ref={rootRef}
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 9999,
        cursor: 'crosshair',
        pointerEvents: 'auto',
      }}
    >
      {(highlights || []).map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${r.x * 100}%`,
            top: `${r.y * 100}%`,
            width: `${r.w * 100}%`,
            height: `${r.h * 100}%`,
            background: 'rgba(255,235,59,0.35)',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        />
      ))}
      {isDragging && drag && (
        <div
          style={{
            position: 'absolute',
            left: `${Math.min(drag.startX, drag.x) * 100}%`,
            top: `${Math.min(drag.startY, drag.y) * 100}%`,
            width: `${Math.abs(drag.x - drag.startX) * 100}%`,
            height: `${Math.abs(drag.y - drag.startY) * 100}%`,
            background: 'rgba(255,235,59,0.35)',
            outline: '1px dashed rgba(0,0,0,0.35)',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
