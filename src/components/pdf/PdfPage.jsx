import React from 'react';
import HighlightLayer from './HighlightLayer';

export default function PdfPage({
  pageIndex,
  canvasRef,
  viewport,
  pageHighlights = [],
  onAddHighlight,
  enabled = true,
  colorHex = '#FFEB3B',
  alpha = 0.35,
}) {
  const containerRef = React.useRef(null);
  const [draftRect, setDraftRect] = React.useState(null);
  const dragRef = React.useRef({ dragging: false, start: null });

  // cursor position for the + badge
  const [cursor, setCursor] = React.useState({ x: 0, y: 0 });

  const toLocal = React.useCallback((evt) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const b = el.getBoundingClientRect();
    const x = evt.clientX - b.left;
    const y = evt.clientY - b.top;
    return {
      x: Math.max(0, Math.min(x, b.width)),
      y: Math.max(0, Math.min(y, b.height)),
    };
  }, []);

  const onMouseDown = (e) => {
    if (!enabled || e.button !== 0) return;
    dragRef.current.dragging = true;
    const start = toLocal(e);
    dragRef.current.start = start;
    setDraftRect({ x: start.x, y: start.y, w: 0, h: 0 });
  };

  const onMouseMove = (e) => {
    if (!enabled) return;
    const cur = toLocal(e);
    setCursor(cur); // move the + badge

    if (!dragRef.current.dragging) return;
    const s = dragRef.current.start;
    setDraftRect({
      x: Math.min(s.x, cur.x),
      y: Math.min(s.y, cur.y),
      w: Math.abs(cur.x - s.x),
      h: Math.abs(cur.y - s.y),
    });
  };

  const onMouseUp = () => {
    if (!enabled || !dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (draftRect && draftRect.w > 4 && draftRect.h > 4) onAddHighlight(pageIndex, draftRect);
    setDraftRect(null);
  };

  if (!viewport) return <div className="pdf-page-skeleton" />;

  const isDragging = dragRef.current.dragging;

  return (
    <div
      ref={containerRef}
      className="pdf-page"
      style={{
        width: viewport.width,
        height: viewport.height,
        cursor: enabled ? 'crosshair' : 'default',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseUp}
      onMouseUp={onMouseUp}
    >
      <canvas ref={canvasRef} className="pdf-canvas" />

      <HighlightLayer
        pageWidth={viewport.width}
        pageHeight={viewport.height}
        highlights={pageHighlights}
        colorHex={colorHex}
        alpha={alpha}
      />

      {/* Draft rubber-band */}
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

      {/* Plus indicator that follows the mouse when enabled */}
      {enabled && (
        <div
          className={`cursor-plus ${isDragging ? 'dragging' : ''}`}
          style={{
            left: cursor.x,
            top: cursor.y,
            // during drag, tint to highlight color
            ...(isDragging ? { ['--cursor-plus-bg']: colorHex } : null),
          }}
        >
          +
        </div>
      )}
    </div>
  );
}
