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
import { debounce } from '../../utils/debounce';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const isDev = import.meta.env.VITE_APP_ENV === 'DEV';
const ZOOM_STEP = 1.15;
const DEFAULT_BRUSH_SIZE = 12;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4.0;


function PdfPaneInner({ fileUrl, paperId, initialScale = 1.1, onHighlightsChange }) {
  const dispatch = useDispatch();

  /* ---------------- URL ---------------- */
  const [activeUrl, setActiveUrl] = React.useState('');
  /* ---------------- LOADING ---------------- */
  const [loading, setLoading] = React.useState(false);
  const [loadingMsg, setLoadingMsg] = React.useState('Loading PDF…');


  React.useEffect(() => {
    setActiveUrl(fileUrl ? (isDev ? fileUrl : fileUrl) : '');
  }, [fileUrl]);


  /* ---------------- PDF STATE ---------------- */
  const [doc, setDoc] = React.useState(null);
  const [pages, setPages] = React.useState([]);
  const [viewports, setViewports] = React.useState([]);
  const [naturalSizes, setNaturalSizes] = React.useState([]);

  /* ---------------- UI STATE ---------------- */
  const [enabled, setEnabled] = React.useState(true);
  const [mode, setMode] = React.useState('rect');
  const [colorHex, setColorHex] = React.useState('#FFEB3B');
  const [alpha, setAlpha] = React.useState(0.35);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  /* ---------------- HIGHLIGHT STATE ---------------- */
  const [hlRects, setHlRects] = React.useState({});
  const [hlBrushes, setHlBrushes] = React.useState({});

  const hlRectsRef = React.useRef({});
  const hlBrushesRef = React.useRef({});


  /* ---------------- ZOOM ---------------- */
  const [currentScale, setCurrentScale] = React.useState(initialScale);
  const scaleRef = React.useRef(initialScale);
  const paneRef = React.useRef(null);

  const containerRef = React.useRef(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const userActionRef = React.useRef(false);

  /* ---------------- RESET ON URL CHANGE ---------------- */
  React.useEffect(() => {
    setDoc(null);
    setPages([]);
    setViewports([]);
    setNaturalSizes([]);
    setHlRects({});
    setHlBrushes({});
  }, [activeUrl]);

  /* ---------------- LOAD PDF ---------------- */
  // React.useEffect(() => {
  //   let cancelled = false; 
  //   if (!activeUrl) return;

  //   (async () => {
  //     const pdf = await pdfjsLib.getDocument(activeUrl).promise;
  //     if (cancelled) return;

  //     setDoc(pdf);
  //     const _pages = [];
  //     const _natural = [];

  //     for (let i = 1; i <= pdf.numPages; i++) {
  //       const page = await pdf.getPage(i);
  //       const vp = page.getViewport({ scale: 1 });
  //       _natural.push({ w: vp.width, h: vp.height });
  //       _pages.push({ index: i, page, canvasRef: React.createRef() });
  //     }

  //     setPages(_pages);
  //     setNaturalSizes(_natural);
  //   })();

  //   return () => { cancelled = true; };
  // }, [activeUrl]);


  React.useEffect(() => {
    hlRectsRef.current = hlRects;
  }, [hlRects]);

  React.useEffect(() => {
    hlBrushesRef.current = hlBrushes;
  }, [hlBrushes]);

  /* ---------------- LOAD PDF (with progress) ---------------- */

  React.useEffect(() => {
    let cancelled = false;
    if (!activeUrl) return;

    setLoading(true);
    setLoadingMsg('Loading PDF…');
    console.log('Loading PDF from', activeUrl);

    (async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(activeUrl);

        loadingTask.onProgress = ({ loaded, total }) => {
          if (total) {
            const pct = Math.round((loaded / total) * 100);
            setLoadingMsg(`Loading PDF… ${pct}%`);
          }
        };

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setDoc(pdf);
        setLoadingMsg('Preparing pages…');

        const _pages = [];
        const _natural = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          _natural.push({ w: vp.width, h: vp.height });
          _pages.push({ index: i, page, canvasRef: React.createRef() });
        }

        setPages(_pages);
        setNaturalSizes(_natural);
      } catch (err) {
        console.error('PDF load failed', err);

        if (!cancelled) {
          setToast({ severity: 'error', msg: 'Failed to load PDF.' });
          setLoading(false);               // ✅ STOP LOADER
          setLoadingMsg('');               // optional but clean
        }
      }

    })();

    return () => {
      cancelled = true;
    };
  }, [activeUrl]);

  /* ---------------- VIEWPORTS ---------------- */
  React.useEffect(() => {
    if (!pages.length) return;
    setViewports(pages.map(p => p.page.getViewport({ scale: currentScale })));
  }, [pages, currentScale]);

  /* ---------------- RENDER PAGES ---------------- */
  // React.useEffect(() => {
  //   if (!doc || !pages.length || !viewports.length) return;
  //   (async () => {
  //     for (let i = 0; i < pages.length; i++) {
  //       const { page, canvasRef } = pages[i];
  //       const vp = viewports[i];
  //       if (!canvasRef.current) continue;
  //       const ctx = canvasRef.current.getContext('2d');
  //       canvasRef.current.width = vp.width;
  //       canvasRef.current.height = vp.height;
  //       await page.render({ canvasContext: ctx, viewport: vp }).promise;
  //     }
  //   })();
  // }, [doc, pages, viewports]);
  React.useEffect(() => {
    if (!doc || !pages.length || !viewports.length) return;

    (async () => {
      try {
        setLoadingMsg('Rendering pages…');

        for (let i = 0; i < pages.length; i++) {
          const { page, canvasRef } = pages[i];
          const vp = viewports[i];
          if (!canvasRef.current) continue;

          const ctx = canvasRef.current.getContext('2d');
          canvasRef.current.width = vp.width;
          canvasRef.current.height = vp.height;

          await page.render({ canvasContext: ctx, viewport: vp }).promise;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [doc, pages, viewports]);


  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };


  React.useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);



  /* ---------------- ADD RECT ---------------- */
  const addRect = (page, rPx) => {
    const s = currentScale;
    userActionRef.current = true;

    const rect = {
      id: crypto.randomUUID(),
      x: rPx.x / s,
      y: rPx.y / s,
      w: rPx.w / s,
      h: rPx.h / s,
    };

    setHlRects(prev => {
      const next = { ...prev, [page]: [...(prev[page] || []), rect] };
      onHighlightsChange?.(next);
      return next;
    });
  };

  /* ---------------- ADD BRUSH ---------------- */
  const addBrush = (page, strokePx) => {
    const s = currentScale;
    userActionRef.current = true;

    const stroke = {
      id: crypto.randomUUID(),
      size: strokePx.size / s,
      points: strokePx.points.map(p => ({ x: p.x / s, y: p.y / s })),
    };

    setHlBrushes(prev => ({
      ...prev,
      [page]: [...(prev[page] || []), stroke],
    }));
  };

  /* ---------------- PX CONVERSION ---------------- */
  const rectsPx = page =>
    (hlRects[page] || []).map(r => ({
      ...r,
      x: r.x * currentScale,
      y: r.y * currentScale,
      w: r.w * currentScale,
      h: r.h * currentScale,
    }));

  const brushesPx = page =>
    (hlBrushes[page] || []).map(b => ({
      ...b,
      size: b.size * currentScale,
      points: b.points.map(p => ({ x: p.x * currentScale, y: p.y * currentScale })),
    }));

  /* ---------------- UNDO / CLEAR ---------------- */
  const canUndo = React.useMemo(
    () =>
      Object.values(hlRects).some(a => a.length) ||
      Object.values(hlBrushes).some(a => a.length),
    [hlRects, hlBrushes]
  );


  const onUndo = () => {
    userActionRef.current = true;

    setHlRects(prev => {
      const pages = Object.keys(prev).map(Number).sort((a, b) => b - a);
      for (const p of pages) {
        const arr = prev[p];
        if (arr?.length) {
          const next = { ...prev, [p]: arr.slice(0, -1) };
          if (!next[p].length) delete next[p];
          return next;
        }
      }
      return prev;
    });
  };

  const onClear = () => {
    userActionRef.current = true;

    setHlRects({});
    setHlBrushes({});
  };

  React.useEffect(() => {
    const el = paneRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (!e.ctrlKey) return;       // ⛔ normal scroll untouched

      e.preventDefault();           // ⛔ stop page zoom / scroll

      const delta = e.deltaY < 0 ? 1 : -1;
      const next =
        delta > 0
          ? scaleRef.current * ZOOM_STEP
          : scaleRef.current / ZOOM_STEP;

      setScaleSafe(next);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);



  const pinchRef = React.useRef({
    dist: null,
    scale: currentScale,
  });

  React.useEffect(() => {
    const el = paneRef.current;
    if (!el) return;

    const distance = (t1, t2) =>
      Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        pinchRef.current.dist = distance(e.touches[0], e.touches[1]);
        pinchRef.current.scale = scaleRef.current;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || pinchRef.current.dist == null) return;

      e.preventDefault();

      const newDist = distance(e.touches[0], e.touches[1]);
      const ratio = newDist / pinchRef.current.dist;
      const next = pinchRef.current.scale * ratio;

      setScaleSafe(next);
    };

    const onTouchEnd = () => {
      pinchRef.current.dist = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  /* ---------------- AUTOSAVE ---------------- */


  React.useEffect(() => {
    return () => autosaveRef.current.cancel();
  }, []);


  React.useEffect(() => {
    if (!userActionRef.current) return;
    if (naturalSizes.length === 0) return;

    if (
      Object.keys(hlRects).length === 0 &&
      Object.keys(hlBrushes).length === 0
    ) {
      return;
    }

    autosaveRef.current();
  }, [hlRects, hlBrushes, naturalSizes]);

  /* ---------------- ZOOM HELPERS ---------------- */

  const setScaleSafe = (next) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    scaleRef.current = clamped;
    setCurrentScale(clamped);
  };


  const onZoomChange = (delta) => {
    const next = delta > 0 ? currentScale * ZOOM_STEP : currentScale / ZOOM_STEP;
    scaleRef.current = next;
    setCurrentScale(next);
    setScaleSafe(next);
  };

  const onFitWidth = () => {
    const el = paneRef.current;
    const n0 = naturalSizes[0];
    if (!el || !n0) return;
    const s = Math.min(3, (el.clientWidth - 16) / n0.w);
    scaleRef.current = s;
    setCurrentScale(s);
  };

  const onReset = () => {
    scaleRef.current = initialScale;
    setCurrentScale(initialScale);
    setScaleSafe(initialScale);
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    if (!paperId) {
      setToast({ severity: 'error', msg: 'Invalid paper.' });
      return;
    }
    console.log('AUTO-SAVE TRIGGERED', {
      rects: hlRects,
      brushes: hlBrushes,
    });

    const rectsState = hlRectsRef.current;
    const brushesState = hlBrushesRef.current;
      
    console.log('AUTO-SAVE SNAPSHOT', {
      rectsState,
      brushesState,
    });


    // ---------- build rect payload ----------
    const rectPayload = Object.entries(rectsState).map(([p, rs]) => {
      const nat = naturalSizes[p - 1];
      if (!nat) return null;

      const rects = rs
        .map(r => ({
          x: +(r.x / nat.w).toFixed(6),
          y: +(r.y / nat.h).toFixed(6),
          w: +(r.w / nat.w).toFixed(6),
          h: +(r.h / nat.h).toFixed(6),
        }))
        .filter(r => r.w > 0 && r.h > 0);

      return rects.length ? { page: +p, rects } : null;
    }).filter(Boolean);

    // ---------- build brush payload ----------
    const brushPayload = Object.entries(brushesState).map(([p, bs]) => {
      const nat = naturalSizes[p - 1];
      if (!nat) return null;

      const strokes = bs
        .map(s => ({
          size: +(s.size / nat.w).toFixed(6),
          points: s.points
            .map(pt => ({
              x: +(pt.x / nat.w).toFixed(6),
              y: +(pt.y / nat.h).toFixed(6),
            }))
            .filter(pt => pt.x >= 0 && pt.x <= 1 && pt.y >= 0 && pt.y <= 1),
        }))
        .filter(s => s.points.length >= 2);

      return strokes.length ? { page: +p, strokes } : null;
    }).filter(Boolean);

    // ---------- HARD GUARD ----------
    if (rectPayload.length === 0 && brushPayload.length === 0) {
      setToast({ severity: 'warning', msg: 'No highlights to save.' });
      return;
    }

    // ---------- final payload ----------
    const payload = {
      paperId,
      replace: true,
      sourceUrl: activeUrl,
      style: { color: colorHex, alpha },
    };

    if (rectPayload.length > 0) {
      payload.highlights = rectPayload;
    }

    if (brushPayload.length > 0) {
      payload.brushHighlights = brushPayload;
    }

    try {
      setSaving(true);
      await dispatch(saveHighlights(payload)).unwrap();
      userActionRef.current = false;

      setToast({ severity: 'success', msg: 'Highlights saved.' });
    } catch (err) {
      console.error('Save highlights failed', err);
      setToast({
        severity: 'error',
        msg: err?.message || 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };


  const autosaveRef = React.useRef(
    debounce(() => {
      handleSave();
    }, 800)
  );



  /* ---------------- RENDER ---------------- */
  return (
    // <div className="pdf-wrapper">
    <div
      ref={containerRef}
      className={`pdf-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
    >

      <HighlightToolbar
        enabled={enabled} setEnabled={setEnabled}
        mode={mode} setMode={setMode}
        canUndo={canUndo} onUndo={onUndo}
        canClear={canUndo} onClear={onClear}
        onSave={handleSave}
        color={colorHex} setColor={setColorHex}
        alpha={alpha} setAlpha={setAlpha}
        brushSize={DEFAULT_BRUSH_SIZE}
        onZoomChange={onZoomChange}
        onFitWidth={onFitWidth}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        onReset={onReset}
        saving={saving}
      />

      {/* -------- PDF Loading Overlay -------- */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div className="pdf-loader" />
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              color: '#444',
              fontWeight: 500,
            }}
          >
            {loadingMsg}
          </div>
        </div>
      )}


      <div className="pdf-pane" ref={paneRef}>
        {pages.map((p, i) => (
          <PdfPage
            key={p.index}
            pageIndex={p.index}
            canvasRef={p.canvasRef}
            viewport={viewports[i]}
            pageHighlights={rectsPx(p.index)}
            pageBrushes={brushesPx(p.index)}
            onAddHighlight={addRect}
            onAddBrush={addBrush}
            enabled={enabled}
            mode={mode}
            colorHex={colorHex}
            alpha={alpha}
            brushSize={DEFAULT_BRUSH_SIZE}
          />
        ))}
      </div>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          top: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 16 },
        }}
      >
        {toast && (
          <Alert
            severity={toast.severity}
            variant="filled"
            sx={{ minWidth: 280 }}
          >
            {toast.msg}
          </Alert>
        )}
      </Snackbar>

    </div>
  );
}

const PdfPane = React.memo(
  PdfPaneInner,
  (a, b) => a.fileUrl === b.fileUrl && a.paperId === b.paperId
);

export default PdfPane;
