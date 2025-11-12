// src/components/reviews/PdfHighlighter.jsx
import React, { useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { Box } from '@mui/material';
import { PDFDocument, rgb } from 'pdf-lib';
import { useDispatch, useSelector } from 'react-redux';

import HighlightToolbar from './../pdf/HighlightToolbar'; // <-- use the pro toolbar you shared
import { usePdfHighlights, toPdfRect } from '../../hooks/usePdfHighlights';
import { toRelative } from '../../utils/url';
import { uploadHighlightedPdf } from '../../store/highlightsSlice';

// --- helpers ---
const canonicalize = (u) => {
  try {
    const url = new URL(u);
    url.pathname = url.pathname.replace(/\/{2,}/g, '/');
    return url.toString();
  } catch {
    return (u || '').replace(/(?<!:)\/{2,}/g, '/');
  }
};
const withBust = (u) => (u ? `${u}${u.includes('?') ? '&' : '?'}v=${Date.now()}` : u);
const hexToRgb01 = (hex) => {
  const h = (hex || '').replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(f.slice(0, 2), 16);
  const g = parseInt(f.slice(2, 4), 16);
  const b = parseInt(f.slice(4, 6), 16);
  return [r / 255, g / 255, b / 255];
};

export default function PdfHighlighter({
  pdfUrl,
  onSaved,            // (json) => void
  uploadUrl,          // API endpoint to POST FormData {file}
  canUpload = true,
  tokenFetchInit,     // optional fetch init (headers/credentials)
}) {
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const { uploading } = useSelector((s) => s.highlights || {});

  // drawing state from hook
  const {
    rects, drag, startDrag, moveDrag, endDrag,
    pageSizes, setPageRenderSize, clearLast, clearAll
  } = usePdfHighlights();

  // viewer state
  const [activeUrl, setActiveUrl] = React.useState(() => canonicalize(toRelative(pdfUrl)));
  const [enabled, setEnabled] = React.useState(true);
  const [color, setColor] = React.useState('#FFEB3B');
  const [alpha, setAlpha] = React.useState(0.35);
  const [zoom, setZoom] = React.useState(1);

  // keep in sync if parent changes pdfUrl
  React.useEffect(() => {
    if (pdfUrl) setActiveUrl(canonicalize(toRelative(pdfUrl)));
  }, [pdfUrl]);

  const onZoomChange = (delta) => {
    setZoom((z) => {
      const next = Math.min(3, Math.max(0.5, parseFloat((z + delta).toFixed(2))));
      return next;
    });
  };

  async function saveToServer(overwriteSame = false) {
    // fetch, draw, upload
    const canonical = canonicalize(activeUrl);
    const bytes = await fetch(canonical, tokenFetchInit).then((r) => r.arrayBuffer());
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();

    const [r01, g01, b01] = hexToRgb01(color);

    for (const r of rects) {
      const page = pages[r.pageIndex];
      if (!page) continue;
      const { width: pdfW, height: pdfH } = page.getSize();
      const size = pageSizes[r.pageIndex];
      if (!size) continue;

      const { renderW, renderH } = size;
      const g = toPdfRect(r, renderW, renderH, pdfW, pdfH);

      page.drawRectangle({
        x: g.x,
        y: g.y,
        width: g.width,
        height: g.height,
        color: rgb(r01, g01, b01),
        opacity: alpha,
        borderOpacity: 0,
      });
    }

    const out = await doc.save();
    const blob = new Blob([out], { type: 'application/pdf' });

    if (!canUpload) return;

    const action = await dispatch(
      uploadHighlightedPdf({
        blob,
        uploadUrl,
        destUrl: overwriteSame ? canonical : undefined, // overwrite same file if true
        overwrite: overwriteSame,
        fetchInit: tokenFetchInit,
      })
    );

    if (uploadHighlightedPdf.fulfilled.match(action)) {
      const nextUrl = action.payload?.url || action.payload?.raw?.url;
      // re-open the fresh file (with cache bust)
      if (nextUrl) setActiveUrl(withBust(canonicalize(nextUrl)));
      onSaved && onSaved(action.payload?.raw || { url: nextUrl, path: action.payload?.path });
    } else {
      console.error('Upload failed:', action.payload);
    }
  }

  const canUndo = rects.length > 0;
  const canClear = rects.length > 0 && !uploading;

  return (
    <Box
      ref={containerRef}
      sx={{ height: '100%', border: '1px solid #eee', borderRadius: 2, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
    >
      {/* Professional Toolbar */}
<Box
  sx={{
    p: 1,
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    bgcolor: 'background.paper',
    zIndex: 2,              // above pages
  }}
>        <HighlightToolbar
          enabled={enabled}
          setEnabled={setEnabled}
          canUndo={canUndo}
          onUndo={clearLast}
          canClear={canClear}
          onClear={clearAll}
          onSave={() => saveToServer(false)}
          onSaveReplace={() => saveToServer(true)}
          // optional features
          color={color} setColor={setColor}
          alpha={alpha} setAlpha={setAlpha}
          onZoomChange={onZoomChange}
        />
      </Box>

      {/* PDF */}
<Box sx={{ flex: 1, overflow: 'auto', p: 1 /* small padding keeps first page clear */ }}>
        <Document file={activeUrl} loading={<Box sx={{ p: 2 }}>Loading PDF…</Box>}>
          {Array.from({ length: 50 }).map((_, idx) => (
            <PageWrapper
              key={idx}
              pageIndex={idx}
              rects={rects}
              drag={enabled ? drag : null}
              startDrag={enabled ? startDrag : () => {}}
              moveDrag={enabled ? moveDrag : () => {}}
              endDrag={enabled ? endDrag : () => {}}
              setPageRenderSize={setPageRenderSize}
              zoom={zoom}
              color={color}
              alpha={alpha}
            />
          ))}
        </Document>
      </Box>
    </Box>
  );
}

function PageWrapper({
  pageIndex, rects, drag, startDrag, moveDrag, endDrag, setPageRenderSize, zoom, color, alpha
}) {
  return (
    <div
      id={`p${pageIndex}`}
      style={{ position: 'relative', margin: '12px auto', width: 'fit-content' }}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onMouseMove={(e) => moveDrag(e, e.currentTarget)}
    >
      <Page
        pageNumber={pageIndex + 1}
        scale={zoom}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        onRenderSuccess={() => {
          const canvas = document.querySelector(`#p${pageIndex} canvas`);
          if (canvas) setPageRenderSize(pageIndex, canvas);
        }}
        onMouseDown={(e) => startDrag(pageIndex, e, e.currentTarget)}
      />
      {/* overlay */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {rects.filter(r => r.pageIndex === pageIndex).map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={color} opacity={alpha} />
        ))}
        {drag && drag.pageIndex === pageIndex && drag.x1 != null && (
          <rect
            x={Math.min(drag.x0, drag.x1)}
            y={Math.min(drag.y0, drag.y1)}
            width={Math.abs(drag.x1 - drag.x0)}
            height={Math.abs(drag.y1 - drag.y0)}
            fill={color}
            opacity={Math.min(1, alpha + 0.1)}
          />
        )}
      </svg>
    </div>
  );
}
