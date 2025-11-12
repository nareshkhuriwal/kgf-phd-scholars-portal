import React from 'react';
import PdfPage from './PdfPage';
import './pdf.css';
import { toRelative } from '../../utils/url';

import * as pdfjsLib from 'pdfjs-dist';
// IMPORTANT: get a URL string to the worker for Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Tell PDF.js where the worker lives
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfPane({ fileUrl, initialScale = 1.2, onHighlightsChange }) {
  const [doc, setDoc] = React.useState(null);
  const [viewports, setViewports] = React.useState([]);
  const [pages, setPages] = React.useState([]); // array of {canvasRef, viewport}
  const [highlights, setHighlights] = React.useState({}); // { [pageIndex]: [{id,x,y,w,h}] }
  const scaleRef = React.useRef(initialScale);
  const [activeUrl, setActiveUrl] = React.useState(() => toRelative(fileUrl));



  React.useEffect(() => {

    console.log("=====", activeUrl)
    let cancelled = false;
    (async () => {
      const loadingTask = pdfjsLib.getDocument(activeUrl);
      const pdf = await loadingTask.promise;
      if (cancelled) return;

      setDoc(pdf);
      const vps = [];
      const pgs = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // build viewport at current scale
        const vp = page.getViewport({ scale: scaleRef.current });
        vps.push(vp);
        pgs.push({ index: i, page, canvasRef: React.createRef() });
      }
      setViewports(vps);
      setPages(pgs);
    })();

    return () => { cancelled = true; };
  }, [activeUrl]);

  // Render pages to canvas
  React.useEffect(() => {
    (async () => {
      if (!doc || pages.length === 0) return;
      for (const [i, p] of pages.entries()) {
        const vp = viewports[i];
        if (!vp || !p.canvasRef.current) continue;
        const ctx = p.canvasRef.current.getContext('2d');
        p.canvasRef.current.width = vp.width;
        p.canvasRef.current.height = vp.height;
        await p.page.render({ canvasContext: ctx, viewport: vp }).promise;
      }
    })();
  }, [doc, pages, viewports]);

  const addHighlight = (pageIndex, rect) => {
    setHighlights(prev => {
      const arr = prev[pageIndex] ? [...prev[pageIndex]] : [];
      const id = `${pageIndex}-${Date.now()}-${arr.length}`;
      arr.push({ id, ...rect });
      const next = { ...prev, [pageIndex]: arr };
      onHighlightsChange?.(next);
      return next;
    });
  };

  // example public method to get highlights in PDF points (unscaled)
  const getHighlightsInPdfPoints = React.useCallback(() => {
    const out = [];
    Object.entries(highlights).forEach(([k, rects]) => {
      const idx = Number(k);
      const vp = viewports[idx - 1];
      if (!vp) return;
      const s = scaleRef.current;
      rects.forEach(r => {
        out.push({
          pageIndex: idx,
          x: r.x / s,
          y: r.y / s,
          w: r.w / s,
          h: r.h / s,
        });
      });
    });
    return out;
  }, [highlights, viewports]);

  // expose via ref if needed
  // useImperativeHandle(ref, () => ({ getHighlightsInPdfPoints }));

  console.log("pages: ", pages)
  return (
    <div className="pdf-pane">
      {pages.map((p, i) => (
        <PdfPage
          key={p.index}
          pageIndex={p.index}
          canvasRef={p.canvasRef}
          viewport={viewports[i]}
          pageHighlights={highlights[p.index] || []}
          onAddHighlight={addHighlight}
        />
      ))}
    </div>
  );
}
