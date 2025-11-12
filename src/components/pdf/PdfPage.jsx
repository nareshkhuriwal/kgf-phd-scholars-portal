import React from 'react';
import HighlightLayer from './HighlightLayer';

/**
 * Props:
 * - pageIndex: number
 * - canvasRef: ref to the rendered pdf.js canvas for this page
 * - viewport: pdf.js viewport (contains scale, rotation)
 * - pageHighlights: [{id, x, y, w, h}]
 * - onAddHighlight(pageIndex, rectPx) => void
 */
export default function PdfPage({
  pageIndex,
  canvasRef,
  viewport,
  pageHighlights = [],
  onAddHighlight,
}) {
  const containerRef = React.useRef(null);
  const [draftRect, setDraftRect] = React.useState(null);
  const dragRef = React.useRef({ dragging: false, start: null });

  // Convert global mouse to page-local px (already scaled)
  const toLocal = React.useCallback((evt) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const b = el.getBoundingClientRect(); // page container box
    const x = evt.clientX - b.left;
    const y = evt.clientY - b.top;
    // clamp
    return {
      x: Math.max(0, Math.min(x, b.width)),
      y: Math.max(0, Math.min(y, b.height)),
    };
  }, []);

  const onMouseDown = (e) => {
    // only left click, avoid toolbar drags
    if (e.button !== 0) return;
    dragRef.current.dragging = true;
    dragRef.current.start = toLocal(e);
    setDraftRect({
      x: dragRef.current.start.x,
      y: dragRef.current.start.y,
      w: 0,
      h: 0,
    });
  };

  const onMouseMove = (e) => {
    if (!dragRef.current.dragging) return;
    const cur = toLocal(e);
    const s = dragRef.current.start;

    const x = Math.min(s.x, cur.x);
    const y = Math.min(s.y, cur.y);
    const w = Math.abs(cur.x - s.x);
    const h = Math.abs(cur.y - s.y);

    setDraftRect({ x, y, w, h });
  };

  const onMouseUp = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;

    if (draftRect && draftRect.w > 4 && draftRect.h > 4) {
      // Persist highlight in page pixel space (already scaled with viewport)
      onAddHighlight(pageIndex, draftRect);
    }
    setDraftRect(null);
  };

  // Smooth interaction overlay
  return (
    <div
      ref={containerRef}
      className="pdf-page"
      style={{ position: 'relative', width: viewport.width, height: viewport.height }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseUp}
      onMouseUp={onMouseUp}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {/* Final highlights */}
      <HighlightLayer
        pageWidth={viewport.width}
        pageHeight={viewport.height}
        highlights={pageHighlights}
      />
      {/* Draft rubber-band */}
      {draftRect && (
        <div
          className="hl-draft"
          style={{
            position: 'absolute',
            left: draftRect.x,
            top: draftRect.y,
            width: draftRect.w,
            height: draftRect.h,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
