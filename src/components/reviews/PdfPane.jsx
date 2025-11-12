// src/pages/library/PdfPane.jsx
import React from 'react';
import { Paper, Typography, Box, Snackbar, Alert } from '@mui/material';
import { Document, Page } from 'react-pdf';
import { useDispatch, useSelector } from 'react-redux';

import '../../components/pdf/highlight.css'; // from earlier
import HighlightToolbar from '../../components/pdf/HighlightToolbar';
import HighlightOverlay from '../../components/pdf/HighlightOverlay';
import { saveHighlights, clearHighlightsState } from '../../store/highlightsSlice';
import { toRelative } from '../../utils/url';


function PdfPaneInner({ pdfUrl, paperId }) {

  const dispatch = useDispatch();
  const { saving, fileUrl, error } = useSelector((s) => s.highlights);

  const [numPages, setNumPages] = React.useState(0);
  const [enabled, setEnabled] = React.useState(true);
  const [hl, setHl] = React.useState({}); // { [page]: [{x,y,w,h}] }
  const [toast, setToast] = React.useState(null);
  // NEW: color & opacity for highlights
  const [colorHex, setColorHex]   = React.useState('#FFEB3B'); // yellow
  const [alpha, setAlpha]         = React.useState(0.35);      // 0..1

  // NEW: keep an active URL the viewer uses (original → highlighted after save)
  const [activeUrl, setActiveUrl] = React.useState(() => toRelative(pdfUrl));
  // React.useEffect(() => { setActiveUrl(toRelative(pdfUrl)); }, [pdfUrl]);
  React.useEffect(() => { setActiveUrl(pdfUrl); }, [pdfUrl]);

  React.useEffect(() => { setNumPages(0); }, [activeUrl]); // clean re-init on switch


  // keep a ref per page container to position overlay
  const pageRefs = React.useRef({}); // { [page]: element }

  // const pdfUrl = '/storage/library/2025/11/CDpWtY1I9VDIkZhi2hNFzVOagAOdbrJsztwgKJEM.pdf';

  // open returned PDF / show errors from slice
  React.useEffect(() => {
    if (fileUrl) {
      // Switch pane to show highlighted, keep your toast
      // setActiveUrl(toRelative(fileUrl));
      setActiveUrl(fileUrl);

      setEnabled(false);
      setHl({});
      setToast({ severity: 'success', msg: 'Saved. Showing highlighted PDF…' });
      dispatch(clearHighlightsState());
    }
  }, [fileUrl, dispatch]);

  React.useEffect(() => {
    if (error) {
      setToast({ severity: 'error', msg: error });
      dispatch(clearHighlightsState());
    }
  }, [error, dispatch]);


  const onAddRect = (page, rect) => {
    setHl(prev => ({ ...prev, [page]: [...(prev[page] || []), rect] }));
  };
  const onUndo = () => {
    setHl(prev => {
      const c = { ...prev };
      const p = Object.keys(c).map(Number).sort((a, b) => b - a).find(k => c[k]?.length);
      if (!p) return prev;
      c[p] = c[p].slice(0, -1);
      if (!c[p].length) delete c[p];
      return c;
    });
  };
  const onClear = () => setHl({});

  const onSave = () => {
    const highlights = Object.entries(hl).map(([page, rects]) => ({
      page: Number(page),
      rects,
    }));
    if (!paperId) {
      setToast({ severity: 'warning', msg: 'Paper ID missing — cannot save.' });
      return;
    }
    if (!highlights.length) {
      setToast({ severity: 'info', msg: 'No highlights to save.' });
      return;
    }
    // dispatch(saveHighlights({ paperId, highlights, replace: true }));
    // dispatch(saveHighlights({ paperId, highlights, replace: false, sourceUrl: activeUrl }));

    dispatch(saveHighlights({
      paperId,
      highlights,
      replace: false,
      sourceUrl: activeUrl,
      style: { color: colorHex, alpha }   // <- if you store these in PdfPane state
    }));

  };
  // Zoom (1.0 = 100%)
  const [zoom, setZoom] = React.useState(1.0);
  const onZoomChange = React.useCallback((delta) => {
    setZoom((z) => {
      const next = Math.min(3, Math.max(0.5, +(z + delta).toFixed(2))); // clamp 50%–300%
      return next;
    });
  }, []);

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
          <Box sx={{ mb: 1 }}>
            <HighlightToolbar
              enabled={enabled}
              setEnabled={setEnabled}
              canUndo={Object.keys(hl).length > 0}
              onUndo={onUndo}
              canClear={Object.keys(hl).length > 0}
              onClear={onClear}
              onSave={onSave}
               // NEW: wire color/opacity into the toolbar UI
              color={colorHex}
              setColor={setColorHex}
              alpha={alpha}
              setAlpha={setAlpha}
               onZoomChange={onZoomChange}   // ← enable Zoom buttons
              // optional visual feedback in the toolbar (if you want to show %):
              zoom={zoom}
            />
          </Box>


          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              ...(enabled && {
                // when ON, block canvas from taking mouse events
                '& .pdf-page canvas': { pointerEvents: 'none' },
                // if you later enable layers, block them too:
                '& .pdf-page .react-pdf__Page__textContent, & .pdf-page .react-pdf__Page__annotations': {
                  pointerEvents: 'none',
                },
              }),
            }}
          >
            <Document
              key={activeUrl}
              file={activeUrl}               // ← just the string
              options={{ disableRange: true }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >

              {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
                <div
                  key={pageNum}
                  className="pdf-page"
                  style={{ position: 'relative', margin: '0 auto 16px', width: 'fit-content' }}
                >
                  <Page
                    pageNumber={pageNum}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    scale={zoom}            // ← apply zoom

                  />
                  {enabled && (
                    <HighlightOverlay
                      pageNumber={pageNum}
                      highlights={hl[pageNum] || []}
                      onAddRect={onAddRect}
                       // (optional) if your overlay supports preview color/alpha,
                      // pass them through; otherwise you can omit these props.
                      color={colorHex}
                      alpha={alpha}
                    />
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

const PdfPane = React.memo(PdfPaneInner, (prev, next) => prev.pdfUrl === next.pdfUrl && prev.paperId === next.paperId);
export default PdfPane;
