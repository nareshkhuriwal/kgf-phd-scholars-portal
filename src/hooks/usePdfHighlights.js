// src/hooks/usePdfHighlights.js
import * as React from 'react';

export function usePdfHighlights() {
  const [rects, setRects] = React.useState([]); // [{pageIndex,x,y,w,h} in screen px]
  const [drag, setDrag] = React.useState(null); // {pageIndex,x0,y0,x1,y1}
  const [pageSizes, setPageSizes] = React.useState({}); // {idx:{renderW,renderH}}

  const startDrag = (pageIndex, e, el) => {
    const box = el.getBoundingClientRect();
    setDrag({ pageIndex, x0: e.clientX - box.left, y0: e.clientY - box.top });
  };
  const moveDrag = (e, el) => {
    if (!drag) return;
    const box = el.getBoundingClientRect();
    setDrag(d => ({ ...d, x1: e.clientX - box.left, y1: e.clientY - box.top }));
  };
  const endDrag = () => {
    if (!drag || drag.x1 == null) { setDrag(null); return; }
    const x = Math.min(drag.x0, drag.x1);
    const y = Math.min(drag.y0, drag.y1);
    const w = Math.abs(drag.x1 - drag.x0);
    const h = Math.abs(drag.y1 - drag.y0);
    if (w > 2 && h > 2) setRects(r => [...r, { pageIndex: drag.pageIndex, x, y, w, h }]);
    setDrag(null);
  };

  const setPageRenderSize = (idx, canvas) => {
    if (!canvas) return;
    setPageSizes(s => ({ ...s, [idx]: { renderW: canvas.width, renderH: canvas.height } }));
  };

  const clearLast = () => setRects(r => r.slice(0, -1));
  const clearAll = () => setRects([]);

  return { rects, drag, startDrag, moveDrag, endDrag, pageSizes, setPageRenderSize, clearLast, clearAll };
}

// screen → PDF points
export function toPdfRect(screenRect, renderW, renderH, pdfW, pdfH) {
  const x = (screenRect.x / renderW) * pdfW;
  const width = (screenRect.w / renderW) * pdfW;

  const yTopPdf = pdfH - (screenRect.y / renderH) * pdfH;
  const yBottomPdf = pdfH - ((screenRect.y + screenRect.h) / renderH) * pdfH;

  return { x, y: yBottomPdf, width, height: yTopPdf - yBottomPdf };
}
