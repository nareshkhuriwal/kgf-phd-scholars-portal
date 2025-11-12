import React from 'react';
import { Paper, Typography, Box, Snackbar, Alert } from '@mui/material';
import { Document, Page } from 'react-pdf';
import { useDispatch, useSelector } from 'react-redux';

// styles
import '../../components/pdf/highlight.css';

// UI + overlays
import HighlightToolbar from '../pdf/HighlightToolbar'; // ← toolbar with mode, brush size, etc.
import HighlightOverlay from '../pdf/HighlightOverlay';     // ← rectangle overlay
import FreehandOverlay from '../pdf/FreehandOverlay';       // ← brush overlay

// store / utils
import { saveHighlights, clearHighlightsState } from '../../store/highlightsSlice';
import { toRelative } from '../../utils/url';

function PdfPaneInner({ pdfUrl, paperId }) {
  const dispatch = useDispatch();
  const { saving, fileUrl, error } = useSelector((s) => s.highlights);

  // ----- viewer state -----
  const [numPages, setNumPages] = React.useState(0);
  const [enabled, setEnabled] = React.useState(true);
  const [mode, setMode] = React.useState('brush'); // 'rect' | 'brush'

  const [colorHex, setColorHex]   = React.useState('#FFEB3B');
  const [alpha, setAlpha]         = React.useState(0.35);
  const [brushSize, setBrushSize] = React.useState(12);

  const [toast, setToast] = React.useState(null);

  // active URL (original or highlighted after save)
  const [activeUrl, setActiveUrl] = React.useState(() => toRelative(pdfUrl));
  React.useEffect(() => { setActiveUrl(toRelative(pdfUrl)); }, [pdfUrl]);

  // reset counts & local drawings when file changes
  React.useEffect(() => { setNumPages(0); setRects({}); setStrokes({}); }, [activeUrl]);

  // zoom (width-based)
  const [zoom, setZoom] = React.useState(1.0);
  const onZoomChange = React.useCallback((delta) => {
    setZoom((z) => Math.min(3, Math.max(0.5, +(z + delta).toFixed(2))));
  }, []);

  // base width based on container
  const viewerRef = React.useRef(null);
  const [baseWidth, setBaseWidth] = React.useState(900);
  React.useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const compute = () => setBaseWidth(Math.max(480, Math.floor(el.clientWidth - 24)));
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // keep page host exactly the same size as the internal PDF canvas
  const pageHostRefs = React.useRef({});  // { [pageNum]: HTMLElement }
  const canvasROs    = React.useRef({});  // { [pageNum]: ResizeObserver }

  const syncHostToCanvas = React.useCallback((pageNum) => {
    const host = pageHostRefs.current[pageNum];
    if (!host) return;
    const canvas = host.querySelector('.react-pdf__Page__canvas canvas');
    if (!canvas) return;
    host.style.width  = `${canvas.clientWidth}px`;
    host.style.height = `${canvas.clientHeight}px`;
  }, []);

  const watchCanvas = React.useCallback((pageNum) => {
    const host = pageHostRefs.current[pageNum];
    if (!host) return;
    const canvas = host.querySelector('.react-pdf__Page__canvas canvas');
    if (!canvas) return;
    canvasROs.current[pageNum]?.disconnect();
    const ro = new ResizeObserver(() => syncHostToCanvas(pageNum));
    ro.observe(canvas);
    canvasROs.current[pageNum] = ro;
    syncHostToCanvas(pageNum);
  }, [syncHostToCanvas]);

  React.useEffect(() => {
    return () => {
      Object.values(canvasROs.current).forEach((ro) => ro?.disconnect());
      canvasROs.current = {};
    };
  }, []);

  // ----- local drawings (both modes) -----
  // rectangles: { [page]: [{x,y,w,h}] }  (normalized 0..1)
  const [rects, setRects] = React.useState({});
  const onAddRect = (page, rect) =>
    setRects((prev) => ({ ...prev, [page]: [...(prev[page] || []), rect] }));

  // freehand strokes: { [page]: Stroke[] } (normalized points + size)
  const [strokes, setStrokes] = React.useState({});
  const onAddStroke = (page, stroke) =>
    setStrokes((prev) => ({ ...prev, [page]: [...(prev[page] || []), stroke] }));

  // undo / clear should affect current mode only
  const onUndo = () => {
    if (mode === 'brush') {
      setStrokes((prev) => {
        const pages = Object.keys(prev).map(Number).sort((a,b)=>b-a);
        for (const p of pages) {
          if ((prev[p] || []).length) {
            const next = { ...prev, [p]: prev[p].slice(0, -1) };
            if (!next[p].length) delete next[p];
            return next;
          }
        }
        return prev;
      });
    } else {
      setRects((prev) => {
        const c = { ...prev };
        const p = Object.keys(c).map(Number).sort((a,b)=>b-a).find(k => c[k]?.length);
        if (!p) return prev;
        c[p] = c[p].slice(0, -1);
        if (!c[p].length) delete c[p];
        return c;
      });
    }
  };
  const onClear = () => (mode === 'brush' ? setStrokes({}) : setRects({}));
  const canClear = mode === 'brush' ? Object.keys(strokes).length > 0
                                    : Object.keys(rects).length > 0;

  // ----- save / slice responses -----
  const onSave = () => {
    if (!paperId) {
      setToast({ severity: 'warning', msg: 'Paper ID missing — cannot save.' });
      return;
    }

    if (mode === 'brush') {
      const entries = Object.entries(strokes);
      if (!entries.length) {
        setToast({ severity: 'info', msg: 'No highlights to save.' });
        return;
      }
      const freehand = entries.map(([page, s]) => ({ page: Number(page), strokes: s }));
      dispatch(saveHighlights({
        paperId,
        replace: true,
        sourceUrl: activeUrl,
        mode: 'freehand',
        freehand,
        style: { color: colorHex, alpha, brushSize },
      }));
    } else {
      const highlights = Object.entries(rects).map(([page, r]) => ({ page: Number(page), rects: r }));
      if (!highlights.length) {
        setToast({ severity: 'info', msg: 'No highlights to save.' });
        return;
      }
      dispatch(saveHighlights({
        paperId,
        replace: true,
        sourceUrl: activeUrl,
        mode: 'rect',
        highlights,
        style: { color: colorHex, alpha },
      }));
    }
  };

  // switch to server-returned highlighted file
  React.useEffect(() => {
    if (fileUrl) {
      setActiveUrl(toRelative(fileUrl));
      setEnabled(false);
      setRects({});
      setStrokes({});
      setToast({ severity: 'success', msg: 'Saved. Showing highlighted PDF…' });
      dispatch(clearHighlightsState());
    }
  }, [fileUrl, dispatch]);

  // show error from slice
  React.useEffect(() => {
    if (error) {
      setToast({ severity: 'error', msg: error });
      dispatch(clearHighlightsState());
    }
  }, [error, dispatch]);

  // ----- render -----
  return (
    <Paper sx={{ height: '100%', border: '1px solid #eee', borderRadius: 2, p: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
        PDF Preview
      </Typography>

      {!activeUrl ? (
        <Typography variant="body2" color="text.secondary">
          No PDF attached. Upload a PDF in Library → Paper Files and refresh.
        </Typography>
      ) : (
        <>
          {/* Toolbar */}
          <Box sx={{ mb: 1 }}>
            <HighlightToolbar
              enabled={enabled}
              setEnabled={setEnabled}
              mode={mode}
              setMode={setMode}
              canUndo={canClear}
              onUndo={onUndo}
              canClear={canClear}
              onClear={onClear}
              onSave={onSave}
              color={colorHex}
              setColor={setColorHex}
              alpha={alpha}
              setAlpha={setAlpha}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              onZoomChange={onZoomChange}
              zoom={zoom}
              saving={saving}
            />
          </Box>

          {/* Viewer */}
          <Box
            ref={viewerRef}
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              ...(enabled && {
                '& .pdf-page canvas': { pointerEvents: 'none' },
                '& .pdf-page .react-pdf__Page__textContent, & .pdf-page .react-pdf__Page__annotations': {
                  pointerEvents: 'none',
                },
              }),
            }}
          >
            <Document
              key={activeUrl}
              file={activeUrl}
              options={{ disableRange: true }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  className="pdf-page"
                  ref={(el) => (pageHostRefs.current[pageNum] = el)}
                  style={{ position: 'relative', margin: '0 auto 16px', display: 'inline-block' }}
                >
                  <Page
                    pageNumber={pageNum}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={Math.round(baseWidth * zoom)}
                    onRenderSuccess={() => watchCanvas(pageNum)}
                  />

                  {enabled && (
                    mode === 'brush' ? (
                      <FreehandOverlay
                        pageNumber={pageNum}
                        strokes={strokes[pageNum] || []}
                        onAddStroke={onAddStroke}
                        color={colorHex}
                        alpha={alpha}
                        brushSize={brushSize}
                        enabled={enabled}
                      />
                    ) : (
                      <HighlightOverlay
                        pageNumber={pageNum}
                        highlights={rects[pageNum] || []}
                        onAddRect={onAddRect}
                        color={colorHex}
                        alpha={alpha}
                      />
                    )
                  )}
                </div>
              ))}
            </Document>
          </Box>
        </>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && <Alert severity={toast.severity}>{toast.msg}</Alert>}
      </Snackbar>
    </Paper>
  );
}

const PdfPane = React.memo(
  PdfPaneInner,
  (prev, next) => prev.pdfUrl === next.pdfUrl && prev.paperId === next.paperId
);

export default PdfPane;
