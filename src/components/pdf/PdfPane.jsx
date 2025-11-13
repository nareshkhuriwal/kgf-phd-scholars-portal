// src/components/pdf/PdfPane.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import PdfPage from './PdfPage';
import HighlightToolbar from './HighlightToolbar';
import './pdf.css';
import { toRelative } from '../../utils/url';
import { saveHighlights } from '../../store/highlightsSlice';
import { Snackbar, Alert } from '@mui/material';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const ZOOM_STEP = 1.15;

function PdfPaneInner({ fileUrl, paperId, initialScale = 1.1, onHighlightsChange }) {
  const dispatch = useDispatch();

  // sync url
  const [activeUrl, setActiveUrl] = React.useState('');
  React.useEffect(() => { setActiveUrl(fileUrl ? toRelative(fileUrl) : ''); }, [fileUrl]);
  // React.useEffect(() => { setActiveUrl(fileUrl ? fileUrl : ''); }, [fileUrl]);

  // viewer state
  const [doc, setDoc] = React.useState(null);
  const [pages, setPages] = React.useState([]);
  const [viewports, setViewports] = React.useState([]);
  const [pageCount, setPageCount] = React.useState(0);
  const [naturalSizes, setNaturalSizes] = React.useState([]);

  // highlight style + enable
  const [enabled, setEnabled] = React.useState(true);
  const [mode, setMode] = React.useState('rect'); // brush reserved
  const [colorHex, setColorHex] = React.useState('#FFEB3B');
  const [alpha, setAlpha] = React.useState(0.35);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState(null); // {severity,msg}

  // stored in PDF points (scale=1)
  const [hlPoints, setHlPoints] = React.useState({});

  // zoom
  const [currentScale, setCurrentScale] = React.useState(initialScale);
  const scaleRef = React.useRef(initialScale);
  const paneRef = React.useRef(null);

  // reset when URL changes
  React.useEffect(() => {
    setDoc(null); setPages([]); setViewports([]); setNaturalSizes([]); setPageCount(0); setHlPoints({});
  }, [activeUrl]);

  // load
  React.useEffect(() => {
    let cancelled = false;
    if (!activeUrl) return;
    (async () => {
      const loadingTask = pdfjsLib.getDocument(activeUrl);
      const pdf = await loadingTask.promise;
      if (cancelled) return;
      setDoc(pdf); setPageCount(pdf.numPages);

      const _pages = [], _natural = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp1 = page.getViewport({ scale: 1 });
        _natural.push({ w: vp1.width, h: vp1.height });
        _pages.push({ index: i, page, canvasRef: React.createRef() });
      }
      setPages(_pages); setNaturalSizes(_natural);
    })();
    return () => { cancelled = true; };
  }, [activeUrl]);

  // viewports @ scale
  React.useEffect(() => {
    if (!pages.length) return;
    setViewports(pages.map(p => p.page.getViewport({ scale: currentScale })));
  }, [pages, currentScale]);

  // render canvases
  React.useEffect(() => {
    (async () => {
      if (!doc || !pages.length || !viewports.length) return;
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i], vp = viewports[i];
        if (!vp || !p.canvasRef.current) continue;
        const ctx = p.canvasRef.current.getContext('2d');
        p.canvasRef.current.width = vp.width;
        p.canvasRef.current.height = vp.height;
        await p.page.render({ canvasContext: ctx, viewport: vp }).promise;
      }
    })();
  }, [doc, pages, viewports]);

  // add rect (px -> points)
  const addHighlight = (pageIndex, rectPx) => {
    const s = currentScale;
    const toPts = v => v / s;
    const rectPts = {
      id: `${pageIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: toPts(rectPx.x), y: toPts(rectPx.y), w: toPts(rectPx.w), h: toPts(rectPx.h)
    };
    setHlPoints(prev => {
      const arr = prev[pageIndex] ? [...prev[pageIndex]] : [];
      arr.push(rectPts);
      const next = { ...prev, [pageIndex]: arr };
      onHighlightsChange?.(next);
      return next;
    });
  };

  // draw rects (points -> px)
  const highlightsForPagePx = (pageIndex) => {
    const s = currentScale;
    return (hlPoints[pageIndex] || []).map(r => ({ id: r.id, x: r.x * s, y: r.y * s, w: r.w * s, h: r.h * s }));
  };

  // undo / clear
  const canUndo = React.useMemo(() => Object.values(hlPoints).some(arr => (arr || []).length > 0), [hlPoints]);
  const onUndo = () => {
    setHlPoints(prev => {
      const pagesWithData = Object.keys(prev).map(Number).sort((a, b) => b - a); // last page first
      for (const p of pagesWithData) {
        const arr = prev[p] || [];
        if (arr.length) {
          const next = { ...prev, [p]: arr.slice(0, -1) };
          if (!next[p].length) delete next[p];
          return next;
        }
      }
      return prev;
    });
  };
  const onClear = () => setHlPoints({});

  // zoom helpers
  const onZoomChange = (delta) => {
    const next = delta > 0 ? currentScale * ZOOM_STEP : currentScale / ZOOM_STEP;
    scaleRef.current = next;
    setCurrentScale(next);
  };
  const onFitWidth = () => {
    const container = paneRef.current, n0 = naturalSizes[0];
    if (!container || !n0) return;
    const inner = container.clientWidth - 16;
    const s = Math.max(0.5, Math.min(3, inner / n0.w));
    scaleRef.current = s; setCurrentScale(s);
  };
  const onReset = () => { scaleRef.current = initialScale; setCurrentScale(initialScale); };

  React.useEffect(() => {
    const onResize = () => {
      const container = paneRef.current, vp0 = viewports[0];
      if (!container || !vp0) return;
      if (vp0.width > container.clientWidth) onFitWidth();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [viewports.length, naturalSizes.length]);

  // save (group by page, normalized)
  const handleSave = async () => {
    if (!paperId) return;
    const highlights = Object.entries(hlPoints).map(([pageStr, rects]) => {
      const page = Number(pageStr), nat = naturalSizes[page - 1];
      const norm = r => ({ x: +(r.x / nat.w).toFixed(6), y: +(r.y / nat.h).toFixed(6), w: +(r.w / nat.w).toFixed(6), h: +(r.h / nat.h).toFixed(6) });
      return { page, rects: rects.map(norm) };
    });
    if (!highlights.length) return;

    try {
      setSaving(true);
      await dispatch(saveHighlights({
        paperId, replace: true, sourceUrl: activeUrl, mode: 'rect',
        highlights, style: { color: colorHex, alpha }
      })).unwrap?.();
      setToast({ severity: 'success', msg: 'Highlights saved.' });
    } catch (e) {
      setToast({ severity: 'error', msg: e?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }

  };

  return (
    <div className="pdf-wrapper">
      {/* MUI toolbar */}
      <div style={{ padding: 8, border: '1px solid var(--mui-palette-divider,#e5e7eb)', borderRadius: 10, background: 'var(--mui-palette-background-paper,#fff)', marginBottom: 12 }}>
        <HighlightToolbar
          enabled={enabled} setEnabled={setEnabled}
          mode={mode} setMode={setMode}
          canUndo={canUndo} onUndo={onUndo}
          canClear={canUndo} onClear={onClear}
          onSave={handleSave}
          color={colorHex} setColor={setColorHex}
          alpha={alpha} setAlpha={setAlpha}
          onZoomChange={onZoomChange} zoom={currentScale}
          onFitWidth={onFitWidth} onReset={onReset}
          saving={saving}
        />
      </div>

      <div className="pdf-pane" ref={paneRef}>
        {pages.map((p, i) => (
          <PdfPage
            key={p.index}
            pageIndex={p.index}
            canvasRef={p.canvasRef}
            viewport={viewports[i]}
            pageHighlights={highlightsForPagePx(p.index)}
            onAddHighlight={addHighlight}
            enabled={enabled && mode === 'rect'}
            colorHex={colorHex}
            alpha={alpha}
          />
        ))}
      </div>


      {/* toast */}
     <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        // optional: nudge it away from the edges / under a fixed header
        sx={{ top: { xs: 8, sm: 16 }, right: 16 }}
      >
        {toast && <Alert severity={toast.severity}>{toast.msg}</Alert>}
      </Snackbar>


    </div>
  );
}

const PdfPane = React.memo(
  PdfPaneInner,
  (prev, next) => prev.fileUrl === next.fileUrl && prev.paperId === next.paperId
);
export default PdfPane;
