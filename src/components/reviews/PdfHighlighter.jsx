// src/components/reviews/PdfHighlighter.jsx
import React, { useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box } from '@mui/material';
import { PDFDocument, rgb } from 'pdf-lib';
import { useDispatch, useSelector } from 'react-redux';
import HighlightToolbar from './../pdf/HighlightToolbar';
import { usePdfHighlights, toPdfRect } from '../../hooks/usePdfHighlights';
import { toRelative } from '../../utils/url';
import { uploadHighlightedPdf } from '../../store/highlightsSlice';

// --- Robust worker boot for Vite + ESM + React-PDF v7 (pdfjs-dist v4) ---
let workerBooted = false;

try {
  // 1) Prefer a real module Worker (fastest, most reliable)
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
  const worker = new Worker(workerUrl, { type: 'module' });
  pdfjs.GlobalWorkerOptions.workerPort = worker;
  workerBooted = true;
} catch (e) {
  console.warn('[pdfjs] module worker failed, will try workerSrc URL fallback:', e);
}

if (!workerBooted) {
  try {
    // 2) URL fallback – some envs still need workerSrc
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    workerBooted = true; // allow pdf.js to spin its own worker
  } catch (e) {
    console.warn('[pdfjs] workerSrc fallback failed:', e);
  }
}

if (!workerBooted) {
  // 3) Last resort – render without a worker (stable but slower)
  console.warn('[pdfjs] disabling worker – performance will be lower.');
  pdfjs.disableWorker = true;
}


class PdfErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { hasError: false }; }
  static getDerivedStateFromError(){ return { hasError: true }; }
  componentDidCatch(e, info){ console.error('PDF render error:', e, info); }
  render(){
    if (this.state.hasError) return <div style={{padding:12,color:'crimson'}}>Failed to render PDF.</div>;
    return this.props.children;
  }
}

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
// const withBust = (u) => (u ? `${u}${u.includes('?') ? '&' : '?'}v=${Date.now()}` : u);
const withBust = (u) => (u ? u.split('#')[0].split('?')[0] : u);

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
  onSaved,
  uploadUrl,
  canUpload = true,
  tokenFetchInit,
}) {
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const { uploading } = useSelector((s) => s.highlights || {});

  const {
    rects, drag, startDrag, moveDrag, endDrag,
    pageSizes, setPageRenderSize, clearLast, clearAll
  } = usePdfHighlights();

  const [activeUrl, setActiveUrl] = React.useState(() => canonicalize(toRelative(pdfUrl)));
  const [enabled, setEnabled] = React.useState(true);
  const [color, setColor] = React.useState('#FFEB3B');
  const [alpha, setAlpha] = React.useState(0.35);
  const [zoom, setZoom] = React.useState(1);
  const [numPages, setNumPages] = React.useState(0);      // 2) real page count

  React.useEffect(() => {
    if (pdfUrl) {
      setActiveUrl(canonicalize(toRelative(pdfUrl)));
      setNumPages(0); // force re-measure on URL change
    }
  }, [pdfUrl]);

  // inside component
  const memoFile = React.useMemo(
    () => (activeUrl ? { url: activeUrl, withCredentials: false } : null),
    [activeUrl]
  );

  // keep options stable. Start with range disabled for stability; re-enable later if you want.
  const memoOptions = React.useMemo(() => ({ disableRange: true }), []);


  const onZoomChange = (delta) => {
    setZoom((z) => Math.min(3, Math.max(0.5, parseFloat((z + delta).toFixed(2)))));
  };

  async function saveToServer(overwriteSame = false) {
    const canonical = canonicalize(activeUrl);
    const bytes = await fetch(canonical, { credentials: 'omit' }).then(r => r.arrayBuffer());

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

    console.log("uploadUrl: ", uploadUrl)
    const action = await dispatch(
      uploadHighlightedPdf({
        blob,
        uploadUrl,
        destUrl: overwriteSame ? canonical : undefined,
        overwrite: overwriteSame,
        fetchInit: tokenFetchInit,
      })
    );

    if (uploadHighlightedPdf.fulfilled.match(action)) {
      const nextUrl = action.payload?.url || action.payload?.raw?.url;
      if (nextUrl) setActiveUrl(withBust(canonicalize(toRelative(nextUrl))));
      onSaved && onSaved(action.payload?.raw || { url: nextUrl, path: action.payload?.path });
    } else {
      console.error('Upload failed:', action.payload);
    }
  }

  const canUndo = rects.length > 0;
  const canClear = rects.length > 0 && !uploading;


  console.log("activeUrl last stage 1: ", activeUrl)

  return (
    <Box ref={containerRef}
      sx={{ height: '100%', border: '1px solid #eee', borderRadius: 2, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ p: 1, borderBottom: '1px solid #eee', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 2 }}>
        <HighlightToolbar
          enabled={enabled}
          setEnabled={setEnabled}
          canUndo={canUndo}
          onUndo={clearLast}
          canClear={canClear}
          onClear={clearAll}
          onSave={() => saveToServer(false)}
          onSaveReplace={() => saveToServer(true)}
          color={color} setColor={setColor}
          alpha={alpha} setAlpha={setAlpha}
          onZoomChange={onZoomChange}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {memoFile && (
          <PdfErrorBoundary>

          {/* <Document
  key={activeUrl}
  file={{ url: activeUrl, withCredentials: false }}
  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
  onLoadError={(err) => console.error('react-pdf load error:', err)}
  options={{
    disableRange: true,           // <= set true for stability; turn off later if desired
    cMapUrl: 'cmaps/',            // optional if you ship cmaps
    cMapPacked: true,
  }}
> */}

  {/* <Document
  key={activeUrl}
  file={{ url: activeUrl, withCredentials: false }}
  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
  onLoadError={(err) => console.error('react-pdf load error:', err)}
  options={{ disableRange: true }}   // <- stability first
> */}

  <Document
    key={activeUrl}             // ensures fresh mount on URL change
    file={memoFile}             // memoized -> no noisy warnings
    options={memoOptions}       // memoized -> no noisy warnings
    loading={<Box sx={{ p: 2 }}>Loading PDF…</Box>}
    error={<Box sx={{ p: 2, color: 'error.main' }}>Failed to load PDF.</Box>}
    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
    onLoadError={(err) => console.error('react-pdf load error:', err)}
  >

            {Array.from({ length: numPages }, (_, idx) => (
              <PageWrapper
                key={idx}
                pageIndex={idx}
                rects={rects}
                drag={enabled ? drag : null}
                startDrag={enabled ? startDrag : () => {}}
                moveDrag={enabled ? moveDrag : () => {}}
                endDrag={endDrag}
                setPageRenderSize={setPageRenderSize}
                zoom={zoom}
                color={color}
                alpha={alpha}
              />
            ))}
          </Document>
          </PdfErrorBoundary>
        )}
      </Box>
    </Box>
  );
}

function PageWrapper({
  pageIndex, rects, drag, startDrag, moveDrag, endDrag, setPageRenderSize, zoom, color, alpha
}) {
  const wrapperRef = useRef(null);

  return (
    <div
      id={`p${pageIndex}`}
      ref={wrapperRef}
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
          // 3) use the local ref (no global querySelector)
          const canvas = wrapperRef.current?.querySelector('canvas');
          if (canvas) setPageRenderSize(pageIndex, canvas);
        }}
        onMouseDown={(e) => startDrag(pageIndex, e, e.currentTarget)}
      />
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
